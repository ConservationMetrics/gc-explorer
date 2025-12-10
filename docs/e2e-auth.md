# E2E Test Authentication Setup

This document describes how authentication is configured for Playwright E2E tests in the GuardianConnector Explorer application.

## Overview

The E2E test suite uses two authentication approaches:

1. **Mock Authentication** (`e2e/fixtures/auth.ts`) - Uses test endpoints to set mock sessions (no Auth0 required)
2. **Real Auth0 Authentication** (`e2e/fixtures/auth-storage.ts`) - Uses real Auth0 accounts with stored sessions

## Test File Authentication Strategy

### Tests WITHOUT Authentication (01-04)

The following test files run **without authentication** and use the default Playwright test:

- `e2e/01-alerts.spec.ts` - Tests alerts dashboard functionality
- `e2e/02-gallery.spec.ts` - Tests gallery view functionality  
- `e2e/03-index.spec.ts` - Tests index page functionality
- `e2e/04-config.spec.ts` - Tests configuration page (may require auth in future)

These tests use:
```typescript
import { test, expect } from "@playwright/test";
```

They test functionality that should work for unauthenticated users or don't require specific roles.

### Tests WITH Authentication (05-visibility.spec.ts)

The `e2e/05-visibility.spec.ts` file tests **Role-Based Access Control (RBAC)** and **route-level permissions**. This file uses authenticated fixtures to test different user roles:

```typescript
import { test as authTest, expect as authExpect } from "../e2e/fixtures/auth";
```

This file contains:
- **Unauthenticated tests** - Tests public dataset access without login
- **RBAC tests** - Tests access control for SignedIn, Guest, Member, and Admin roles

The RBAC tests use fixtures that set mock user sessions:
- `loggedInPageAsSignedIn` - Tests SignedIn role permissions
- `loggedInPageAsGuest` - Tests Guest role permissions
- `loggedInPageAsMember` - Tests Member role permissions
- `loggedInPageAsAdmin` - Tests Admin role permissions

## Mock Authentication (Current Approach)

The current implementation uses **mock authentication** via test endpoints:

### How It Works

1. **Test Fixtures** (`e2e/fixtures/auth.ts`):
   - Each fixture calls `/api/test/set-session` POST endpoint
   - Sets a mock user session with the specified role
   - Returns a page object with the session already set

2. **Test Endpoint** (`server/api/test/set-session.post.ts`):
   - Only available when `CI=true` or `NODE_ENV=test`
   - Uses `setUserSession()` from `nuxt-auth-utils` to create mock sessions
   - Sets user role without requiring Auth0 authentication

3. **Middleware** (`middleware/oauth.global.ts`):
   - Reads the mock session and enforces permissions
   - Logs permission checks with `🔍 [TEST]` prefix
   - Redirects unauthorized users appropriately

### Usage Example

```typescript
import { test as authTest, expect as authExpect } from "./fixtures/auth";

authTest("RBAC test", async ({ loggedInPageAsMember }) => {
  // loggedInPageAsMember is already authenticated as Member role
  await loggedInPageAsMember.goto("/map/bcmform_responses");
  // Test assertions...
});
```

## Real Auth0 Authentication (Alternative Approach)

For tests that require real Auth0 authentication, you can use the storageState-based fixtures. **Note**: This requires `NUXT_PUBLIC_AUTH_STRATEGY: "auth0"` to be set (not "none").

### Setup

1. **Set Auth Strategy**: Ensure `NUXT_PUBLIC_AUTH_STRATEGY: "auth0"` is set in your test environment (e.g., `docker-compose.tests.yml` or `.env.test.playwright`)

2. **Environment Variables**: Set Auth0 test account passwords:

```bash
E2E_AUTH0_SIGNEDIN_PASSWORD=your-password-here
E2E_AUTH0_GUEST_PASSWORD=your-password-here
E2E_AUTH0_MEMBER_PASSWORD=your-password-here
E2E_AUTH0_ADMIN_PASSWORD=your-password-here
```

2. **Test Accounts**: The following test accounts are used:
   - `osa+test.signedin@gmail.com` (SignedIn role)
   - `osa+test.guest@gmail.com` (Guest role)
   - `osa+test.member@gmail.com` (Member role)
   - `osa+test.admin@gmail.com` (Admin role)

3. **Authentication Setup**: The `e2e/auth.setup.ts` file runs before tests to authenticate and save sessions.

### How Auth0 Login Works

The authentication flow follows the actual Auth0 OAuth process:

