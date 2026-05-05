import { Router } from 'express';
import { getDatabase } from '../db/index.js';
import { Photo } from '../db/schema.js';
import * as path from 'path';
import * as fs from 'fs';
import exifReader from 'exif-reader';

const router = Router();

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

// 递归扫描目录获取所有图片文件
function scanDirectory(dirPath: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      // 递归扫描子目录
      files.push(...scanDirectory(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// 从图片文件读取 EXIF 拍摄时间
function getExifDate(filePath: string): string | null {
  try {
    const buffer = fs.readFileSync(filePath);
    const exif = exifReader(buffer);
    if (exif && exif.Photo && exif.Photo.DateTimeOriginal) {
      // EXIF DateTimeOriginal 格式: "YYYY:MM:DD HH:MM:SS"
      const dt = exif.Photo.DateTimeOriginal;
      return dt.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    }
  } catch (err) {
    // 忽略读取错误
  }

  // 备用：从父文件夹名称提取日期
  const dirName = path.basename(path.dirname(filePath));
  // 尝试匹配常见日期格式: 2018_08_19, 20190630, 2019_01_20 等
  const datePatterns = [
    /^(\d{4})_(\d{2})_(\d{2})$/,           // 2018_08_19
    /^(\d{4})(\d{2})(\d{2})$/,            // 20190630
    /^(\d{4})_(\d{2})_(\d{2})_pre$/,      // 20190702_pre
  ];

  for (const pattern of datePatterns) {
    const match = dirName.match(pattern);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  return null;
}

// POST /api/photos/scan - 扫描照片目录
router.post('/scan', async (req, res) => {
  const { path: scanPath } = req.body;

  if (!scanPath) {
    return res.status(400).json({ error: 'Scan path is required' });
  }

  if (!fs.existsSync(scanPath)) {
    return res.status(404).json({ error: 'Directory not found' });
  }

  const stats = fs.statSync(scanPath);
  if (!stats.isDirectory()) {
    return res.status(400).json({ error: 'Path is not a directory' });
  }

  const db = getDatabase();
  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // 递归扫描获取所有图片文件
    const imageFiles = scanDirectory(scanPath);

    for (const filePath of imageFiles) {
      const file = path.basename(filePath);

      try {
        const existing = db.prepare('SELECT id FROM photos WHERE path = ?').get(filePath);
        if (existing) {
          skipped++;
          continue;
        }

        const fileStats = fs.statSync(filePath);
        // 尝试读取 EXIF 拍摄时间
        const takenAt = getExifDate(filePath);
        const photo = {
          filename: file,
          path: filePath,
          size: fileStats.size,
          width: 0,
          height: 0,
          taken_at: takenAt,
          created_at: new Date().toISOString(),
          favorite: 0,
          rating: 0,
          thumbnail_path: null
        };

        db.prepare(`
          INSERT INTO photos (filename, path, size, width, height, taken_at, created_at, favorite, rating, thumbnail_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          photo.filename,
          photo.path,
          photo.size,
          photo.width,
          photo.height,
          photo.taken_at,
          photo.created_at,
          photo.favorite,
          photo.rating,
          photo.thumbnail_path
        );

        added++;
      } catch (err: any) {
        errors.push(`Failed to process ${file}: ${err.message}`);
      }
    }

    res.json({ added, updated: 0, skipped, errors });
  } catch (err: any) {
    res.status(500).json({ error: 'Scan failed', details: err.message });
  }
});

// GET /api/photos/:id/thumbnail - 获取缩略图 (必须在 /:id 前面)
router.get('/:id/thumbnail', (req, res) => {
  const db = getDatabase();
  const photoId = req.params.id;
  console.log('[thumbnail] Request for photo ID:', photoId);

  const stmt = db.prepare('SELECT * FROM photos WHERE id = ?');
  const photo = stmt.get(photoId) as Photo | undefined;

  if (!photo) {
    console.log('[thumbnail] Photo not found for ID:', photoId);
    return res.status(404).json({ error: 'Photo not found', id: photoId });
  }

  // 直接使用原图路径，因为缩略图文件已经丢失
  const imagePath = photo.path;
  console.log('[thumbnail] Using path:', imagePath);

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image file not found', path: imagePath });
  }

  res.sendFile(imagePath);
});

// GET /api/photos/:id/file - 获取原图 (必须在 /:id 前面)
router.get('/:id/file', (req, res) => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM photos WHERE id = ?');
  const photo = stmt.get(req.params.id) as Photo | undefined;

  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  const photoPath = photo.path;
  if (!fs.existsSync(photoPath)) {
    return res.status(404).json({ error: 'Photo file not found' });
  }

  res.sendFile(photoPath);
});

// GET /api/photos - 获取照片列表 (分页、筛选)
router.get('/', (req, res) => {
  const db = getDatabase();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const favorite = req.query.favorite;
  const rating = req.query.rating;
  const date = req.query.date;

  let whereClause = '';
  const params: any[] = [];

  if (favorite !== undefined) {
    whereClause += ' WHERE favorite = ?';
    params.push(favorite === 'true' ? 1 : 0);
  }

  if (rating !== undefined) {
    whereClause += whereClause ? ' AND rating >= ?' : ' WHERE rating >= ?';
    params.push(parseInt(rating as string));
  }

  if (date !== undefined) {
    const dateFilter = "strftime('%Y-%m', COALESCE(taken_at, created_at)) = ?";
    whereClause += whereClause ? ' AND ' + dateFilter : ' WHERE ' + dateFilter;
    params.push(date);
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM photos${whereClause}`);
  const { total } = countStmt.get(...params) as { total: number };

  const stmt = db.prepare(`
    SELECT * FROM photos${whereClause}
    ORDER BY COALESCE(taken_at, created_at) DESC
    LIMIT ? OFFSET ?
  `);
  const photos = stmt.all(...params, limit, offset);

  res.json({
    data: photos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// GET /api/photos/:id - 获取单张照片详情
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM photos WHERE id = ?');
  const photo = stmt.get(req.params.id) as Photo | undefined;

  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  res.json(photo);
});

// PUT /api/photos/:id - 更新照片信息
router.put('/:id', (req, res) => {
  const db = getDatabase();
  const { favorite, rating, description } = req.body;

  const existing = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (favorite !== undefined) {
    updates.push('favorite = ?');
    params.push(favorite ? 1 : 0);
  }
  if (rating !== undefined) {
    updates.push('rating = ?');
    params.push(Math.min(5, Math.max(0, parseInt(rating))));
  }

  if (updates.length === 0) {
    return res.json(existing);
  }

  params.push(req.params.id);
  const stmt = db.prepare(`UPDATE photos SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...params);

  const updated = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/photos/:id - 删除照片
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM photos WHERE id = ?');
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  res.json({ success: true });
});

// GET /api/photos/:id/thumbnail - 获取缩略图
router.get('/:id/thumbnail', (req, res) => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM photos WHERE id = ?');
  const photo = stmt.get(req.params.id) as Photo | undefined;

  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  // 直接使用原图路径，因为缩略图文件已经丢失
  const imagePath = photo.path;
  console.log('[thumbnail] id:', req.params.id, 'path:', imagePath, 'exists:', fs.existsSync(imagePath));

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image file not found', path: imagePath });
  }

  res.sendFile(imagePath);
});

// GET /api/photos/:id/file - 获取原图
router.get('/:id/file', (req, res) => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM photos WHERE id = ?');
  const photo = stmt.get(req.params.id) as Photo | undefined;

  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  const photoPath = photo.path;
  if (!fs.existsSync(photoPath)) {
    return res.status(404).json({ error: 'Photo file not found' });
  }

  res.sendFile(photoPath);
});

// POST /api/photos/update-exif - 更新现有照片的 EXIF 信息
router.post('/update-exif', async (req, res) => {
  const db = getDatabase();
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    const photos = db.prepare('SELECT id, path FROM photos WHERE taken_at IS NULL').all() as Photo[];

    for (const photo of photos) {
      try {
        const takenAt = getExifDate(photo.path);
        if (takenAt) {
          db.prepare('UPDATE photos SET taken_at = ? WHERE id = ?').run(takenAt, photo.id);
          updated++;
        } else {
          skipped++;
        }
      } catch (err: any) {
        errors.push(`Failed to update ${photo.filename}: ${err.message}`);
      }
    }

    res.json({ updated, skipped, errors });
  } catch (err: any) {
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

export default router;