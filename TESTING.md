# Testing Guide

This project includes comprehensive test coverage (80%+) using Jest and TypeScript.

## Test Setup

The project uses **mocked database** for tests, so you don't need a real PostgreSQL database to run tests. The mocking is configured in `src/__tests__/setup.mock.ts`.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/__tests__/
├── setup.mock.ts              # Mock database setup (no real DB needed)
├── factories.mock.ts          # Test data factories
├── controllers/               # Controller tests
│   ├── walletController.test.ts
│   └── userController.test.ts
├── services/                  # Service tests
│   ├── walletService.test.ts
│   ├── transferService.test.ts
│   ├── fundingService.test.ts
│   ├── loanService.test.ts
│   └── interestCalculation.test.ts
└── middleware/                # Middleware tests
    └── errorHandler.test.ts
```

## Test Coverage Goals

The project aims for 80%+ coverage across:
- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

Coverage thresholds are enforced in `jest.config.js`.

## Writing Tests

### Example Service Test

```typescript
import { walletService } from '../../services/walletService';
import { createTestUser, createTestWallet } from '../factories.mock';

describe('WalletService', () => {
  it('should create a wallet', async () => {
    const user = await createTestUser();
    const wallet = await walletService.create({
      userId: user.get('id') as string
    });

    expect(wallet).toBeDefined();
    expect(wallet?.get('currency')).toBe('NGN');
  });
});
```

### Example Controller Test

```typescript
import { Request, Response } from 'express';
import { walletController } from '../../controllers/walletController';

describe('WalletController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = { params: {}, body: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should create wallet', async () => {
    // Test implementation
  });
});
```

## Test Factories

Use test factories to create test data easily:

```typescript
// Create test user
const user = await createTestUser();

// Create test wallet with initial balance
const wallet = await createTestWallet(userId, {
  initialBalance: 10000
});

// Create test pool account
const pool = await createTestPoolAccount({
  initialBalance: 1000000
});
```

## Mocked vs Real Database

### Current Setup: Mocked Database (Default)
- ✅ No database setup required
- ✅ Fast test execution
- ✅ Easy CI/CD integration
- ✅ No cleanup needed
- ⚠️ Doesn't test real database interactions

### Alternative: Real Database Testing

If you want to test against a real PostgreSQL database:

1. Create test database:
```bash
createdb wallet_db_test
```

2. Update `jest.config.js`:
```javascript
setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
```

3. Create `.env.test`:
```env
DB_NAME=wallet_db_test
DB_USER=postgres
DB_PASSWORD=postgres
```

## Debugging Tests

```bash
# Run specific test file
npm test -- walletService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create wallet"

# Run with verbose output
npm test -- --verbose
```

## CI/CD Integration

Tests are ready for CI/CD pipelines. No database setup required:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

## Best Practices

1. **Test Isolation**: Each test is independent and doesn't affect others
2. **Clear Names**: Use descriptive test names that explain what's being tested
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Mock third-party services and external APIs
5. **Test Edge Cases**: Include tests for error conditions and boundary cases

## Coverage Reports

After running `npm run test:coverage`, view the HTML report:

```bash
open coverage/lcov-report/index.html
```

This will show detailed coverage information for each file.
