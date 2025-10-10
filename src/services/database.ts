import * as SQLite from 'expo-sqlite';

// Open the database
const db = SQLite.openDatabaseSync('stocklens.db');

// Database table schemas
export const DB_SCHEMAS = {
  receipts: `
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      image_uri TEXT,
      total_amount REAL,
      merchant_name TEXT,
      date_scanned DATETIME DEFAULT CURRENT_TIMESTAMP,
      ocr_data TEXT,
      categories TEXT,
      synced INTEGER DEFAULT 0
    );
  `,
  user_settings: `
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      currency TEXT DEFAULT 'USD',
      theme TEXT DEFAULT 'light',
      notifications_enabled INTEGER DEFAULT 1,
      auto_backup INTEGER DEFAULT 0
    );
  `,
  spending_categories: `
    CREATE TABLE IF NOT EXISTS spending_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      budget_limit REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,
  investment_projections: `
    CREATE TABLE IF NOT EXISTS investment_projections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      receipt_id INTEGER,
      amount REAL NOT NULL,
      return_rate REAL NOT NULL,
      years INTEGER NOT NULL,
      future_value REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (receipt_id) REFERENCES receipts (id)
    );
  `,
  auth_state: `
    CREATE TABLE IF NOT EXISTS auth_state (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `,
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
};

// Initialize database tables
export const initDatabase = async (): Promise<void> => {
  try {
    // Execute all schema creation queries
    for (const schema of Object.values(DB_SCHEMAS)) {
      await db.execAsync(schema);
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
};

export default db;