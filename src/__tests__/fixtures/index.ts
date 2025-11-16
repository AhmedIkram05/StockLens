/**
 * Test Fixtures Barrel Export
 * 
 * Purpose: Single import point for all test fixtures using barrel pattern.
 * 
 * What it exports:
 * - Receipt fixtures (createReceipt, buildReceiptList, sampleReceipts)
 * - User profile fixtures (createUserProfile, sampleUser)
 * - Stock data fixtures (createOHLCV, buildOHLCVSeries, sampleOHLCVSeries)
 * 
 * Why it's important: Barrel exports enable clean imports in test files.
 * Instead of '../fixtures/receipts' + '../fixtures/users', tests can
 * import multiple fixtures from a single '../fixtures' path.
 * 
 * Usage:
 * import { createReceipt, createUserProfile, createOHLCV } from '../fixtures';
 */

export * from './receipts';
export * from './users';
export * from './stocks';
