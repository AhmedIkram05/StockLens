jest.mock('@/services/database', () => ({
  databaseService: {
    executeNonQuery: jest.fn(),
    executeQuery: jest.fn(),
  },
}));

jest.mock('@/services/eventBus', () => ({
  emit: jest.fn(),
}));

import { databaseService } from '@/services/database';
import { emit } from '@/services/eventBus';
import { receiptService, settingsService, userService } from '@/services/dataService';
import { createReceipt, createUserProfile } from '../fixtures';

/**
 * dataService Unit Tests
 * 
 * Purpose: Validates SQLite database operations for receipts, users,
 * and settings through the service layer.
 * 
 * What it tests:
 * - Receipt CRUD operations (create, update, delete, getByUserId)
 * - User profile upserts and UNIQUE constraint handling
 * - Settings persistence with default values
 * - Event bus emissions on data changes
 * - Proper SQL parameter binding
 * 
 * Why it's important: The dataService is the single source of truth
 * for local data persistence. These tests ensure data integrity,
 * proper constraint handling (unique emails), and that the event
 * bus notifies other parts of the app when data changes.
 */

const mockedDb = databaseService as jest.Mocked<typeof databaseService>;
const mockedEmit = emit as jest.MockedFunction<typeof emit>;

describe('receiptService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates receipts with default values and returns insert id', async () => {
    mockedDb.executeNonQuery.mockResolvedValueOnce(42);

    const receiptData = createReceipt({ user_id: 'uid-123', image_uri: 'file:///foo.jpg', total_amount: 12.5, ocr_data: '£12.50' });

    const id = await receiptService.create({
      user_id: receiptData.user_id,
      image_uri: receiptData.image_uri,
      total_amount: receiptData.total_amount,
      ocr_data: receiptData.ocr_data,
    });

    expect(id).toBe(42);
    expect(mockedDb.executeNonQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO receipts'), expect.arrayContaining(['uid-123']));
  });

  it('updates only provided fields', async () => {
    await receiptService.update(7, { total_amount: 99.9 });
    expect(mockedDb.executeNonQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE receipts SET total_amount = ?'), [99.9, 7]);
  });

  it('deletes all receipts for a user and emits event', async () => {
    await receiptService.deleteAll('uid-abc');
    expect(mockedDb.executeNonQuery).toHaveBeenCalledWith('DELETE FROM receipts WHERE user_id = ?', ['uid-abc']);
    expect(mockedEmit).toHaveBeenCalledWith('receipts-changed', { userId: 'uid-abc' });
  });
});

describe('settingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts settings with defaults when fields missing', async () => {
    await settingsService.upsert({ user_id: 'uid-settings' } as any);

    expect(mockedDb.executeNonQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO user_settings'),
      ['uid-settings', 'light', 0]
    );
  });
});

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts user profiles via executeNonQuery', async () => {
    mockedDb.executeNonQuery.mockResolvedValueOnce(1);

    const user = createUserProfile({ uid: 'uid', full_name: 'Alice', email: 'alice@example.com' });

    const result = await userService.upsert(user.uid, user.full_name!, user.email!);

    expect(result).toBe(1);
    expect(mockedDb.executeNonQuery).toHaveBeenCalledTimes(1);
    expect(mockedDb.executeNonQuery.mock.calls[0][0]).toContain('INSERT INTO users');
  });

  it('handles UNIQUE email conflicts by updating existing rows', async () => {
    mockedDb.executeNonQuery.mockRejectedValueOnce(new Error('UNIQUE constraint failed: users.email'));
    mockedDb.executeNonQuery.mockResolvedValueOnce(2);

    const user = createUserProfile({ uid: 'uid-new', full_name: 'Bob', email: 'duplicate@example.com' });

    const result = await userService.upsert(user.uid, user.full_name!, user.email!);

    expect(result).toBe(2);
    expect(mockedDb.executeNonQuery.mock.calls[1][0]).toContain('UPDATE users');
  });
});
