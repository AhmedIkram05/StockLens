import * as SQLite from 'expo-sqlite';

type CacheEntry = { value: string; expiresAt: number };

const memCache = new Map<string, CacheEntry>();

const DB_NAME = 'stocklens_cache.db';
const TABLE = 'kv_cache';
let db: any = null;

function getDb() {
  if (!db) db = (SQLite as any).openDatabase(DB_NAME);
  return db;
}

function execSql<T = any>(sql: string, args: any[] = []): Promise<T> {
  const database = getDb();
  return new Promise((resolve, reject) => {
    database.transaction((tx: any) => {
      tx.executeSql(
        sql,
        args,
        (_tx: any, result: any) => resolve(result as unknown as T),
        (_tx: any, err: any) => {
          // returning true would roll back transaction; we reject to handle fallback
          reject(err);
          return false;
        }
      );
    }, (err: any) => reject(err));
  });
}

async function ensureTable() {
  try {
    await execSql(`CREATE TABLE IF NOT EXISTS ${TABLE} (\n      key TEXT PRIMARY KEY,\n      value TEXT NOT NULL,\n      expiresAt INTEGER\n    );`);
  } catch (e) {
    // if SQLite is unavailable or errors, we'll rely on memCache
  }
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    // check mem cache first
    const entry = memCache.get(key);
    if (entry) {
      if (entry.expiresAt < now) {
        memCache.delete(key);
      } else {
        try {
          return JSON.parse(entry.value) as T;
        } catch {
          return null;
        }
      }
    }

    try {
      await ensureTable();
      const res: any = await execSql(`SELECT value, expiresAt FROM ${TABLE} WHERE key = ?`, [key]);
      const rows = res.rows as any;
      if (rows.length === 0) return null;
      const row = rows.item(0);
      const expiresAt = row.expiresAt as number | null;
      if (expiresAt && expiresAt < now) {
        // expired — remove
        await execSql(`DELETE FROM ${TABLE} WHERE key = ?`, [key]);
        return null;
      }
      try {
        const parsed = JSON.parse(row.value) as T;
        // repopulate mem cache for speed
        memCache.set(key, { value: row.value, expiresAt: expiresAt ?? Number.MAX_SAFE_INTEGER });
        return parsed;
      } catch {
        return null;
      }
    } catch (e) {
      // SQLite failed — fallback to mem cache result (already checked) or null
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlMs: number) {
    const expiresAt = Date.now() + ttlMs;
    const raw = JSON.stringify(value);
    // write to mem cache
    memCache.set(key, { value: raw, expiresAt });
    try {
      await ensureTable();
      await execSql(
        `INSERT OR REPLACE INTO ${TABLE} (key, value, expiresAt) VALUES (?, ?, ?)`,
        [key, raw, expiresAt]
      );
    } catch (e) {
      // write failed — mem cache will still hold the value
    }
  },
};
