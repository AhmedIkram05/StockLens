/**
 * Test Utils Barrel Export
 * 
 * Purpose: Single import point for all test utilities.
 * 
 * What it exports:
 * - renderWithProviders: Custom render with context providers
 * - ProviderOverrides: Type for context value overrides
 * - RenderWithProvidersOptions: Extended render options type
 * 
 * Why it's important: Enables clean imports in test files.
 * Tests import from '../utils' instead of '../utils/renderWithProviders'.
 * 
 * Usage:
 * import { renderWithProviders } from '../utils';
 */

export * from './renderWithProviders';
