import { Router } from 'express';
import { getDatabase } from '../db/index.js';
import { Photo } from '../db/schema.js';

const router = Router();

// GET /api/photos - 获取照片列表 (分页、筛选)
router.get('/', (req, res) => {
  const db = getDatabase();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const favorite = req.query.favorite;
  const rating = req.query.rating;

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

export default router;