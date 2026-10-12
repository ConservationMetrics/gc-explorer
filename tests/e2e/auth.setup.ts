import { test as setup, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Role } from "../../types";
import {
  authLocation,
  waitForAuthReturn,
  waitForAuthSession,
  saveVerifiedAuthState,
} from "./helpers/authSession";

setup.setTimeout(180_000);

/**
 * Playwright authentication setup file in accordance to  https://playwright.dev/docs/auth documentation.
 *
 * Authenticates with Auth0 for each role (SignedIn, Guest, Member, Admin) and saves
 * the browser storage state to files. This runs before all tests as a setup project
 * and creates authenticated sessions that can be reused across tests.
 *
 * The authentication flow follows the actual Auth0 OAuth flow:
 * 1. Navigate to /login page
 * 2. Click login button (redirects to /api/auth/auth0)
 * 3. Auth0 redirects to Auth0 hosted login page
 * 4. Fill in email/password on Auth0's page
 * 5. Handle consent screen if present
 * 6. Submit and wait for redirect back to /login or home page
 * 7. Verify the application account and role
 * 8. Save browser state and verify its cookies in an independent request context
 *
 * **Required Environment Variables:**
 * - `E2E_AUTH0_SIGNEDIN_PASSWORD` - Password for SignedIn test account
 * - `E2E_AUTH0_GUEST_PASSWORD` - Password for Guest test account
 * - `E2E_AUTH0_MEMBER_PASSWORD` - Password for Member test account
 * - `E2E_AUTH0_ADMIN_PASSWORD` - Password for Admin test account
 * - `NUXT_PUBLIC_AUTH_STRATEGY="auth0"` - Must be set to enable Auth0 authentication
 * - `NUXT_OAUTH_AUTH0_DOMAIN` - Auth0 domain
 * - `NUXT_OAUTH_AUTH0_CLIENT_ID` - Auth0 application client ID
 * - `NUXT_OAUTH_AUTH0_CLIENT_SECRET` - Auth0 application client secret
 *
 * **Test Accounts:**
 * Uses predefined test accounts (see TEST_ACCOUNTS constant). Passwords must be
 * provided via environment variables, typically stored in GitHub Secrets for CI.
 *
 * **Output:**
 * Creates authentication state files in `playwright/.auth/`:
 * - `signedin.json` - SignedIn role session
 * - `guest.json` - Guest role session
 * - `member.json` - Member role session
 * - `admin.json` - Admin role session
 *
 * These files are loaded by fixtures in `e2e/fixtures/auth-storage.ts`.
 *
 * **Test File Usage:**
 * - Tests 01-04 (`01-alerts.spec.ts`, `02-gallery.spec.ts`, `03-index.spec.ts`, `04-config.spec.ts`)
 *   use Admin authentication via `authenticatedPageAsAdmin` fixture
 * - Test 05 (`05-visibility.spec.ts`) uses role-specific authentication to test RBAC
 *
 * @fileoverview E2E authentication setup using Auth0
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, "../playwright/.auth");

// Ensure auth directory exists (important in Docker/GitHub Actions)
if (!fs.existsSync(authDir)) {
  console.log(`[SETUP] Creating auth directory: ${authDir}`);
  fs.mkdirSync(authDir, { recursive: true });
  console.log(`[SETUP] Auth directory created`);
} else {
  console.log(`[SETUP] Auth directory already exists: ${authDir}`);
}
console.log(`[SETUP] Current working directory: ${process.cwd()}`);
console.log(`[SETUP] Auth directory absolute path: ${path.resolve(authDir)}`);

// Test account emails (from environment variables)
const TEST_ACCOUNTS = {
  signedIn: "osa+test.signedin@gmail.com",
  guest: "osa+test.guest@gmail.com",
  member: "osa+test.member@gmail.com",
  admin: "osa+test.admin@gmail.com",
};

// Test account passwords (from environment variables)
const TEST_PASSWORDS = {
  signedIn: process.env.E2E_AUTH0_SIGNEDIN_PASSWORD || "",
  guest: process.env.E2E_AUTH0_GUEST_PASSWORD || "",
  member: process.env.E2E_AUTH0_MEMBER_PASSWORD || "",
  admin: process.env.E2E_AUTH0_ADMIN_PASSWORD || "",
};

/**
 * Authenticates a user with Auth0 using the OAuth flow.
 *
 * This function performs the complete Auth0 authentication flow:
 * 1. Navigates to the application's /login page
 * 2. Clicks the login button (which redirects to /api/auth/auth0)
 * 3. Waits for redirect to Auth0 hosted login page
 * 4. Finds and fills in email/password fields on Auth0's page
 * 5. Clicks the Continue/submit button
 * 6. Handles consent screen if present (clicks Accept/Authorize)
 * 7. Waits for redirect back to /login or home page
 * 8. Verifies the application account and role
 *
 * @param {Page} page - Playwright page object to perform authentication on
 * @param {string} email - Email address for the test account
 * @param {string} password - Password for the test account
 * @param {string} roleName - Human-readable role name for logging (e.g., "SignedIn", "Admin")
 * @param {string} baseURL - Configured Explorer URL
 * @throws {Error} If email input field cannot be found
 * @throws {Error} If password input field cannot be found
 * @throws {Error} If submit/Continue button cannot be found
 * @returns {Promise<void>} Resolves when authentication is complete
 */
