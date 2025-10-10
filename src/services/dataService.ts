import { databaseService } from './database';

export interface Receipt {
  id?: number;
  user_id: string;
  image_uri?: string;
  total_amount?: number;
  merchant_name?: string;
  date_scanned?: string;
  ocr_data?: string;
  categories?: string;
  synced?: number;
}

export interface UserSettings {
  id?: number;
  user_id: string;
  currency?: string;
  theme?: string;
  notifications_enabled?: number;
  auto_backup?: number;
}

export interface SpendingCategory {
  id?: number;
  user_id: string;
  name: string;
  color?: string;
  icon?: string;
  budget_limit?: number;
  created_at?: string;
}

export interface InvestmentProjection {
  id?: number;
  user_id: string;
  receipt_id?: number;
  amount: number;
  return_rate: number;
  years: number;
  future_value: number;
  created_at?: string;
}

export const receiptService = {
  // Create a new receipt
  create: async (receipt: Receipt): Promise<number> => {
    const query = `
      INSERT INTO receipts (user_id, image_uri, total_amount, merchant_name, ocr_data, categories, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      receipt.user_id,
      receipt.image_uri,
      receipt.total_amount,
      receipt.merchant_name,
      receipt.ocr_data,
      receipt.categories,
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
    const fields = Object.keys(receipt).filter(key => receipt[key as keyof Receipt] !== undefined);
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
      INSERT OR REPLACE INTO user_settings (user_id, currency, theme, notifications_enabled, auto_backup)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      settings.user_id,
      settings.currency || 'USD',
      settings.theme || 'light',
      settings.notifications_enabled || 1,
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

export const categoryService = {
  // Create a new spending category
  create: async (category: SpendingCategory): Promise<number> => {
    const query = `
      INSERT INTO spending_categories (user_id, name, color, icon, budget_limit)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      category.user_id,
      category.name,
      category.color,
      category.icon,
      category.budget_limit,
    ];
    return await databaseService.executeNonQuery(query, params);
  },

  // Get all categories for a user
  getByUserId: async (userId: string): Promise<SpendingCategory[]> => {
    const query = 'SELECT * FROM spending_categories WHERE user_id = ? ORDER BY name';
    return await databaseService.executeQuery(query, [userId]);
  },

  // Update a category
  update: async (id: number, category: Partial<SpendingCategory>): Promise<void> => {
    const fields = Object.keys(category).filter(key => category[key as keyof SpendingCategory] !== undefined);
    const values = fields.map(key => category[key as keyof SpendingCategory]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const query = `UPDATE spending_categories SET ${setClause} WHERE id = ?`;
    values.push(id);

    await databaseService.executeNonQuery(query, values);
  },

  // Delete a category
  delete: async (id: number): Promise<void> => {
    const query = 'DELETE FROM spending_categories WHERE id = ?';
    await databaseService.executeNonQuery(query, [id]);
  },
};

export const investmentService = {
  // Create a new investment projection
  create: async (projection: InvestmentProjection): Promise<number> => {
    const query = `
      INSERT INTO investment_projections (user_id, receipt_id, amount, return_rate, years, future_value)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      projection.user_id,
      projection.receipt_id,
      projection.amount,
      projection.return_rate,
      projection.years,
      projection.future_value,
    ];
    return await databaseService.executeNonQuery(query, params);
  },

  // Get all projections for a user
  getByUserId: async (userId: string): Promise<InvestmentProjection[]> => {
    const query = 'SELECT * FROM investment_projections WHERE user_id = ? ORDER BY created_at DESC';
    return await databaseService.executeQuery(query, [userId]);
  },

  // Get projections for a specific receipt
  getByReceiptId: async (receiptId: number): Promise<InvestmentProjection[]> => {
    const query = 'SELECT * FROM investment_projections WHERE receipt_id = ? ORDER BY created_at DESC';
    return await databaseService.executeQuery(query, [receiptId]);
  },

  // Delete a projection
  delete: async (id: number): Promise<void> => {
    const query = 'DELETE FROM investment_projections WHERE id = ?';
    await databaseService.executeNonQuery(query, [id]);
  },
};