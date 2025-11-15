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

const mockedDb = databaseService as jest.Mocked<typeof databaseService>;
const mockedEmit = emit as jest.MockedFunction<typeof emit>;

describe('receiptService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates receipts with default values and returns insert id', async () => {
    mockedDb.executeNonQuery.mockResolvedValueOnce(42);

    const id = await receiptService.create({
      user_id: 'uid-123',
      image_uri: 'file:///foo.jpg',
      total_amount: 12.5,
      ocr_data: '£12.50',
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

    const result = await userService.upsert('uid', 'Alice', 'alice@example.com');

    expect(result).toBe(1);
    expect(mockedDb.executeNonQuery).toHaveBeenCalledTimes(1);
    expect(mockedDb.executeNonQuery.mock.calls[0][0]).toContain('INSERT INTO users');
  });

  it('handles UNIQUE email conflicts by updating existing rows', async () => {
    mockedDb.executeNonQuery.mockRejectedValueOnce(new Error('UNIQUE constraint failed: users.email'));
    mockedDb.executeNonQuery.mockResolvedValueOnce(2);

    const result = await userService.upsert('uid-new', 'Bob', 'duplicate@example.com');

    expect(result).toBe(2);
    expect(mockedDb.executeNonQuery.mock.calls[1][0]).toContain('UPDATE users');
  });
});
