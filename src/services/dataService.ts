import { databaseService } from './database';
import { alphaVantageService, OHLCV } from './alphaVantageService';

export interface Receipt {
  id?: number;
  user_id: string;
  image_uri?: string;
  total_amount?: number;
  date_scanned?: string;
  ocr_data?: string;
  synced?: number;
}

export interface UserSettings {
  id?: number;
  user_id: string;
  theme?: string;
  auto_backup?: number;
}

export const receiptService = {
  // Create a new receipt
  create: async (receipt: Receipt): Promise<number> => {
    const query = `
      INSERT INTO receipts (user_id, image_uri, total_amount, ocr_data, synced)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      receipt.user_id,
      receipt.image_uri,
      receipt.total_amount,
      receipt.ocr_data,
      receipt.synced || 0,
    ];
    return await databaseService.executeNonQuery(query, params);
  },

  // Get all receipts for a user
  getByUserId: async (userId: string): Promise<Receipt[]> => {
    const query = 'SELECT * FROM receipts WHERE user_id = ? ORDER BY date_scanned DESC';
    return await databaseService.executeQuery(query, [userId]);
  },

  // Get a single receipt by ID
  getById: async (id: number): Promise<Receipt | null> => {
    const query = 'SELECT * FROM receipts WHERE id = ?';
    const results = await databaseService.executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  },

  // Update a receipt
  update: async (id: number, receipt: Partial<Receipt>): Promise<void> => {
    const allowedFields: Array<keyof Receipt> = ['user_id', 'image_uri', 'total_amount', 'date_scanned', 'ocr_data', 'synced'];
    const fields = Object.keys(receipt).filter(key => allowedFields.includes(key as keyof Receipt) && receipt[key as keyof Receipt] !== undefined);
    if (fields.length === 0) {
      return;
    }
    const values = fields.map(key => receipt[key as keyof Receipt]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const query = `UPDATE receipts SET ${setClause} WHERE id = ?`;
    values.push(id);

    await databaseService.executeNonQuery(query, values);
  },

  // Delete a receipt
  delete: async (id: number): Promise<void> => {
    const query = 'DELETE FROM receipts WHERE id = ?';
    await databaseService.executeNonQuery(query, [id]);
  },

  // Get unsynced receipts
  getUnsynced: async (userId: string): Promise<Receipt[]> => {
    const query = 'SELECT * FROM receipts WHERE user_id = ? AND synced = 0';
    return await databaseService.executeQuery(query, [userId]);
  },

  // Mark receipt as synced
  markAsSynced: async (id: number): Promise<void> => {
    const query = 'UPDATE receipts SET synced = 1 WHERE id = ?';
    await databaseService.executeNonQuery(query, [id]);
  },
};

export const userSettingsService = {
  // Create or update user settings
  upsert: async (settings: UserSettings): Promise<void> => {
    const query = `
      INSERT OR REPLACE INTO user_settings (user_id, theme, auto_backup)
      VALUES (?, ?, ?)
    `;
    const params = [
      settings.user_id,
      settings.theme || 'light',
      settings.auto_backup || 0,
    ];
    await databaseService.executeNonQuery(query, params);
  },

  // Get user settings
  getByUserId: async (userId: string): Promise<UserSettings | null> => {
    const query = 'SELECT * FROM user_settings WHERE user_id = ?';
    const results = await databaseService.executeQuery(query, [userId]);
    return results.length > 0 ? results[0] : null;
  },
};

export const userService = {
  // Create or update a user profile (upsert by uid)
  upsert: async (uid: string, fullName: string | null, email: string): Promise<number> => {
    const timestamp = new Date().toISOString();

    try {
      const query = `
        INSERT INTO users (uid, full_name, email, last_login)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(uid) DO UPDATE SET
          full_name = excluded.full_name,
          email = excluded.email,
          last_login = excluded.last_login
      `;
      const params = [uid, fullName, email, timestamp];
      return await databaseService.executeNonQuery(query, params);
    } catch (error: any) {
      // Handle situations where the email already exists under a different uid
      if (error?.message?.includes('UNIQUE constraint failed: users.email')) {
        const updateQuery = `
          UPDATE users
          SET uid = ?, full_name = ?, last_login = ?
          WHERE email = ?
        `;
        return await databaseService.executeNonQuery(updateQuery, [uid, fullName, timestamp, email]);
      }

      throw error;
    }
  },

  // Get user by uid
  getByUid: async (uid: string) => {
    const query = 'SELECT * FROM users WHERE uid = ?';
    const results = await databaseService.executeQuery(query, [uid]);
    return results.length > 0 ? results[0] : null;
  },

  // Delete user
  deleteByUid: async (uid: string) => {
    const query = 'DELETE FROM users WHERE uid = ?';
    await databaseService.executeNonQuery(query, [uid]);
  },
};

// --- Minimal stock data helper (MVP) ---
/**
 * Fetch historical OHLCV for a symbol for the last `years` years.
 * Uses daily series for 1 year or less, otherwise monthly series.
 */
export const stockService = {
  getHistoricalForTicker: async (symbol: string, years = 5): Promise<OHLCV[]> => {
    try {
      if (years <= 1) {
        const daily = await alphaVantageService.getDailyAdjusted(symbol);
        // keep approximately last 365 days
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 1);
        return daily.filter(d => new Date(d.date) >= cutoff);
      } else {
        const monthly = await alphaVantageService.getMonthlyAdjusted(symbol);
        const monthsNeeded = Math.max(12 * years, 12);
        return monthly.slice(-monthsNeeded);
      }
    } catch (error: any) {
      // Bubble up descriptive error for UI to show
      throw new Error(`Failed to fetch historical data for ${symbol}: ${error?.message || error}`);
    }
  },

  getQuote: async (symbol: string) => {
    try {
      return await alphaVantageService.getQuote(symbol);
    } catch (error: any) {
      throw new Error(`Failed to fetch quote for ${symbol}: ${error?.message || error}`);
    }
  },
};