const authenticateWithAuth0 = async (
  page: Page,
  email: string,
  password: string,
  roleName: keyof typeof Role,
  baseURL: string | undefined,
) => {
  console.log(`\n[AUTH] ========================================`);
  console.log(`[AUTH] Starting authentication for ${roleName}`);
  console.log(`[AUTH] Email: ${email}`);
  console.log(`[AUTH] Role: ${roleName}`);
  console.log(`[AUTH] ========================================\n`);

  // Step 1: Navigate to login page
  console.log(`[AUTH] Step 1: Navigating to login page...`);
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const applicationOrigin = new URL(baseURL).origin;
  await page.goto(new URL("/login", applicationOrigin).href);
  const domain = process.env.NUXT_OAUTH_AUTH0_DOMAIN;
  if (!domain) throw new Error("NUXT_OAUTH_AUTH0_DOMAIN is required");
  const auth0Origin = new URL(`https://${domain}`).origin;
  const loginPageUrl = authLocation(page);
  console.log(`[AUTH] Navigated to login page: ${loginPageUrl}`);
  console.log(`[AUTH] Page title: ${await page.title()}`);

  // Step 2: Click the login button (which redirects to /api/auth/auth0)
  console.log(`[AUTH] Step 2: Looking for login button...`);
  const loginButton = page.getByTestId("login-button");
  await loginButton.waitFor({ state: "visible", timeout: 5000 });
  const buttonText = await loginButton.textContent();
  console.log(`[AUTH] Found login button with text: "${buttonText}"`);
  console.log(`[AUTH] Clicking login button...`);

  // Click and wait for navigation to Auth0
  console.log(`[AUTH] Waiting for redirect to Auth0 domain...`);
  await Promise.all([
    page
      .waitForURL((url) => url.origin === auth0Origin, { timeout: 30000 })
      .catch(() => {
        throw new Error(
          `Authentication did not reach Auth0; location=${authLocation(page)}`,
        );
      }),
    loginButton.click(),
  ]);

  const auth0Url = authLocation(page);
  console.log(`[AUTH] Redirected to Auth0`);
  console.log(`[AUTH] Auth0 URL: ${auth0Url}`);
  console.log(`[AUTH] Page title: ${await page.title()}`);

  // Step 3: Wait for Auth0 login page to load
  console.log(`[AUTH] Step 3: Waiting for Auth0 login page to load...`);
  console.log(`[AUTH] Looking for email/username input field...`);

  // Auth0 login page typically has email/password fields
  await page.waitForSelector(
    'input[name="email"], input[type="email"], input[name="username"], input[id*="email"], input[id*="username"]',
    {
      timeout: 15000,
    },
  );
  console.log(`[AUTH] Auth0 login page loaded`);

  // Step 4: Fill in email
  console.log(`[AUTH] Step 4: Finding and filling email field...`);
  // Try multiple selectors for Auth0's email field, including placeholder text
  const emailSelectors = [
    'input[placeholder*="Email" i], input[placeholder*="email" i]', // By placeholder text
    'input[placeholder*="Email address" i]',
    'input[name="email"]',
    'input[type="email"]',
    'input[name="username"]',
    'input[id*="email"]',
    'input[id*="username"]',
  ];

  let emailInput = null;
  let foundSelector = null;
  for (const selector of emailSelectors) {
    const input = page.locator(selector).first();
    const count = await input.count();
    if (count > 0) {
      const placeholder = await input
        .getAttribute("placeholder")
        .catch(() => "");
      console.log(
        `[AUTH]   Trying selector "${selector}": ${count} found, placeholder: "${placeholder}"`,
      );
      emailInput = input;
      foundSelector = selector;
      break;
    }
  }

  if (!emailInput) {
    console.error(`[AUTH] Could not find email input field`);
    throw new Error("Could not find email input field on Auth0 login page");
  }

  console.log(`[AUTH] Found email input with selector: "${foundSelector}"`);
  await emailInput.fill(email);
  const filledEmail = await emailInput.inputValue();
  console.log(`[AUTH] Filled in email: ${filledEmail}`);

  // Step 5: Fill in password
  console.log(`[AUTH] Step 5: Finding and filling password field...`);
  const passwordSelectors = [
    'input[placeholder*="Password" i], input[placeholder*="password" i]', // By placeholder text
    'input[name="password"]',
    'input[type="password"]',
    'input[id*="password"]',
  ];

  let passwordInput = null;
  let foundPasswordSelector = null;
  for (const selector of passwordSelectors) {
    const input = page.locator(selector).first();
    const count = await input.count();
    if (count > 0) {
      const placeholder = await input
        .getAttribute("placeholder")
        .catch(() => "");
      console.log(
        `[AUTH]   Trying password selector "${selector}": ${count} found, placeholder: "${placeholder}"`,
      );
      passwordInput = input;
      foundPasswordSelector = selector;
      break;
    }
  }

  if (!passwordInput) {
    console.error(`[AUTH] Could not find password input field`);
    throw new Error("Could not find password input field on Auth0 login page");
  }

  await passwordInput.waitFor({ state: "visible", timeout: 5000 });
  console.log(
    `[AUTH] Found password input with selector: "${foundPasswordSelector}"`,
  );
  await passwordInput.fill(password);
  const passwordLength = password.length;
  console.log(`[AUTH] Filled in password (${passwordLength} characters)`);

  // Step 6: Click Continue/Submit button on Auth0 page
  console.log(`[AUTH] Step 6: Finding and clicking Continue button...`);
  // Auth0 buttons - prioritize "Continue" button by text content
  const submitSelectors = [
    'button:has-text("Continue")', // Prioritize Continue button
    'button[type="submit"]:has-text("Continue")',
    'button[type="submit"]',
    'button:has-text("Log in")',
    'button:has-text("Sign in")',
    'button:has-text("Continue with Email")',
    "button[data-action-button-primary]", // Auth0's primary action button
  ];

  let submitButton = null;
  let foundSubmitSelector = null;
  for (const selector of submitSelectors) {
    const button = page.locator(selector).first();
    const count = await button.count();
    if (count > 0) {
      const buttonText = await button.textContent().catch(() => "");
      const isVisible = await button.isVisible().catch(() => false);
      console.log(
        `[AUTH]   Trying submit selector "${selector}": ${count} found, text: "${buttonText}", visible: ${isVisible}`,
      );
      if (isVisible) {
        submitButton = button;
        foundSubmitSelector = selector;
        break;
      }
    }
  }

  if (!submitButton) {
    console.log(
      `[AUTH]   No submit button found with specific selectors, trying fallback...`,
    );
    // Fallback: try to find any visible button
    const allButtons = page.locator("button");
    const buttonCount = await allButtons.count();
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        const buttonText = await button.textContent().catch(() => "");
        console.log(
          `[AUTH]   Found fallback button ${i}, text: "${buttonText}"`,
        );
        submitButton = button;
        break;
      }
    }
    if (!submitButton) {
      throw new Error(
        "Could not find submit/Continue button on Auth0 login page",
      );
    }
  } else {
    console.log(
      `[AUTH] Found Continue/submit button with selector: "${foundSubmitSelector}"`,
    );
  }

  const submitButtonText = await submitButton.textContent().catch(() => "");
  console.log(`[AUTH] Clicking submit button (text: "${submitButtonText}")...`);

  await submitButton.click();
  await waitForAuthReturn(page, applicationOrigin, auth0Origin);
  try {
    await waitForAuthSession(
      page.context().request,
      applicationOrigin,
      email,
      Role[roleName],
    );
  } catch (error) {
    throw new Error(
      `${error instanceof Error ? error.message : "Session verification failed"}; location=${authLocation(page)}`,
    );
  }
};

