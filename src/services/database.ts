import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('stocklens.db');

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

const DB_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_receipts_user_id_synced ON receipts (user_id, synced);`,
  `CREATE INDEX IF NOT EXISTS idx_receipts_date_scanned ON receipts (date_scanned DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings (user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_alpha_cache_symbol_interval ON alpha_cache (symbol, interval);`,
];

export const initDatabase = async (): Promise<void> => {
  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');

    for (const schema of Object.values(DB_SCHEMAS)) {
      await db.execAsync(schema);
    }

    for (const index of DB_INDEXES) {
      await db.execAsync(index);
    }
    try {
      const cols: any[] = await db.getAllAsync("PRAGMA table_info('receipts')");
      const hasOcr = cols.some(c => c.name === 'ocr_data');
      if (!hasOcr) {
        try {
          await db.execAsync('ALTER TABLE receipts ADD COLUMN ocr_data TEXT;');
          console.log('Added ocr_data column to receipts table');
        } catch (e) {
          console.warn('Failed to add ocr_data column (it may already exist):', e);
        }
      }
    } catch (e) {
      console.warn('Failed to verify receipts table columns:', e);
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const databaseService = {
  executeQuery: async (query: string, params: any[] = []): Promise<any[]> => {
    try {
      const result = await db.getAllAsync(query, params);
      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  },

  executeNonQuery: async (query: string, params: any[] = []): Promise<number> => {
    try {
      const result = await db.runAsync(query, params);
      return result.lastInsertRowId || result.changes;
    } catch (error) {
      console.error('Non-query error:', error);
      throw error;
    }
  },
  
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