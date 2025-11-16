# Test Organization

This folder contains unit and integration tests for StockLens, organized by file naming convention.

## Test Types

### Unit Tests (`.unit.test.ts/tsx`)

Tests for isolated business logic, pure functions, and individual components without external dependencies.

- **`services/`** - Business logic (projections, data operations, API calls, OCR parsing)
- **`utils/`** - Pure utility functions (formatters, biometric prompts)
- **`hooks/`** - Custom React hooks tested in isolation

**Run only unit tests:**

```bash
npm run test:unit
```

### Integration Tests (`.integration.test.tsx`)

Tests for full user workflows, screen interactions, and component integration with contexts/providers.

- **`screens/`** - Full screen rendering with navigation, auth, and user interactions
- **`contexts/`** - React Context providers (AuthContext, ThemeContext)
- **`hooks/`** - Hooks that integrate with external APIs (camera, OCR)

**Run only integration tests:**

```bash
npm run test:integration
```

## Test File Breakdown

### Unit Tests (10 files, ~30 tests)

| File | Description |
|------|-------------|
| `services/alphaVantageService.unit.test.ts` | Stock API integration with caching |
| `services/dataService.unit.test.ts` | Database CRUD operations |
| `services/eventBus.unit.test.ts` | Pub/sub event system |
| `services/ocrService.unit.test.ts` | OCR text recognition |
| `services/projectionService.unit.test.ts` | Investment projection calculations |
| `services/receiptParser.unit.test.ts` | Receipt amount parsing logic |
| `utils/biometricPrompt.unit.test.ts` | Biometric authentication prompts |
| `utils/formatters.unit.test.ts` | Currency and date formatting |
| `hooks/useBiometricAuth.unit.test.ts` | Biometric auth state management |
| `hooks/useReceipts.unit.test.ts` | Receipt data fetching hook |

### Integration Tests (11 files, ~36 tests)

| File | Description |
|------|-------------|
| `contexts/AuthContext.integration.test.tsx` | User authentication provider |
| `contexts/ThemeContext.integration.test.tsx` | Theme switching provider |
| `hooks/useReceiptCapture.integration.test.tsx` | Camera + OCR workflow |
| `screens/HomeScreen.integration.test.tsx` | Dashboard with stats and charts |
| `screens/LockScreen.integration.test.tsx` | Biometric/PIN unlock screen |
| `screens/LoginScreen.integration.test.tsx` | User login workflow |
| `screens/ReceiptDetailsScreen.integration.test.tsx` | Receipt editing screen |
| `screens/ScanScreen.integration.test.tsx` | Camera capture screen |
| `screens/SettingsScreen.integration.test.tsx` | Settings management screen |
| `screens/SignUpScreen.integration.test.tsx` | User registration workflow |
| `screens/SummaryScreen.integration.test.tsx` | Receipt history with projections |

## Running Tests

```bash
# Run all tests
npm test

# Run only unit tests (fast, isolated)
npm run test:unit

# Run only integration tests (slower, full workflows)
npm run test:integration

# Watch mode for unit tests during development
npm run test:unit:watch

# Watch mode for integration tests
npm run test:integration:watch

# Generate coverage report
npm run test:coverage
```

## Test Statistics

- **Total:** 66 tests across 21 files
- **Unit Tests:** ~30 tests (business logic, utilities)
- **Integration Tests:** ~36 tests (screens, contexts, workflows)
- **Coverage:** Focuses on high-value user flows and critical business logic

## Test Principles

### What We Test

✅ Business logic and calculations  
✅ User workflows and screen interactions  
✅ Data persistence and API integration  
✅ Authentication and authorization flows  
✅ Error handling for critical paths  

### What We Don't Test

❌ Pure math calculations (visually obvious when broken)  
❌ Static configuration data  
❌ Simple form validation  
❌ Trivial edge cases with low ROI  
❌ Implementation details vs. behavior  

## Adding New Tests

### Unit Test Template

```typescript
// filename.unit.test.ts
import { functionToTest } from '@/path/to/module';

describe('functionToTest', () => {
  it('describes expected behavior', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });
});
```

### Integration Test Template

```tsx
// ScreenName.integration.test.tsx
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import ScreenName from '@/screens/ScreenName';
import { renderWithProviders } from '../utils';

describe('ScreenName', () => {
  it('performs user workflow', async () => {
    const { getByText } = renderWithProviders(<ScreenName />);
    
    fireEvent.press(getByText('Button'));
    
    await waitFor(() => {
      expect(getByText('Expected Result')).toBeTruthy();
    });
  });
});
```
