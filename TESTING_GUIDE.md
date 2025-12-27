# Testing Guide

Comprehensive testing guide for the AI Medical Assistant project.

## Table of Contents
- [Overview](#overview)
- [Setup](#setup)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [End-to-End Tests](#end-to-end-tests)
- [Visual Regression Tests](#visual-regression-tests)
- [Coverage](#coverage)
- [CI/CD](#cicd)
- [Best Practices](#best-practices)

## Overview

This project uses a comprehensive testing strategy:
- **Vitest** for unit and integration tests
- **React Testing Library** for component testing
- **MSW (Mock Service Worker)** for API mocking
- **Playwright** for end-to-end testing
- **Percy** for visual regression testing
- **Coverage thresholds** enforced at 80%

## Setup

### Install Dependencies

```bash
npm install
```

### Install Playwright Browsers (for E2E tests)

```bash
npx playwright install
```

### Environment Setup

For visual regression testing, set up Percy:

1. Sign up at [percy.io](https://percy.io)
2. Create a new project
3. Get your `PERCY_TOKEN`
4. Add to `.env.local`:
   ```
   PERCY_TOKEN=your_token_here
   ```

## Unit Tests

### Location
- `src/components/__tests__/` - Component tests
- `src/lib/__tests__/` - Utility function tests
- `src/hooks/__tests__/` - Custom hook tests (if any)

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### Writing Unit Tests

Example component test:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render } from '@/test/utils';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<MyComponent onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test Utilities

Custom render function (`src/test/utils.tsx`) provides:
- React Router context
- React Query context
- Consistent test environment

```typescript
import { render } from '@/test/utils';
```

## Integration Tests

### Location
- `src/test/integration/` - Integration test suites

### Running Integration Tests

```bash
npm run test:integration
```

### MSW Setup

Mock API handlers are defined in `src/test/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/endpoint', () => {
    return HttpResponse.json({ data: 'mocked' });
  }),
];
```

### Writing Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '../mocks/server';

describe('Feature Integration Tests', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('tests complete feature flow', async () => {
    // Test implementation
  });
});
```

## End-to-End Tests

### Location
- `e2e/` - E2E test suites

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# UI mode (interactive)
npx playwright test --ui

# Specific test file
npx playwright test e2e/auth.spec.ts

# Specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

### Test Categories

- **auth.spec.ts** - Authentication flows
- **navigation.spec.ts** - Navigation and routing
- **emergency.spec.ts** - Emergency page functionality
- **visual-regression.spec.ts** - Visual regression tests

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('should perform user action', async ({ page }) => {
  await page.goto('/');
  
  await page.getByRole('button', { name: /click me/i }).click();
  
  await expect(page.getByText('Success')).toBeVisible();
});
```

### Playwright Configuration

Key settings in `playwright.config.ts`:
- Multiple browsers: Chromium, Firefox, WebKit
- Mobile viewports: Pixel 5, iPhone 12
- Screenshot on failure
- Trace on retry
- Automatic dev server startup

## Visual Regression Tests

### Setup Percy

1. Sign up at [percy.io](https://percy.io)
2. Create a project
3. Get `PERCY_TOKEN`
4. Add to environment variables

### Running Visual Tests

```bash
# Run visual regression tests
npm run test:visual

# With Percy enabled
PERCY_TOKEN=your_token npx playwright test e2e/visual-regression.spec.ts
```

### Taking Snapshots

```typescript
import percySnapshot from '@percy/playwright';

test('visual test', async ({ page }) => {
  await page.goto('/');
  
  // Single snapshot
  await percySnapshot(page, 'Page Name');
  
  // Multiple viewports
  await percySnapshot(page, 'Page Name - Desktop', {
    widths: [1280],
  });
});
```

### Percy Configuration

`.percy.yml` configures:
- Viewport widths (mobile, tablet, desktop)
- CSS to hide dynamic content
- Minimum height settings

## Coverage

### Coverage Thresholds

Enforced in `vitest.config.ts`:
```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

### Viewing Coverage

```bash
npm run test:coverage
```

Coverage report generated in `coverage/` directory.

### Excluded from Coverage
- Test files
- Configuration files
- Type definitions
- Mock data
- Entry points (main.tsx)

## CI/CD

### GitHub Actions Workflows

#### Unit & Integration Tests (`.github/workflows/test.yml`)
- Runs on: Node.js 18.x, 20.x
- Steps:
  1. Install dependencies
  2. Run linting
  3. Run tests with coverage
  4. Upload coverage to Codecov (optional)
  5. Build project

#### E2E Tests (`.github/workflows/e2e.yml`)
- Runs on: Ubuntu latest
- Steps:
  1. Install dependencies
  2. Install Playwright browsers
  3. Run E2E tests
  4. Run Percy visual tests
  5. Upload test artifacts

### Required Secrets

Add these to GitHub repository secrets:
- `CODECOV_TOKEN` (optional) - Coverage reporting
- `PERCY_TOKEN` (optional) - Visual regression testing

## Best Practices

### Unit Tests
✅ Test component rendering
✅ Test user interactions
✅ Test edge cases
✅ Mock external dependencies
✅ Use descriptive test names
❌ Don't test implementation details
❌ Don't test third-party libraries

### Integration Tests
✅ Test complete user flows
✅ Mock API responses with MSW
✅ Test error scenarios
✅ Verify data persistence
❌ Don't test individual functions
❌ Don't duplicate unit test coverage

### E2E Tests
✅ Test critical user journeys
✅ Test across browsers
✅ Test mobile viewports
✅ Use data-testid for stable selectors
✅ Take visual snapshots
❌ Don't test every edge case (use unit tests)
❌ Don't make tests dependent on each other

### General Guidelines
- Write tests before fixing bugs
- Keep tests simple and readable
- Use factories for test data
- Follow the AAA pattern (Arrange, Act, Assert)
- Run tests locally before pushing
- Keep test coverage above thresholds
- Update tests when refactoring

## Debugging Tests

### Vitest Debugging
```bash
# Run specific test
npm test -- path/to/test.ts

# Run with verbose output
npm test -- --reporter=verbose

# Update snapshots
npm test -- -u
```

### Playwright Debugging
```bash
# Debug mode
npx playwright test --debug

# Headed mode
npx playwright test --headed

# Step through test
npx playwright test --headed --slowmo=1000

# Specific test
npx playwright test e2e/auth.spec.ts:10
```

### Common Issues

**Tests timing out:**
- Increase timeout in test configuration
- Check for unresolved promises
- Verify API mocks are responding

**Flaky tests:**
- Use `waitFor` for async operations
- Avoid hard-coded timeouts
- Check for race conditions

**Visual regression failures:**
- Review Percy dashboard
- Check for dynamic content
- Update `.percy.yml` to hide flaky elements

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Percy Documentation](https://docs.percy.io/)
- [MSW Documentation](https://mswjs.io/)
