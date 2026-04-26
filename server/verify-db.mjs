import Database from 'better-sqlite3';

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  path TEXT UNIQUE NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  taken_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  favorite INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 0,
  thumbnail_path TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS photo_tags (
  photo_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (photo_id, tag_id),
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cover_photo_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS album_photos (
  album_id INTEGER NOT NULL,
  photo_id INTEGER NOT NULL,
  order_index INTEGER DEFAULT 0,
  PRIMARY KEY (album_id, photo_id),
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at);
CREATE INDEX IF NOT EXISTS idx_photos_favorite ON photos(favorite);
CREATE INDEX IF NOT EXISTS idx_photos_rating ON photos(rating);
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_album ON album_photos(album_id);
`;

// Test 1: Create all required tables
const db = new Database(':memory:');
db.exec(CREATE_TABLES_SQL);

const tables = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table'
`).all();

const tableNames = tables.map(t => t.name).sort();
console.log('Tables created:', tableNames);

const hasAllTables = ['photos', 'tags', 'photo_tags', 'albums', 'album_photos'].every(
  t => tableNames.includes(t)
);

if (!hasAllTables) {
  console.error('FAIL: Missing some tables');
  process.exit(1);
}
console.log('✓ All tables created');

// Test 2: Insert and retrieve a photo
const stmt = db.prepare(`
  INSERT INTO photos (filename, path, size, width, height)
  VALUES (?, ?, ?, ?, ?)
`);
const result = stmt.run('test.jpg', '/photos/test.jpg', 1024, 800, 600);

const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid);
if (!photo || photo.filename !== 'test.jpg') {
  console.error('FAIL: Could not insert/retrieve photo');
  process.exit(1);
}
console.log('✓ Photo insert/retrieve works');

db.close();
console.log('\n✅ All tests passed!');