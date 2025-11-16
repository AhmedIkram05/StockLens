/**
 * User Profile Test Fixtures
 * 
 * Purpose: Factory functions for generating consistent user profile
 * test data across authentication and settings tests.
 * 
 * What it provides:
 * - createUserProfile(): Factory function with partial overrides
 * - sampleUser: Pre-built test user with default values
 * - Auto-incrementing ID/UID sequence for unique users
 * - Automatic timestamp generation for created_at/last_login
 * 
 * Why it's important: User profiles are used extensively in auth tests,
 * navigation guards, and settings screens. Centralizing mock data here
 * ensures consistency and makes it easy to add new UserProfile fields
 * without updating dozens of test files.
 * 
 * Usage:
 * createUserProfile({ email: 'test@example.com' }) → Full profile
 * sampleUser → Pre-built user for quick tests
 */

import { UserProfile } from '@/contexts/AuthContext';

let userSequence = 1;

export const createUserProfile = (overrides: Partial<UserProfile> = {}): UserProfile => {
  const now = new Date().toISOString();

  const base: UserProfile = {
    id: overrides.id ?? userSequence++,
    uid: overrides.uid ?? `test-uid-${userSequence}`,
    first_name: overrides.first_name ?? 'TestUser',
    email: overrides.email ?? 'user@example.com',
    created_at: overrides.created_at ?? now,
    last_login: overrides.last_login ?? now,
  };

  return { ...base, ...overrides };
};

export const sampleUser = createUserProfile();
