import { test as baseTest, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

/**
 * Custom Playwright fixtures using storageState for Auth0 authentication
 * These fixtures use pre-authenticated sessions created by auth.setup.ts
 * Use these fixtures when you want to test with real Auth0 authentication
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, "../../playwright/.auth");

/**
 * Helper function to check if auth file exists and provide helpful error message
 */
function getAuthFile(role: string): string {
  const authFile = path.join(authDir, `${role}.json`);

  // Log current working directory and absolute paths for debugging in Docker/GitHub Actions
  console.log(`🔍 [FIXTURE] Looking for auth file for ${role}...`);
  console.log(`🔍 [FIXTURE] Current working directory: ${process.cwd()}`);
  console.log(`🔍 [FIXTURE] Auth directory: ${authDir}`);
  console.log(`🔍 [FIXTURE] Auth directory absolute: ${path.resolve(authDir)}`);
  console.log(`🔍 [FIXTURE] Auth file path: ${authFile}`);
  console.log(`🔍 [FIXTURE] Auth file absolute: ${path.resolve(authFile)}`);
  console.log(`🔍 [FIXTURE] Auth directory exists: ${fs.existsSync(authDir)}`);

  if (fs.existsSync(authDir)) {
    const files = fs.readdirSync(authDir);
    console.log(`🔍 [FIXTURE] Files in auth directory: ${files.join(", ")}`);
  }

  if (!fs.existsSync(authFile)) {
    console.error(`\n❌ [FIXTURE] Auth file not found: ${authFile}`);
    console.error(
      `❌ [FIXTURE] This means the auth setup did not run or failed.`,
    );
    console.error(`❌ [FIXTURE] Make sure:`);
    console.error(`❌ [FIXTURE]   1. The setup project runs before tests`);
    console.error(
      `❌ [FIXTURE]   2. E2E_AUTH0_${role.toUpperCase()}_PASSWORD is set`,
    );
    console.error(`❌ [FIXTURE]   3. Auth0 authentication succeeded`);
    console.error(
      `❌ [FIXTURE]   4. In Docker/GitHub Actions, files persist between projects`,
    );

    // In Docker, check if we're in CI and provide Docker-specific guidance
    if (process.env.CI) {
      console.error(`❌ [FIXTURE] Running in CI environment`);
      console.error(
        `❌ [FIXTURE] Check that setup project completed successfully`,
      );
      console.error(
        `❌ [FIXTURE] Check GitHub Actions logs for auth.setup.ts output`,
      );
      console.error(
        `❌ [FIXTURE] Verify password env vars are set in GitHub Actions secrets`,
      );
    }

    throw new Error(
      `Auth file not found: ${authFile}. ` +
        `Make sure auth.setup.ts runs successfully and creates the auth files. ` +
        `Check that E2E_AUTH0_${role.toUpperCase()}_PASSWORD is set. ` +
        `In Docker/GitHub Actions, ensure the setup project runs before tests.`,
    );
  }

  console.log(`✅ [FIXTURE] Found auth file for ${role}: ${authFile}`);
  const fileStats = fs.statSync(authFile);
  console.log(`✅ [FIXTURE] Auth file size: ${fileStats.size} bytes`);
  return authFile;
}

export const test = baseTest.extend<{
  authenticatedPageAsSignedIn: Page;
  authenticatedPageAsGuest: Page;
  authenticatedPageAsMember: Page;
  authenticatedPageAsAdmin: Page;
}>({
  /**
   * Fixture that provides a page authenticated as SignedIn user
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
   * Fixture that provides a page authenticated as Guest user
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
   * Fixture that provides a page authenticated as Member user
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
   * Fixture that provides a page authenticated as Admin user
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
