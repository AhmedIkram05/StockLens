import * as SQLite from 'expo-sqlite';

// Open the database
const db = SQLite.openDatabaseSync('stocklens.db');

// Database table schemas
export const DB_SCHEMAS = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT NOT NULL UNIQUE,
      full_name TEXT,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `,
  receipts: `
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      image_uri TEXT,
      total_amount REAL,
      date_scanned DATETIME DEFAULT CURRENT_TIMESTAMP,
      ocr_data TEXT,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (uid) ON DELETE CASCADE
    );
  `,
  alpha_cache: `
    CREATE TABLE IF NOT EXISTS alpha_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      interval TEXT NOT NULL,
      params TEXT DEFAULT '',
      fetched_at DATETIME NOT NULL,
      raw_json TEXT NOT NULL,
      UNIQUE(symbol, interval, params)
    );
  `,
  user_settings: `
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      theme TEXT DEFAULT 'light',
      auto_backup INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (uid) ON DELETE CASCADE
    );
  `,
  auth_state: `
    CREATE TABLE IF NOT EXISTS auth_state (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `,
};

// Helpful indexes for reducing table scan costs on common queries
const DB_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_receipts_user_id_synced ON receipts (user_id, synced);`,
  `CREATE INDEX IF NOT EXISTS idx_receipts_date_scanned ON receipts (date_scanned DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings (user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_alpha_cache_symbol_interval ON alpha_cache (symbol, interval);`,
];

// Initialize database tables
export const initDatabase = async (): Promise<void> => {
  try {
    // Enforce declared foreign-key relationships for this SQLite connection
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Execute all schema creation queries
    for (const schema of Object.values(DB_SCHEMAS)) {
      await db.execAsync(schema);
    }

    // Create supporting indexes after tables exist
    for (const index of DB_INDEXES) {
      await db.execAsync(index);
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Generic database operations
export const databaseService = {
  // Execute a query with parameters
  executeQuery: async (query: string, params: any[] = []): Promise<any[]> => {
    try {
      const result = await db.getAllAsync(query, params);
      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  },

  // Execute a non-query operation (INSERT, UPDATE, DELETE)
  executeNonQuery: async (query: string, params: any[] = []): Promise<number> => {
    try {
      const result = await db.runAsync(query, params);
      return result.lastInsertRowId || result.changes;
    } catch (error) {
      console.error('Non-query error:', error);
      throw error;
    }
  },
  
  // Prune alpha_cache entries older than `days` days (based on fetched_at)
  pruneAlphaCacheOlderThan: async (days: number) => {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      await databaseService.executeNonQuery('DELETE FROM alpha_cache WHERE fetched_at IS NOT NULL AND fetched_at < ?', [cutoff]);
    } catch (e) {
      console.warn('pruneAlphaCacheOlderThan failed', e);
    }
  },
};

export default db;