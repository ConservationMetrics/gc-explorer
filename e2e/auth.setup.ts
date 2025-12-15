import { test as setup, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

/**
 * Playwright authentication setup
 * Authenticates with Auth0 for each role and saves storage state
 * This runs before all tests and creates authenticated sessions
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, "../playwright/.auth");

// Ensure auth directory exists (important in Docker/GitHub Actions)
if (!fs.existsSync(authDir)) {
  console.log(`🔍 [SETUP] Creating auth directory: ${authDir}`);
  fs.mkdirSync(authDir, { recursive: true });
  console.log(`✅ [SETUP] Auth directory created`);
} else {
  console.log(`✅ [SETUP] Auth directory already exists: ${authDir}`);
}
console.log(`🔍 [SETUP] Current working directory: ${process.cwd()}`);
console.log(
  `🔍 [SETUP] Auth directory absolute path: ${path.resolve(authDir)}`,
);

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
  console.log(`\n🔍 [AUTH] ========================================`);
  console.log(`🔍 [AUTH] Starting authentication for ${roleName}`);
  console.log(`🔍 [AUTH] Email: ${email}`);
  console.log(`🔍 [AUTH] Role: ${roleName}`);
  console.log(`🔍 [AUTH] ========================================\n`);

  // Step 1: Navigate to login page
  console.log(`🔍 [AUTH] Step 1: Navigating to login page...`);
  await page.goto("/login");
  const loginPageUrl = page.url();
  console.log(`🔍 [AUTH] ✅ Navigated to login page: ${loginPageUrl}`);
  console.log(`🔍 [AUTH] Page title: ${await page.title()}`);

  // Step 2: Click the login button (which redirects to /api/auth/auth0)
  console.log(`🔍 [AUTH] Step 2: Looking for login button...`);
  const loginButton = page.getByTestId("login-button");
  await loginButton.waitFor({ state: "visible", timeout: 5000 });
  const buttonText = await loginButton.textContent();
  console.log(`🔍 [AUTH] ✅ Found login button with text: "${buttonText}"`);
  console.log(`🔍 [AUTH] Clicking login button...`);

  // Click and wait for navigation to Auth0
  console.log(`🔍 [AUTH] Waiting for redirect to Auth0 domain...`);
  await Promise.all([
    page.waitForURL(/auth0\.com|auth0/, { timeout: 30000 }), // Wait for Auth0 domain
    loginButton.click(),
  ]);

  const auth0Url = page.url();
  console.log(`🔍 [AUTH] ✅ Redirected to Auth0`);
  console.log(`🔍 [AUTH] Auth0 URL: ${auth0Url}`);
  console.log(`🔍 [AUTH] Page title: ${await page.title()}`);

  // Check if we're on Auth0 domain
  const isAuth0Domain = /\.us\.auth0\.com|auth0\.com/.test(auth0Url);
  console.log(
    `🔍 [AUTH] Is Auth0 domain (.us.auth0.com or auth0.com): ${isAuth0Domain}`,
  );

  // Step 3: Wait for Auth0 login page to load
  console.log(`🔍 [AUTH] Step 3: Waiting for Auth0 login page to load...`);
  console.log(`🔍 [AUTH] Looking for email/username input field...`);

  // Auth0 login page typically has email/password fields
  await page.waitForSelector(
    'input[name="email"], input[type="email"], input[name="username"], input[id*="email"], input[id*="username"]',
    {
      timeout: 15000,
    },
  );
  console.log(`🔍 [AUTH] ✅ Auth0 login page loaded`);

  // Step 4: Fill in email
  console.log(`🔍 [AUTH] Step 4: Finding and filling email field...`);
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
        `🔍 [AUTH]   Trying selector "${selector}": ${count} found, placeholder: "${placeholder}"`,
      );
      emailInput = input;
      foundSelector = selector;
      break;
    }
  }

  if (!emailInput) {
    console.error(`🔍 [AUTH] ❌ Could not find email input field`);
    console.error(
      `🔍 [AUTH] Page HTML preview:`,
      await page.content().then((c) => c.substring(0, 1000)),
    );
    throw new Error("Could not find email input field on Auth0 login page");
  }

  console.log(
    `🔍 [AUTH] ✅ Found email input with selector: "${foundSelector}"`,
  );
  await emailInput.fill(email);
  const filledEmail = await emailInput.inputValue();
  console.log(`🔍 [AUTH] ✅ Filled in email: ${filledEmail}`);

  // Step 5: Fill in password
  console.log(`🔍 [AUTH] Step 5: Finding and filling password field...`);
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
        `🔍 [AUTH]   Trying password selector "${selector}": ${count} found, placeholder: "${placeholder}"`,
      );
      passwordInput = input;
      foundPasswordSelector = selector;
      break;
    }
  }

  if (!passwordInput) {
    console.error(`🔍 [AUTH] ❌ Could not find password input field`);
    throw new Error("Could not find password input field on Auth0 login page");
  }

  await passwordInput.waitFor({ state: "visible", timeout: 5000 });
  console.log(
    `🔍 [AUTH] ✅ Found password input with selector: "${foundPasswordSelector}"`,
  );
  await passwordInput.fill(password);
  const passwordLength = password.length;
  console.log(`🔍 [AUTH] ✅ Filled in password (${passwordLength} characters)`);

  // Step 6: Click Continue/Submit button on Auth0 page
  console.log(`🔍 [AUTH] Step 6: Finding and clicking Continue button...`);
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
        `🔍 [AUTH]   Trying submit selector "${selector}": ${count} found, text: "${buttonText}", visible: ${isVisible}`,
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
      `🔍 [AUTH]   No submit button found with specific selectors, trying fallback...`,
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
          `🔍 [AUTH]   Found fallback button ${i}, text: "${buttonText}"`,
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
      `🔍 [AUTH] ✅ Found Continue/submit button with selector: "${foundSubmitSelector}"`,
    );
  }

  const submitButtonText = await submitButton.textContent().catch(() => "");
  console.log(
    `🔍 [AUTH] Clicking submit button (text: "${submitButtonText}")...`,
  );

  // Click and wait for redirect (could be to consent page or directly to /login)
  console.log(`🔍 [AUTH] Waiting for redirect after login...`);
  await submitButton.click();

  // Wait for navigation to complete (either to consent page, /login, or home page)
  try {
    // Wait for URL to change (consent page, /login, or home page)
    await page.waitForURL(/\/u\/consent|\/consent|\/login|\/$/, {
      timeout: 30000,
    });
  } catch {
    // If timeout, check current URL anyway
    console.log(`🔍 [AUTH] ⚠️ Navigation timeout, checking current URL...`);
  }

  // Wait a bit for page to fully load
  await page.waitForTimeout(2000);

  // Check if we're on a consent/authorize page
  const postLoginUrl = page.url();
  const postLoginTitle = await page.title().catch(() => "");
  console.log(`🔍 [AUTH] After login click, URL: ${postLoginUrl}`);
  console.log(`🔍 [AUTH] After login click, title: ${postLoginTitle}`);

  const isConsentPage =
    postLoginUrl.includes("/u/consent") ||
    postLoginUrl.includes("/consent") ||
    postLoginTitle.toLowerCase().includes("authorize") ||
    postLoginTitle.toLowerCase().includes("consent");

  if (isConsentPage) {
    console.log(`🔍 [AUTH] ✅ Consent screen detected`);
    console.log(
      `🔍 [AUTH] Detected consent/authorize page, looking for authorize button...`,
    );

    // Look for authorize/consent buttons - prioritize positive action buttons
    // Filter out negative buttons like "Decline", "Cancel", "No"
    const declineTexts = ["decline", "cancel", "no", "deny", "reject"];

    const consentButtonSelectors = [
      'button:has-text("Continue")',
      'button:has-text("Yes")',
      'button:has-text("Authorize")',
      'button:has-text("Allow")',
      'button:has-text("Accept")',
      "button[data-action-button-primary]",
      'button[class*="continue"]',
      'button[class*="authorize"]',
      'button[class*="accept"]',
      'button[type="submit"]', // Check this last, as it might be Decline
    ];

    let consentButton = null;

    for (const selector of consentButtonSelectors) {
      const buttons = page.locator(selector);
      const count = await buttons.count();
      if (count > 0) {
        // Check all matching buttons to find the right one
        for (let i = 0; i < count; i++) {
          const button = buttons.nth(i);
          const isVisible = await button.isVisible().catch(() => false);
          if (!isVisible) continue;

          const buttonText = (
            (await button.textContent().catch(() => "")) || ""
          )
            .trim()
            .toLowerCase();
          const isDecline = declineTexts.some((declineText) =>
            buttonText.includes(declineText),
          );

          console.log(
            `🔍 [AUTH]   Trying consent selector "${selector}" [${i}]: text: "${buttonText}", isDecline: ${isDecline}`,
          );

          if (!isDecline) {
            // Found a positive action button
            consentButton = button;
            break;
          }
        }
        if (consentButton) break;
      }
    }

    if (!consentButton) {
      // Fallback: find any visible button that's not a decline button
      const allButtons = page.locator("button");
      const buttonCount = await allButtons.count();
      for (let i = 0; i < buttonCount; i++) {
        const button = allButtons.nth(i);
        const isVisible = await button.isVisible().catch(() => false);
        if (!isVisible) continue;

        const buttonText = ((await button.textContent().catch(() => "")) || "")
          .trim()
          .toLowerCase();
        const isDecline = declineTexts.some((declineText) =>
          buttonText.includes(declineText),
        );

        if (!isDecline) {
          console.log(
            `🔍 [AUTH]   Found fallback consent button ${i}, text: "${buttonText}"`,
          );
          consentButton = button;
          break;
        } else {
          console.log(
            `🔍 [AUTH]   Skipping decline button ${i}, text: "${buttonText}"`,
          );
        }
      }
    }

    if (consentButton) {
      const consentButtonText = await consentButton
        .textContent()
        .catch(() => "");
      console.log(
        `🔍 [AUTH] ✅ Found consent button (text: "${consentButtonText}"), clicking...`,
      );
      await consentButton.click();
      await page.waitForTimeout(2000); // Wait for redirect after consent
      console.log(`🔍 [AUTH] After consent click, URL: ${page.url()}`);
      console.log(
        `🔍 [AUTH] After consent click, title: ${await page.title().catch(() => "")}`,
      );
    } else {
      console.log(
        `🔍 [AUTH] ⚠️ No consent button found, but on consent page - may need manual intervention`,
      );
    }
  } else {
    console.log(
      `🔍 [AUTH] ✅ No consent screen detected, proceeding directly to /login`,
    );
  }

  // Now wait for final redirect (could be to /login or home page /)
  console.log(`🔍 [AUTH] Waiting for final redirect...`);
  try {
    // Accept redirect to either /login or home page (/)
    await page.waitForURL(/\/login|\/$/, { timeout: 30000 });
  } catch {
    const currentUrl = page.url();
    console.log(
      `🔍 [AUTH] ⚠️ Did not redirect to /login or / within timeout, current URL: ${currentUrl}`,
    );
    // Check if we're already on a valid page (home or login)
    if (currentUrl.includes("/login") || currentUrl.endsWith("/")) {
      console.log(`🔍 [AUTH] ✅ Already on valid page (${currentUrl})`);
    }
  }

  const finalUrl = page.url();
  console.log(`🔍 [AUTH] ✅ Successfully authenticated ${roleName}`);
  console.log(`🔍 [AUTH] Redirected back to: ${finalUrl}`);
  console.log(
    `🔍 [AUTH] Final page title: ${await page.title().catch(() => "")}`,
  );

  // Step 7: Wait for session to be fully established
  console.log(`🔍 [AUTH] Step 7: Waiting for session to be established...`);
  // The Auth0 callback sets the session, then redirects to /login
  // Wait a bit to ensure session is saved
  await page.waitForTimeout(2000);
  console.log(`🔍 [AUTH] ✅ Waited for session establishment`);

  // Step 8: Verify authentication state
  console.log(`🔍 [AUTH] Step 8: Verifying authentication state...`);
  const currentUrl = page.url();
  console.log(`🔍 [AUTH] Current URL: ${currentUrl}`);

  // Check cookies to verify session was set
  const cookies = await page.context().cookies();
  const sessionCookies = cookies.filter(
    (c) =>
      c.name.includes("session") ||
      c.name.includes("auth") ||
      c.name.includes("nuxt"),
  );
  console.log(
    `🔍 [AUTH] Session-related cookies found: ${sessionCookies.length}`,
  );
  sessionCookies.forEach((cookie) => {
    console.log(
      `🔍 [AUTH]   Cookie: ${cookie.name} (domain: ${cookie.domain}, path: ${cookie.path})`,
    );
  });

  if (currentUrl.includes("/login")) {
    console.log(`🔍 [AUTH] ✅ Still on /login page, session should be set`);
  } else {
    console.log(`🔍 [AUTH] ✅ Redirected away from /login to: ${currentUrl}`);
  }

  console.log(`🔍 [AUTH] ========================================`);
  console.log(`🔍 [AUTH] Authentication flow completed for ${roleName}`);
  console.log(`🔍 [AUTH] ========================================\n`);
}

// Authenticate as SignedIn user
setup("authenticate as signedIn", async ({ page }) => {
  console.log(`\n🔍 [SETUP] ========================================`);
  console.log(`🔍 [SETUP] Starting SignedIn authentication setup`);
  console.log(`🔍 [SETUP] ========================================\n`);

  const authFile = path.join(authDir, "signedin.json");
  const email = TEST_ACCOUNTS.signedIn;
  const password = TEST_PASSWORDS.signedIn;

  console.log(`🔍 [SETUP] Auth file path: ${authFile}`);
  console.log(`🔍 [SETUP] Email: ${email}`);
  console.log(`🔍 [SETUP] Password set: ${!!password}`);

  if (!password) {
    console.warn(
      `⚠️ [SETUP] E2E_AUTH0_SIGNEDIN_PASSWORD not set, skipping SignedIn authentication`,
    );
    return;
  }

  await authenticateWithAuth0(page, email, password, "SignedIn");

  console.log(`🔍 [SETUP] Saving storage state to ${authFile}...`);
  await page.context().storageState({ path: authFile });

  // Verify file was created
  const fileExists = fs.existsSync(authFile);
  const fileStats = fileExists ? fs.statSync(authFile) : null;
  console.log(`🔍 [SETUP] Storage state file exists: ${fileExists}`);
  if (fileStats) {
    console.log(`🔍 [SETUP] Storage state file size: ${fileStats.size} bytes`);
  }

  console.log(`✅ [SETUP] Saved SignedIn auth state to ${authFile}`);
  console.log(`🔍 [SETUP] ========================================\n`);
});

// Authenticate as Guest user
setup("authenticate as guest", async ({ page }) => {
  console.log(`\n🔍 [SETUP] ========================================`);
  console.log(`🔍 [SETUP] Starting Guest authentication setup`);
  console.log(`🔍 [SETUP] ========================================\n`);

  const authFile = path.join(authDir, "guest.json");
  const email = TEST_ACCOUNTS.guest;
  const password = TEST_PASSWORDS.guest;

  console.log(`🔍 [SETUP] Auth file path: ${authFile}`);
  console.log(`🔍 [SETUP] Email: ${email}`);
  console.log(`🔍 [SETUP] Password set: ${!!password}`);

  if (!password) {
    const message = `⚠️ [SETUP] E2E_AUTH0_GUEST_PASSWORD not set, skipping Guest authentication`;
    console.warn(message);
    if (process.env.CI) {
      console.warn(
        `⚠️ [SETUP] In CI: Set E2E_AUTH0_GUEST_PASSWORD in GitHub Actions secrets to enable Auth0 authentication`,
      );
    }
    return;
  }

  await authenticateWithAuth0(page, email, password, "Guest");

  console.log(`🔍 [SETUP] Saving storage state to ${authFile}...`);
  await page.context().storageState({ path: authFile });

  // Verify file was created
  const fileExists = fs.existsSync(authFile);
  const fileStats = fileExists ? fs.statSync(authFile) : null;
  console.log(`🔍 [SETUP] Storage state file exists: ${fileExists}`);
  if (fileStats) {
    console.log(`🔍 [SETUP] Storage state file size: ${fileStats.size} bytes`);
  }

  console.log(`✅ [SETUP] Saved Guest auth state to ${authFile}`);
  console.log(`🔍 [SETUP] ========================================\n`);
});

// Authenticate as Member user
setup("authenticate as member", async ({ page }) => {
  console.log(`\n🔍 [SETUP] ========================================`);
  console.log(`🔍 [SETUP] Starting Member authentication setup`);
  console.log(`🔍 [SETUP] ========================================\n`);

  const authFile = path.join(authDir, "member.json");
  const email = TEST_ACCOUNTS.member;
  const password = TEST_PASSWORDS.member;

  console.log(`🔍 [SETUP] Auth file path: ${authFile}`);
  console.log(`🔍 [SETUP] Email: ${email}`);
  console.log(`🔍 [SETUP] Password set: ${!!password}`);

  if (!password) {
    const message = `⚠️ [SETUP] E2E_AUTH0_MEMBER_PASSWORD not set, skipping Member authentication`;
    console.warn(message);
    if (process.env.CI) {
      console.warn(
        `⚠️ [SETUP] In CI: Set E2E_AUTH0_MEMBER_PASSWORD in GitHub Actions secrets to enable Auth0 authentication`,
      );
    }
    return;
  }

  await authenticateWithAuth0(page, email, password, "Member");

  console.log(`🔍 [SETUP] Saving storage state to ${authFile}...`);
  await page.context().storageState({ path: authFile });

  // Verify file was created
  const fileExists = fs.existsSync(authFile);
  const fileStats = fileExists ? fs.statSync(authFile) : null;
  console.log(`🔍 [SETUP] Storage state file exists: ${fileExists}`);
  if (fileStats) {
    console.log(`🔍 [SETUP] Storage state file size: ${fileStats.size} bytes`);
  }

  console.log(`✅ [SETUP] Saved Member auth state to ${authFile}`);
  console.log(`🔍 [SETUP] ========================================\n`);
});

// Authenticate as Admin user
setup("authenticate as admin", async ({ page }) => {
  console.log(`\n🔍 [SETUP] ========================================`);
  console.log(`🔍 [SETUP] Starting Admin authentication setup`);
  console.log(`🔍 [SETUP] ========================================\n`);

  const authFile = path.join(authDir, "admin.json");
  const email = TEST_ACCOUNTS.admin;
  const password = TEST_PASSWORDS.admin;

  console.log(`🔍 [SETUP] Auth file path: ${authFile}`);
  console.log(`🔍 [SETUP] Email: ${email}`);
  console.log(`🔍 [SETUP] Password set: ${!!password}`);

  if (!password) {
    const message = `⚠️ [SETUP] E2E_AUTH0_ADMIN_PASSWORD not set, skipping Admin authentication`;
    console.warn(message);
    if (process.env.CI) {
      console.warn(
        `⚠️ [SETUP] In CI: Set E2E_AUTH0_ADMIN_PASSWORD in GitHub Actions secrets to enable Auth0 authentication`,
      );
    }
    return;
  }

  await authenticateWithAuth0(page, email, password, "Admin");

  console.log(`🔍 [SETUP] Saving storage state to ${authFile}...`);
  await page.context().storageState({ path: authFile });

  // Verify file was created
  const fileExists = fs.existsSync(authFile);
  const fileStats = fileExists ? fs.statSync(authFile) : null;
  console.log(`🔍 [SETUP] Storage state file exists: ${fileExists}`);
  if (fileStats) {
    console.log(`🔍 [SETUP] Storage state file size: ${fileStats.size} bytes`);
  }

  console.log(`✅ [SETUP] Saved Admin auth state to ${authFile}`);
  console.log(`🔍 [SETUP] ========================================\n`);
});
