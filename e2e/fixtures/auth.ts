import {
  test as baseTest,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { Role } from "~/types/types";

/**
 * Custom Playwright fixture for setting user sessions in tests
 * This allows us to test RBAC without actual authentication
 * Uses request to set session, then returns the page for use in tests
 */
export const test = baseTest.extend<{
  loggedInPageAsSignedIn: Page;
  loggedInPageAsGuest: Page;
  loggedInPageAsMember: Page;
  loggedInPageAsAdmin: Page;
}>({
  /**
   * Fixture that sets SignedIn role and returns the page
   */
  loggedInPageAsSignedIn: async (
    { page, request }: { page: Page; request: APIRequestContext },
    use: (page: Page) => Promise<void>,
  ) => {
    console.log(`🔍 [TEST] Setting SignedIn role via fixture`);
    const response = await request.post("/api/test/set-session", {
      data: { role: Role.SignedIn },
    });
    console.log(`🔍 [TEST] Response: ${response.status()}`);
    console.log(`🔍 [TEST] Response body: ${await response.json()}`);
    await use(page);
  },

  /**
   * Fixture that sets Guest role and returns the page
   */
  loggedInPageAsGuest: async (
    { page, request }: { page: Page; request: APIRequestContext },
    use: (page: Page) => Promise<void>,
  ) => {
    console.log(`🔍 [TEST] Setting Guest role via fixture`);
    await request.post("/api/test/set-session", {
      data: { role: Role.Guest },
    });
    await use(page);
  },

  /**
   * Fixture that sets Member role and returns the page
   */
  loggedInPageAsMember: async (
    { page, request }: { page: Page; request: APIRequestContext },
    use: (page: Page) => Promise<void>,
  ) => {
    console.log(`🔍 [TEST] Setting Member role via fixture`);
    await request.post("/api/test/set-session", {
      data: { role: Role.Member },
    });
    await use(page);
  },

  /**
   * Fixture that sets Admin role and returns the page
   */
  loggedInPageAsAdmin: async (
    { page, request }: { page: Page; request: APIRequestContext },
    use: (page: Page) => Promise<void>,
  ) => {
    console.log(`🔍 [TEST] Setting Admin role via fixture`);
    await request.post("/api/test/set-session", {
      data: { role: Role.Admin },
    });
    await use(page);
  },
});

export { expect } from "@playwright/test";