/**
 * Setup test: Authenticate as SignedIn user.
 *
 * Authenticates with Auth0 using the SignedIn test account and saves the browser
 * storage state to `playwright/.auth/signedin.json`. This file is then used by
 * the `authenticatedPageAsSignedIn` fixture in tests.
 *
 * @param {Object} options - Setup test options
 * @param {Page} options.page - Playwright page object
 * @returns {Promise<void>} Resolves when authentication and storage state save is complete
 */
setup("authenticate as signedIn", async ({ page, baseURL }) => {
  console.log(`\n[SETUP] ========================================`);
  console.log(`[SETUP] Starting SignedIn authentication setup`);
  console.log(`[SETUP] ========================================\n`);

  const authFile = path.join(authDir, "signedin.json");
  fs.rmSync(authFile, { force: true });
  const email = TEST_ACCOUNTS.signedIn;
  const password = TEST_PASSWORDS.signedIn;

  console.log(`[SETUP] Auth file path: ${authFile}`);
  console.log(`[SETUP] Email: ${email}`);
  console.log(`[SETUP] Password set: ${!!password}`);

  if (!password) {
    const message =
      "E2E_AUTH0_SIGNEDIN_PASSWORD is required for authentication setup";
    setup.skip(!process.env.CI, message);
    throw new Error(message);
  }

  await authenticateWithAuth0(page, email, password, "SignedIn", baseURL);

  console.log(`[SETUP] Saving storage state to ${authFile}...`);
  await saveVerifiedAuthState(
    page,
    authFile,
    new URL(page.url()).origin,
    email,
    Role.SignedIn,
  );

  // Verify file was created
  const fileExists = fs.existsSync(authFile);
  const fileStats = fileExists ? fs.statSync(authFile) : null;
  console.log(`[SETUP] Storage state file exists: ${fileExists}`);
  if (fileStats) {
    console.log(`[SETUP] Storage state file size: ${fileStats.size} bytes`);
  }

  console.log(`[SETUP] Verified SignedIn authentication and saved state`);
  console.log(`[SETUP] ========================================\n`);
});

