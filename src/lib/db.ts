import { getCloudflareContext } from "@opennextjs/cloudflare";

// Fallback interface in case @cloudflare/workers-types is not globally referenced in tsconfig
export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: any }>;
  all<T = unknown>(): Promise<{ success: boolean; results: T[]; meta: any }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<any[]>;
  exec(query: string): Promise<any>;
}

let tablesInitialized = false;

/**
 * Ensures required database tables exist. Safe to call multiple times (cached in memory).
 */
export async function ensureTables(db: D1Database): Promise<void> {
  if (tablesInitialized) return;

  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_state (
        user_id TEXT PRIMARY KEY,
        current_juz_id INTEGER NOT NULL DEFAULT 1,
        playback_position_seconds REAL NOT NULL DEFAULT 0,
        timer_seconds REAL NOT NULL DEFAULT 1800,
        timer_target_minutes INTEGER NOT NULL DEFAULT 30,
        last_active_date TEXT NOT NULL,
        history_records_json TEXT NOT NULL DEFAULT '{}',
        user_logs_json TEXT NOT NULL DEFAULT '[]',
        settings_json TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL,
        active_device_id TEXT,
        is_playing INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    `);

    // Safely add columns if user_state was created previously without them
    try {
      await db.exec("ALTER TABLE user_state ADD COLUMN active_device_id TEXT;");
    } catch (_) {}
    try {
      await db.exec("ALTER TABLE user_state ADD COLUMN is_playing INTEGER DEFAULT 0;");
    } catch (_) {}

    tablesInitialized = true;
  } catch (error) {
    console.warn("Notice: ensureTables execution returned:", error);
    // Don't crash if already initialized or permissions vary
    tablesInitialized = true;
  }
}

/**
 * Retrieves the Cloudflare D1 database binding 'DB' from the current Cloudflare context.
 */
export async function getDb(): Promise<D1Database | null> {
  try {
    const context = await getCloudflareContext({ async: true });
    const db = (context?.env as any)?.DB as D1Database | undefined;
    if (!db) {
      console.warn("Cloudflare D1 'DB' binding not found on env context.");
      return null;
    }
    await ensureTables(db);
    return db;
  } catch (err) {
    console.warn("Could not retrieve Cloudflare context for DB:", err);
    return null;
  }
}

