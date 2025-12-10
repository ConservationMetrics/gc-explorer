import { test as baseTest, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Custom Playwright fixtures using storageState for Auth0 authentication
 * These fixtures use pre-authenticated sessions created by auth.setup.ts
 * Use these fixtures when you want to test with real Auth0 authentication
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, "../../playwright/.auth");

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
    const authFile = path.join(authDir, "signedin.json");
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
    const authFile = path.join(authDir, "guest.json");
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
    const authFile = path.join(authDir, "member.json");
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
    const authFile = path.join(authDir, "admin.json");
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