/**
 * Setup test: Authenticate as Guest user.
 *
 * Authenticates with Auth0 using the Guest test account and saves the browser
 * storage state to `playwright/.auth/guest.json`. This file is then used by
 * the `authenticatedPageAsGuest` fixture in tests.
 *
 * @param {Object} options - Setup test options
 * @param {Page} options.page - Playwright page object
 * @returns {Promise<void>} Resolves when authentication and storage state save is complete
 */
setup("authenticate as guest", async ({ page, baseURL }) => {
  console.log(`\n[SETUP] ========================================`);
  console.log(`[SETUP] Starting Guest authentication setup`);
  console.log(`[SETUP] ========================================\n`);

  const authFile = path.join(authDir, "guest.json");
  fs.rmSync(authFile, { force: true });
  const email = TEST_ACCOUNTS.guest;
  const password = TEST_PASSWORDS.guest;

  console.log(`[SETUP] Auth file path: ${authFile}`);
  console.log(`[SETUP] Email: ${email}`);
  console.log(`[SETUP] Password set: ${!!password}`);

  if (!password) {
    const message =
      "E2E_AUTH0_GUEST_PASSWORD is required for authentication setup";
    setup.skip(!process.env.CI, message);
    throw new Error(message);
  }

  await authenticateWithAuth0(page, email, password, "Guest", baseURL);

  console.log(`[SETUP] Saving storage state to ${authFile}...`);
  await saveVerifiedAuthState(
    page,
    authFile,
    new URL(page.url()).origin,
    email,
    Role.Guest,
  );

  // Verify file was created
  const fileExists = fs.existsSync(authFile);
  const fileStats = fileExists ? fs.statSync(authFile) : null;
  console.log(`[SETUP] Storage state file exists: ${fileExists}`);
  if (fileStats) {
    console.log(`[SETUP] Storage state file size: ${fileStats.size} bytes`);
  }

  console.log(`[SETUP] Verified Guest authentication and saved state`);
  console.log(`[SETUP] ========================================\n`);
});

