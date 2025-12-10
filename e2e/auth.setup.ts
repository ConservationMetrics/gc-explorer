import { test as setup, type Page } from "@playwright/test";
import path from "path";

/**
 * Playwright authentication setup
 * Authenticates with Auth0 for each role and saves storage state
 * This runs before all tests and creates authenticated sessions
 */

const authDir = path.join(__dirname, "../playwright/.auth");

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
 * Helper function to authenticate with Auth0
 * Follows the actual Auth0 OAuth flow:
 * 1. Go to /login page
 * 2. Click login button (redirects to /api/auth/auth0)
 * 3. Auth0 redirects to Auth0 hosted login page
 * 4. Fill in email/password on Auth0's page
 * 5. Submit and wait for redirect back to /login
 */
async function authenticateWithAuth0(
  page: Page,
  email: string,
  password: string,
  roleName: string,
) {
  console.log(`🔍 [AUTH] Starting authentication for ${roleName} (${email})`);

  // Step 1: Navigate to login page
  await page.goto("/login");
  console.log(`🔍 [AUTH] Navigated to login page: ${page.url()}`);

  // Step 2: Click the login button (which redirects to /api/auth/auth0)
  const loginButton = page.getByTestId("login-button");
  await loginButton.waitFor({ state: "visible", timeout: 5000 });
  console.log(`🔍 [AUTH] Clicking login button...`);

  // Click and wait for navigation to Auth0
  await Promise.all([
    page.waitForURL(/auth0\.com|auth0/, { timeout: 30000 }), // Wait for Auth0 domain
    loginButton.click(),
  ]);

  console.log(`🔍 [AUTH] Redirected to Auth0: ${page.url()}`);

  // Step 3: Wait for Auth0 login page to load
  // Auth0 login page typically has email/password fields
  await page.waitForSelector(
    'input[name="email"], input[type="email"], input[name="username"], input[id*="email"], input[id*="username"]',
    {
      timeout: 15000,
    },
  );

  // Step 4: Fill in email
  // Try multiple selectors for Auth0's email field
  const emailSelectors = [
    'input[name="email"]',
    'input[type="email"]',
    'input[name="username"]',
    'input[id*="email"]',
    'input[id*="username"]',
  ];

  let emailInput = null;
  for (const selector of emailSelectors) {
    const input = page.locator(selector).first();
    if ((await input.count()) > 0) {
      emailInput = input;
      break;
    }
  }

  if (!emailInput) {
    throw new Error("Could not find email input field on Auth0 login page");
  }

  await emailInput.fill(email);
  console.log(`🔍 [AUTH] Filled in email: ${email}`);

  // Step 5: Fill in password
  const passwordInput = page
    .locator(
      'input[name="password"], input[type="password"], input[id*="password"]',
    )
    .first();
  await passwordInput.waitFor({ state: "visible", timeout: 5000 });
  await passwordInput.fill(password);
  console.log(`🔍 [AUTH] Filled in password`);

  // Step 6: Click submit/login button on Auth0 page
  // Auth0 buttons can have various text/labels
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Continue")',
    'button:has-text("Log in")',
    'button:has-text("Sign in")',
    'button:has-text("Continue with Email")',
    "button[data-action-button-primary]", // Auth0's primary action button
  ];

  let submitButton = null;
  for (const selector of submitSelectors) {
    const button = page.locator(selector).first();
    if ((await button.count()) > 0) {
      submitButton = button;
      break;
    }
  }

  if (!submitButton) {
    // Fallback: try to find any button
    submitButton = page.locator("button").first();
  }

  console.log(`🔍 [AUTH] Clicking submit button...`);

  // Click and wait for redirect back to our app
  await Promise.all([
    page.waitForURL(/\/login/, { timeout: 30000 }), // Wait for redirect back to /login
    submitButton.click(),
  ]);

  console.log(
    `🔍 [AUTH] Successfully authenticated ${roleName}, redirected back to: ${page.url()}`,
  );

  // Step 7: Wait for session to be fully established
  // The Auth0 callback sets the session, then redirects to /login
  // Wait a bit to ensure session is saved
  await page.waitForTimeout(2000);

  // Optional: Verify we're actually logged in by checking if we get redirected away from /login
  // or by checking for authenticated state indicators
  const currentUrl = page.url();
  if (currentUrl.includes("/login")) {
    console.log(`🔍 [AUTH] Still on /login page, session should be set`);
  } else {
    console.log(`🔍 [AUTH] Redirected away from /login to: ${currentUrl}`);
  }
}

// Authenticate as SignedIn user
setup("authenticate as signedIn", async ({ page }) => {
  const authFile = path.join(authDir, "signedin.json");
  const email = TEST_ACCOUNTS.signedIn;
  const password = TEST_PASSWORDS.signedIn;

  if (!password) {
    console.warn(
      `⚠️ [AUTH] E2E_AUTH0_SIGNEDIN_PASSWORD not set, skipping SignedIn authentication`,
    );
    return;
  }

  await authenticateWithAuth0(page, email, password, "SignedIn");
  await page.context().storageState({ path: authFile });
  console.log(`✅ [AUTH] Saved SignedIn auth state to ${authFile}`);
});

// Authenticate as Guest user
setup("authenticate as guest", async ({ page }) => {
  const authFile = path.join(authDir, "guest.json");
  const email = TEST_ACCOUNTS.guest;
  const password = TEST_PASSWORDS.guest;

  if (!password) {
    console.warn(
      `⚠️ [AUTH] E2E_AUTH0_GUEST_PASSWORD not set, skipping Guest authentication`,
    );
    return;
  }

  await authenticateWithAuth0(page, email, password, "Guest");
  await page.context().storageState({ path: authFile });
  console.log(`✅ [AUTH] Saved Guest auth state to ${authFile}`);
});

// Authenticate as Member user
setup("authenticate as member", async ({ page }) => {
  const authFile = path.join(authDir, "member.json");
  const email = TEST_ACCOUNTS.member;
  const password = TEST_PASSWORDS.member;

  if (!password) {
    console.warn(
      `⚠️ [AUTH] E2E_AUTH0_MEMBER_PASSWORD not set, skipping Member authentication`,
    );
    return;
  }

  await authenticateWithAuth0(page, email, password, "Member");
  await page.context().storageState({ path: authFile });
  console.log(`✅ [AUTH] Saved Member auth state to ${authFile}`);
});

// Authenticate as Admin user
setup("authenticate as admin", async ({ page }) => {
  const authFile = path.join(authDir, "admin.json");
  const email = TEST_ACCOUNTS.admin;
  const password = TEST_PASSWORDS.admin;

  if (!password) {
    console.warn(
      `⚠️ [AUTH] E2E_AUTH0_ADMIN_PASSWORD not set, skipping Admin authentication`,
    );
    return;
  }

  await authenticateWithAuth0(page, email, password, "Admin");
  await page.context().storageState({ path: authFile });
  console.log(`✅ [AUTH] Saved Admin auth state to ${authFile}`);
});
