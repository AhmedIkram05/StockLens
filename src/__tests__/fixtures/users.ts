import { UserProfile } from '@/contexts/AuthContext';

let userSequence = 1;

export const createUserProfile = (overrides: Partial<UserProfile> = {}): UserProfile => {
  const now = new Date().toISOString();

  const base: UserProfile = {
    id: overrides.id ?? userSequence++,
    uid: overrides.uid ?? `test-uid-${userSequence}`,
    full_name: overrides.full_name ?? 'Test User',
    email: overrides.email ?? 'user@example.com',
    created_at: overrides.created_at ?? now,
    last_login: overrides.last_login ?? now,
  };

  return { ...base, ...overrides };
};

export const sampleUser = createUserProfile();
