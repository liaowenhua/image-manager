import Database from 'better-sqlite3';

export interface Photo {
  id: number;
  filename: string;
  path: string;
  size: number;
  width: number;
  height: number;
  taken_at: string | null;
  created_at: string;
  favorite: boolean;
  rating: number;
  thumbnail_path: string | null;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface PhotoTag {
  photo_id: number;
  tag_id: number;
}

export interface Album {
  id: number;
  name: string;
  description: string | null;
  cover_photo_id: number | null;
  created_at: string;
}

export interface AlbumPhoto {
  album_id: number;
  photo_id: number;
  order_index: number;
}

export const CREATE_TABLES_SQL = `
-- Photos table
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

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6366f1'
);

-- Photo-Tags junction table
CREATE TABLE IF NOT EXISTS photo_tags (
  photo_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (photo_id, tag_id),
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cover_photo_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL
);

-- Album-Photos junction table
CREATE TABLE IF NOT EXISTS album_photos (
  album_id INTEGER NOT NULL,
  photo_id INTEGER NOT NULL,
  order_index INTEGER DEFAULT 0,
  PRIMARY KEY (album_id, photo_id),
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at);
CREATE INDEX IF NOT EXISTS idx_photos_favorite ON photos(favorite);
CREATE INDEX IF NOT EXISTS idx_photos_rating ON photos(rating);
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_album ON album_photos(album_id);
`;

export function initializeDatabase(db: Database.Database): void {
  db.exec(CREATE_TABLES_SQL);
}