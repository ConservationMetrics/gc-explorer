# E2E Test Authentication Setup

This document describes how authentication is configured for Playwright E2E tests in the GuardianConnector Explorer application.

## Overview

The E2E test suite uses **real Auth0 authentication** with pre-authenticated browser sessions. Tests authenticate with Auth0 using test accounts, and the authenticated session state is saved and reused across tests.

## Authentication Flow

### Setup Phase (`e2e/auth.setup.ts`)

Before tests run, Playwright authenticates with Auth0 for each role and saves the session state:

1. **Navigate to `/login`** - Shows the login page with Auth0 login button
2. **Click login button** - Redirects to Auth0's hosted login page
3. **Fill credentials** - Playwright fills in email/password on Auth0's page
4. **Handle consent screen** (if present) - Clicks "Accept" or "Continue" button
5. **Save session state** - Playwright saves authenticated cookies/localStorage to `playwright/.auth/*.json`

This runs once per test run and creates authenticated sessions for:

- `signedin.json` - SignedIn role
- `guest.json` - Guest role
- `member.json` - Member role
- `admin.json` - Admin role

### Test Execution

Tests use fixtures from `e2e/fixtures/auth-storage.ts` that load the pre-authenticated session states:

```typescript
import { test, expect } from "./fixtures/auth-storage";

test("RBAC test", async ({ authenticatedPageAsMember }) => {
  // authenticatedPageAsMember is already logged in via Auth0
  await authenticatedPageAsMember.goto("/gallery/bcmform_responses");
  // Test assertions...
});
```

## Test File Authentication Strategy

### Tests WITH Admin Authentication (01-04)

The following test files run with **Admin authentication** to ensure full access:

- `e2e/01-alerts.spec.ts` - Tests alerts dashboard functionality
- `e2e/02-gallery.spec.ts` - Tests gallery view functionality
- `e2e/03-index.spec.ts` - Tests index page functionality
- `e2e/04-config.spec.ts` - Tests configuration page

These tests use:

```typescript
import { test, expect } from "./fixtures/auth-storage";

test("test name", async ({ authenticatedPageAsAdmin: page }) => {
  // page is authenticated as Admin
});
```

### Tests WITH Role-Specific Authentication (05-visibility.spec.ts)

The `e2e/05-visibility.spec.ts` file tests **Role-Based Access Control (RBAC)** and **route-level permissions** using different user roles:

```typescript
import {
  test as authTest,
  expect as authExpect,
} from "./fixtures/auth-storage";

authTest(
  "RBAC - Member user can access member datasets",
  async ({ authenticatedPageAsMember }) => {
    // Test with Member role
  }
);
```

This file contains:

- **Unauthenticated tests** - Tests public dataset access without login
- **RBAC tests** - Tests access control for SignedIn, Guest, Member, and Admin roles

## Configuration

### Playwright Config (`playwright.config.ts`)

- Defines a "setup" project that runs `auth.setup.ts` before other tests
- Configures webServer to show server logs (`stdout: "pipe"`, `stderr: "pipe"`)
- Sets baseURL and other test settings

### Docker Compose (`docker-compose.tests.yml`)

- Sets `NUXT_PUBLIC_AUTH_STRATEGY: "auth0"` (required for Auth0 authentication)
- Passes through Auth0 OAuth environment variables:
  - `NUXT_OAUTH_AUTH0_DOMAIN`
  - `NUXT_OAUTH_AUTH0_CLIENT_ID`
  - `NUXT_OAUTH_AUTH0_CLIENT_SECRET`
- Passes through Auth0 test account passwords:
  - `E2E_AUTH0_SIGNEDIN_PASSWORD`
  - `E2E_AUTH0_GUEST_PASSWORD`
  - `E2E_AUTH0_MEMBER_PASSWORD`
  - `E2E_AUTH0_ADMIN_PASSWORD`

### GitHub Actions (`.github/workflows/docker-publish.yml`)

- Exports Auth0 OAuth secrets and test account passwords
- Creates `.env.test.playwright` with all required environment variables
- Sets `NUXT_PUBLIC_AUTH_STRATEGY="auth0"`

## Test Accounts

The following Auth0 test accounts are used:

- `osa+test.signedin@gmail.com` (SignedIn role)
- `osa+test.guest@gmail.com` (Guest role)
- `osa+test.member@gmail.com` (Member role)
- `osa+test.admin@gmail.com` (Admin role)

Passwords are stored in GitHub Secrets and passed as environment variables.

## Environment Variables

### Required for Auth0 Authentication

- `NUXT_OAUTH_AUTH0_DOMAIN` - Auth0 domain (e.g., `your-tenant.us.auth0.com`)
- `NUXT_OAUTH_AUTH0_CLIENT_ID` - Auth0 application client ID
- `NUXT_OAUTH_AUTH0_CLIENT_SECRET` - Auth0 application client secret
- `E2E_AUTH0_SIGNEDIN_PASSWORD` - Password for SignedIn test account
- `E2E_AUTH0_GUEST_PASSWORD` - Password for Guest test account
- `E2E_AUTH0_MEMBER_PASSWORD` - Password for Member test account
- `E2E_AUTH0_ADMIN_PASSWORD` - Password for Admin test account

### Required in Application Config

- `NUXT_PUBLIC_AUTH_STRATEGY="auth0"` - Enables Auth0 authentication

## File Structure

```
e2e/
├── 01-alerts.spec.ts          # Admin auth - tests alerts functionality
├── 02-gallery.spec.ts          # Admin auth - tests gallery functionality
├── 03-index.spec.ts            # Admin auth - tests index page
├── 04-config.spec.ts           # Admin auth - tests config page
├── 05-visibility.spec.ts       # Role-specific auth - tests RBAC and permissions
├── auth.setup.ts               # Auth0 authentication setup (runs before tests)
└── fixtures/
    └── auth-storage.ts         # Fixtures that load pre-authenticated sessions

playwright/
└── .auth/                      # Stored authentication states (gitignored)
    ├── signedin.json
    ├── guest.json
    ├── member.json
    └── admin.json
```

## How It Works

1. **Setup runs first** - `auth.setup.ts` authenticates with Auth0 for each role and saves session state
2. **Fixtures load sessions** - Each test fixture loads the appropriate `playwright/.auth/*.json` file
3. **Tests run authenticated** - Tests use authenticated pages with real Auth0 sessions
4. **RBAC is enforced** - Middleware reads Auth0 session and enforces role-based permissions

## Viewing Server Logs

Server-side logs (including middleware `console.log` statements) appear in Playwright test output:

1. **In CI**: Logs appear in the test output automatically
2. **Locally**: When running `npx playwright test`, server logs appear in the console
3. **Middleware logs**: Logs from `middleware/oauth.global.ts` will show up prefixed with `[TEST]`

Example middleware log output:

```
[TEST] oauth.global middleware called { user: {...}, path: '/gallery/seed_survey_data' }
[TEST] Middleware checking permissions: { permission: 'anyone', userRole: 0, path: '/gallery/seed_survey_data' }
```

## Troubleshooting

### Authentication failing

- Verify environment variables are set correctly in GitHub Actions secrets
- Check that test accounts exist in Auth0 and have correct roles assigned
- Ensure Auth0 credentials are correct
- Verify `NUXT_PUBLIC_AUTH_STRATEGY="auth0"` is set (not "none")
- Check `playwright/.auth/*.json` files are created after setup runs

### Auth files not found

- Ensure `auth.setup.ts` runs before tests (check `playwright.config.ts` has setup project)
- Verify password environment variables are set
- Check GitHub Actions logs for authentication errors
- In Docker/GitHub Actions, ensure files persist between setup and test projects

### Server logs not appearing

- Verify `webServer.stdout` and `webServer.stderr` are set to "pipe" in `playwright.config.ts`
- Check that middleware is logging with `console.log()` (not `console.error()`)

## Best Practices

1. **Use Admin auth for general tests** - Tests 01-04 use Admin to ensure full access
2. **Use role-specific auth for RBAC tests** - Test 05 uses different roles to verify permissions
3. **Keep authentication fixtures separate** - Use `auth-storage.ts` fixtures for authenticated tests
4. **Test permissions in `05-visibility.spec.ts`** - Centralize all RBAC tests here
5. **Don't mix auth approaches** - All tests now use real Auth0 authentication