1. **Navigate to `/login`** - Shows the login page with Auth0 login button
2. **Click login button** - Redirects to `/api/auth/auth0` which initiates OAuth flow
3. **Auth0 redirects** - Browser redirects to Auth0's hosted login page (`auth0.com`)
4. **Fill credentials** - Playwright fills in email/password on Auth0's page
5. **Submit** - Auth0 authenticates and redirects back to `/login` with session cookie
6. **Save state** - Playwright saves the authenticated session state to `playwright/.auth/*.json`

This matches the real user experience and tests the complete Auth0 integration.

### Usage

```typescript
import { test, expect } from "./fixtures/auth-storage";

test("RBAC test with Auth0", async ({ authenticatedPageAsMember }) => {
  // authenticatedPageAsMember is already logged in via Auth0
  await authenticatedPageAsMember.goto("/map/bcmform_responses");
  // Test assertions...
});
```

## Viewing Server Logs

Server-side logs (including middleware `console.log` statements) appear in Playwright test output:

1. **In CI**: Logs appear in the test output automatically
2. **Locally**: When running `npx playwright test`, server logs appear in the console
3. **Middleware logs**: Logs from `middleware/oauth.global.ts` will show up prefixed with `🔍 [TEST]`

Example middleware log output:
```
🔍 [TEST] oauth.global middleware called { user: {...}, path: '/gallery/seed_survey_data' }
🔍 [TEST] Middleware checking permissions: { permission: 'anyone', userRole: 0, path: '/gallery/seed_survey_data' }
```

## Configuration Files

### Playwright Config (`playwright.config.ts`)

- Defines test projects including a "setup" project for authentication
- Configures webServer to show server logs
- Sets baseURL and other test settings

### Docker Compose (`docker-compose.tests.yml`)

- Passes through Auth0 password environment variables:
  - `E2E_AUTH0_SIGNEDIN_PASSWORD`
  - `E2E_AUTH0_GUEST_PASSWORD`
  - `E2E_AUTH0_MEMBER_PASSWORD`
  - `E2E_AUTH0_ADMIN_PASSWORD`

## Skipping Authentication

To skip authentication for specific tests:

```typescript
import { test } from "@playwright/test";

// Reset storage state to avoid authentication
test.use({ storageState: { cookies: [], origins: [] } });

test("unauthenticated test", async ({ page }) => {
  // page is not authenticated
});
```

## Environment Variables

### Required for Mock Authentication (Current)
- None required - works with `NUXT_PUBLIC_AUTH_STRATEGY="none"` in CI

### Required for Real Auth0 Authentication
- `E2E_AUTH0_SIGNEDIN_PASSWORD` - Password for SignedIn test account
- `E2E_AUTH0_GUEST_PASSWORD` - Password for Guest test account
- `E2E_AUTH0_MEMBER_PASSWORD` - Password for Member test account
- `E2E_AUTH0_ADMIN_PASSWORD` - Password for Admin test account

## File Structure

```
e2e/
├── 01-alerts.spec.ts          # No auth - tests alerts functionality
├── 02-gallery.spec.ts          # No auth - tests gallery functionality
├── 03-index.spec.ts            # No auth - tests index page
├── 04-config.spec.ts           # No auth - tests config page
├── 05-visibility.spec.ts       # Uses auth - tests RBAC and permissions
├── auth.setup.ts               # Auth0 authentication setup (optional)
└── fixtures/
    ├── auth.ts                 # Mock authentication fixtures (current)
    └── auth-storage.ts         # Real Auth0 authentication fixtures (alternative)

playwright/
└── .auth/                      # Stored authentication states (gitignored)
    ├── signedin.json
    ├── guest.json
    ├── member.json
    └── admin.json

server/api/test/
└── set-session.post.ts         # Test endpoint for mock authentication
```

## Best Practices

1. **Use mock authentication** for RBAC tests (current approach) - faster and doesn't require Auth0 setup
2. **Use real Auth0 authentication** only when testing Auth0-specific features
3. **Keep authentication fixtures separate** - don't mix authenticated and unauthenticated tests in the same file
4. **Test permissions in `05-visibility.spec.ts`** - centralize all RBAC tests here
5. **Keep other tests unauthenticated** - tests 01-04 should work without authentication

## Troubleshooting

### Mock authentication not working
- Check that `CI=true` or `NODE_ENV=test` is set
- Verify `/api/test/set-session` endpoint is accessible
- Check middleware logs for permission checks

### Auth0 authentication failing
- Verify environment variables are set correctly
- Check that test accounts exist in Auth0
- Ensure Auth0 credentials are correct
- Check that `NUXT_PUBLIC_AUTH_STRATEGY="auth0"` is set (not "none")

### Server logs not appearing
- Verify `webServer.stdout` and `webServer.stderr` are set to "pipe" in `playwright.config.ts`
- Check that middleware is logging with `console.log()` (not `console.error()`)

