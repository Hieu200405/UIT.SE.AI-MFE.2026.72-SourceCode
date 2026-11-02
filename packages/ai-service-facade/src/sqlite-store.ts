import { DatabaseSync } from 'node:sqlite';
import { Store, deserializeUser, serializeUser } from './store.ts';
import type { UserRecord } from './store.ts';

/**
 * Lưu bền bằng SQLite có sẵn trong Node 22 (không thêm dependency; còn ghi cảnh báo "experimental").
 * Mỗi người dùng = một dòng JSON; ghi lại sau mỗi thay đổi (write-through). Đủ cho quy mô đồ án.
 */
export class SqliteStore extends Store {
  private db: DatabaseSync;
  constructor(path: string) {
    super();
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)');
  }
  protected override load(id: string): UserRecord | null {
    const row = this.db.prepare('SELECT data FROM users WHERE id = ?').get(id) as { data: string } | undefined;
    try { return row ? deserializeUser(row.data) : null; } catch { return null; } // dữ liệu hỏng: bắt đầu lại, không sập server
  }
  override save(id: string): void {
    const u = this.users.get(id); if (!u) return;
    this.db.prepare('INSERT INTO users (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at')
      .run(id, serializeUser(u), new Date().toISOString());
  }
  override close(): void { this.db.close(); }
}
