import { test as baseTest, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

/**
 * Custom Playwright fixtures using storageState for Auth0 authentication.
 *
 * These fixtures use pre-authenticated sessions created by `auth.setup.ts` during
 * the setup project. Each fixture loads a saved browser storage state (cookies,
 * local storage) from JSON files in `playwright/.auth/` directory.
 *
 * Use these fixtures when you want to test with real Auth0 authentication instead
 * of mocking. The fixtures provide authenticated page objects for different roles:
 * - `authenticatedPageAsSignedIn` - SignedIn role (basic authenticated user)
 * - `authenticatedPageAsGuest` - Guest role
 * - `authenticatedPageAsMember` - Member role
 * - `authenticatedPageAsAdmin` - Admin role
 *
 * @example
 * ```typescript
 * import { test, expect } from "./fixtures/auth-storage";
 *
 * test("admin can access config page", async ({ authenticatedPageAsAdmin }) => {
 *   await authenticatedPageAsAdmin.goto("/config");
 *   await expect(authenticatedPageAsAdmin.getByText("Configuration")).toBeVisible();
 * });
 * ```
 *
 * @fileoverview Playwright fixtures for Auth0-authenticated test pages
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, "../../playwright/.auth");

// Check if we're in CI and passwords aren't set - if so, provide helpful message
const hasAnyPassword =
  process.env.E2E_AUTH0_SIGNEDIN_PASSWORD ||
  process.env.E2E_AUTH0_GUEST_PASSWORD ||
  process.env.E2E_AUTH0_MEMBER_PASSWORD ||
  process.env.E2E_AUTH0_ADMIN_PASSWORD;

if (process.env.CI && !hasAnyPassword) {
  console.warn(
    `[FIXTURE] No E2E_AUTH0_*_PASSWORD env vars set — auth-dependent tests will be skipped.`,
  );
}

/**
 * Gets the path to an authentication storage state file for a given role.
 *
 * Checks if the auth file exists and provides detailed error messages if it doesn't,
 * including debugging information about the current working directory and available
 * files. This is especially helpful in Docker/GitHub Actions environments where file
 * paths can be confusing.
 *
 * @param {string} role - The role name (e.g., "signedin", "guest", "member", "admin")
 * @returns {string} Absolute path to the authentication storage state JSON file
 * @throws {Error} If the auth file doesn't exist, with detailed error message
 */
const getAuthFile = (role: string): string => {
  const authFile = path.join(authDir, `${role}.json`);

  if (!fs.existsSync(authFile)) {
    baseTest.skip(
      true,
      `Auth file for ${role} not found — set E2E_AUTH0_${role.toUpperCase()}_PASSWORD to enable`,
    );
  }

  // Log details only when the auth file exists (i.e. tests will actually run)
  console.log(`[FIXTURE] Found auth file for ${role}: ${authFile}`);
  const fileStats = fs.statSync(authFile);
  console.log(`[FIXTURE] Auth file size: ${fileStats.size} bytes`);
  return authFile;
};

/**
 * Extended Playwright test object with authenticated page fixtures.
 *
 * Each fixture creates a new browser context with a pre-authenticated storage state,
 * then provides a page object that can be used in tests. The storage state includes
 * cookies and local storage from the Auth0 authentication flow.
 */
export const test = baseTest.extend<{
  authenticatedPageAsSignedIn: Page;
  authenticatedPageAsGuest: Page;
  authenticatedPageAsMember: Page;
  authenticatedPageAsAdmin: Page;
}>({
  /**
   * Fixture that provides a page authenticated as SignedIn user.
   *
   * Loads the storage state from `playwright/.auth/signedin.json` which contains
   * the authenticated session for a SignedIn role user (basic authenticated user
   * with no elevated permissions).
   *
   * @param {Object} options - Fixture options
   * @param {Browser} options.browser - Playwright browser instance
   * @param {Function} use - Callback function that receives the authenticated page
   * @returns {Promise<void>} Resolves when the fixture is done
   */
  authenticatedPageAsSignedIn: async ({ browser }, use) => {
    const authFile = getAuthFile("signedin");
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  /**
   * Fixture that provides a page authenticated as Guest user.
   *
   * Loads the storage state from `playwright/.auth/guest.json` which contains
   * the authenticated session for a Guest role user.
   *
   * @param {Object} options - Fixture options
   * @param {Browser} options.browser - Playwright browser instance
   * @param {Function} use - Callback function that receives the authenticated page
   * @returns {Promise<void>} Resolves when the fixture is done
   */
  authenticatedPageAsGuest: async ({ browser }, use) => {
    const authFile = getAuthFile("guest");
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  /**
   * Fixture that provides a page authenticated as Member user.
   *
   * Loads the storage state from `playwright/.auth/member.json` which contains
   * the authenticated session for a Member role user.
   *
   * @param {Object} options - Fixture options
   * @param {Browser} options.browser - Playwright browser instance
   * @param {Function} use - Callback function that receives the authenticated page
   * @returns {Promise<void>} Resolves when the fixture is done
   */
  authenticatedPageAsMember: async ({ browser }, use) => {
    const authFile = getAuthFile("member");
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  /**
   * Fixture that provides a page authenticated as Admin user.
   *
   * Loads the storage state from `playwright/.auth/admin.json` which contains
   * the authenticated session for an Admin role user (highest permission level).
   *
   * @param {Object} options - Fixture options
   * @param {Browser} options.browser - Playwright browser instance
   * @param {Function} use - Callback function that receives the authenticated page
   * @returns {Promise<void>} Resolves when the fixture is done
   */
  authenticatedPageAsAdmin: async ({ browser }, use) => {
    const authFile = getAuthFile("admin");
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
