import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import type { Auth, Persistence } from 'firebase/auth';
import db from './database';
import { firebaseConfig } from './firebaseConfig';

// Lazy initialization
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

const AUTH_STATE_TABLE = 'auth_state';
let authTableInitialized = false;
const STORAGE_AVAILABLE_KEY = '__sak';

type PersistenceValue = string | Record<string, unknown>;

async function ensureAuthTable() {
  if (authTableInitialized) {
    return;
  }
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS ${AUTH_STATE_TABLE} (
      key TEXT PRIMARY KEY,
      value TEXT
    );`
  );
  authTableInitialized = true;
}

function createSQLitePersistence(): Persistence {
  return class SQLitePersistence {
    static type: 'LOCAL' = 'LOCAL';
    readonly type = 'LOCAL' as const;

    async _isAvailable(): Promise<boolean> {
      try {
        await ensureAuthTable();
        await db.runAsync(
          `INSERT OR REPLACE INTO ${AUTH_STATE_TABLE} (key, value) VALUES (?, ?)`,
          [STORAGE_AVAILABLE_KEY, '1']
        );
        await db.runAsync(`DELETE FROM ${AUTH_STATE_TABLE} WHERE key = ?`, [STORAGE_AVAILABLE_KEY]);
        return true;
      } catch (error) {
        console.error('SQLite auth persistence unavailable:', error);
        return false;
      }
    }

    async _set(key: string, value: PersistenceValue): Promise<void> {
      await ensureAuthTable();
      await db.runAsync(
        `INSERT OR REPLACE INTO ${AUTH_STATE_TABLE} (key, value) VALUES (?, ?)`,
        [key, JSON.stringify(value)]
      );
    }

    async _get<T extends PersistenceValue>(key: string): Promise<T | null> {
      await ensureAuthTable();
      const rows = (await db.getAllAsync(
        `SELECT value FROM ${AUTH_STATE_TABLE} WHERE key = ?`,
        [key]
      )) as Array<{ value: string | null }>;
      if (rows.length === 0 || rows[0].value == null) {
        return null;
      }
      try {
        return JSON.parse(rows[0].value) as T;
      } catch {
        return rows[0].value as T;
      }
    }

    async _remove(key: string): Promise<void> {
      await ensureAuthTable();
      await db.runAsync(`DELETE FROM ${AUTH_STATE_TABLE} WHERE key = ?`, [key]);
    }

    _addListener(_key: string, _listener: (value: PersistenceValue | null) => void): void {
      // Cross-instance change listeners are not supported for SQLite persistence in this project.
    }

    _removeListener(_key: string, _listener: (value: PersistenceValue | null) => void): void {
      // Cross-instance change listeners are not supported for SQLite persistence in this project.
    }
  } as unknown as Persistence;
}

// Initialize Firebase only when first accessed
function initializeFirebaseIfNeeded() {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  }
  return app;
}

// Getter for auth - initializes Firebase on first access (async to allow dynamic import)
export async function getAuthInstance(): Promise<Auth> {
  if (!authInstance) {
    const firebaseApp = initializeFirebaseIfNeeded();
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const { initializeAuth } = await import('firebase/auth');
      const persistence = createSQLitePersistence();
      authInstance = initializeAuth(firebaseApp, { persistence });
    } else {
      const { getAuth, browserLocalPersistence, inMemoryPersistence, setPersistence } = await import('firebase/auth');
      const webAuth = getAuth(firebaseApp);
      try {
        await setPersistence(webAuth, browserLocalPersistence);
      } catch {
        await setPersistence(webAuth, inMemoryPersistence);
      }
      authInstance = webAuth;
    }
  }
  return authInstance!;
}

export default app;