/**
 * Setup test: Authenticate as Member user.
 *
 * Authenticates with Auth0 using the Member test account and saves the browser
 * storage state to `playwright/.auth/member.json`. This file is then used by
 * the `authenticatedPageAsMember` fixture in tests.
 *
 * @param {Object} options - Setup test options
 * @param {Page} options.page - Playwright page object
 * @returns {Promise<void>} Resolves when authentication and storage state save is complete
 */
setup("authenticate as member", async ({ page, baseURL }) => {
  console.log(`\n[SETUP] ========================================`);
  console.log(`[SETUP] Starting Member authentication setup`);
  console.log(`[SETUP] ========================================\n`);

  const authFile = path.join(authDir, "member.json");
  fs.rmSync(authFile, { force: true });
  const email = TEST_ACCOUNTS.member;
  const password = TEST_PASSWORDS.member;

  console.log(`[SETUP] Auth file path: ${authFile}`);
  console.log(`[SETUP] Email: ${email}`);
  console.log(`[SETUP] Password set: ${!!password}`);

  if (!password) {
    const message =
      "E2E_AUTH0_MEMBER_PASSWORD is required for authentication setup";
    setup.skip(!process.env.CI, message);
    throw new Error(message);
  }

  await authenticateWithAuth0(page, email, password, "Member", baseURL);

  console.log(`[SETUP] Saving storage state to ${authFile}...`);
  await saveVerifiedAuthState(
    page,
    authFile,
    new URL(page.url()).origin,
    email,
    Role.Member,
  );

  // Verify file was created
  const fileExists = fs.existsSync(authFile);
  const fileStats = fileExists ? fs.statSync(authFile) : null;
  console.log(`[SETUP] Storage state file exists: ${fileExists}`);
  if (fileStats) {
    console.log(`[SETUP] Storage state file size: ${fileStats.size} bytes`);
  }

  console.log(`[SETUP] Verified Member authentication and saved state`);
  console.log(`[SETUP] ========================================\n`);
});

/**
 * Setup test: Authenticate as Admin user.
 *
 * Authenticates with Auth0 using the Admin test account and saves the browser
 * storage state to `playwright/.auth/admin.json`. This file is then used by
 * the `authenticatedPageAsAdmin` fixture in tests.
 *
 * @param {Object} options - Setup test options
 * @param {Page} options.page - Playwright page object
 * @returns {Promise<void>} Resolves when authentication and storage state save is complete
 */
setup("authenticate as admin", async ({ page, baseURL }) => {
  console.log(`\n[SETUP] ========================================`);
  console.log(`[SETUP] Starting Admin authentication setup`);
  console.log(`[SETUP] ========================================\n`);

  const authFile = path.join(authDir, "admin.json");
  fs.rmSync(authFile, { force: true });
  const email = TEST_ACCOUNTS.admin;
  const password = TEST_PASSWORDS.admin;

  console.log(`[SETUP] Auth file path: ${authFile}`);
  console.log(`[SETUP] Email: ${email}`);
  console.log(`[SETUP] Password set: ${!!password}`);

  if (!password) {
    const message =
      "E2E_AUTH0_ADMIN_PASSWORD is required for authentication setup";
    setup.skip(!process.env.CI, message);
    throw new Error(message);
  }

  await authenticateWithAuth0(page, email, password, "Admin", baseURL);

  console.log(`[SETUP] Saving storage state to ${authFile}...`);
  await saveVerifiedAuthState(
    page,
    authFile,
    new URL(page.url()).origin,
    email,
    Role.Admin,
  );

  // Verify file was created
  const fileExists = fs.existsSync(authFile);
  const fileStats = fileExists ? fs.statSync(authFile) : null;
  console.log(`[SETUP] Storage state file exists: ${fileExists}`);
  if (fileStats) {
    console.log(`[SETUP] Storage state file size: ${fileStats.size} bytes`);
  }

  console.log(`[SETUP] Verified Admin authentication and saved state`);
  console.log(`[SETUP] ========================================\n`);
});
