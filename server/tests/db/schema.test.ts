import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initializeDatabase } from '../../src/db/schema.js';

describe('Database Schema', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
  });

  it('should create all required tables', () => {
    initializeDatabase(db);

    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all() as { name: string }[];

    const tableNames = tables.map(t => t.name).sort();
    expect(tableNames).toContain('photos');
    expect(tableNames).toContain('tags');
    expect(tableNames).toContain('photo_tags');
    expect(tableNames).toContain('albums');
    expect(tableNames).toContain('album_photos');
  });

  it('should insert and retrieve a photo', () => {
    initializeDatabase(db);

    const stmt = db.prepare(`
      INSERT INTO photos (filename, path, size, width, height)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run('test.jpg', '/photos/test.jpg', 1024, 800, 600);

    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid);
    expect(photo).toBeDefined();
    expect((photo as any).filename).toBe('test.jpg');
  });
});