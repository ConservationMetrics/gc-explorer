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
    try {
      console.log(`🔍 [TEST] Setting SignedIn role via fixture`);
      const response = await request.post("/api/test/set-session", {
        data: { role: Role.SignedIn },
      });
      const status = response.status();
      console.log(`🔍 [TEST] Response status: ${status}`);

      if (status !== 200) {
        const responseText = await response
          .text()
          .catch(() => "Unable to read response");
        const responseJson = await response.json().catch(() => null);
        console.error(`❌ [TEST] Error response (${status}):`, {
          status,
          text: responseText,
          json: responseJson ? JSON.stringify(responseJson, null, 2) : null,
        });
        throw new Error(
          `Failed to set SignedIn role: ${status} - ${responseText}`,
        );
      }

      const responseBody = await response.json().catch(() => null);
      console.log(
        `🔍 [TEST] Response body:`,
        JSON.stringify(responseBody, null, 2),
      );
      await use(page);
    } catch (error) {
      console.error(`❌ [TEST] Error in loggedInPageAsSignedIn fixture:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorStringified: JSON.stringify(
          error,
          Object.getOwnPropertyNames(error),
        ),
      });
      throw error;
    }
  },

  /**
   * Fixture that sets Guest role and returns the page
   */
  loggedInPageAsGuest: async (
    { page, request }: { page: Page; request: APIRequestContext },
    use: (page: Page) => Promise<void>,
  ) => {
    try {
      console.log(`🔍 [TEST] Setting Guest role via fixture`);
      const response = await request.post("/api/test/set-session", {
        data: { role: Role.Guest },
      });
      const status = response.status();
      console.log(`🔍 [TEST] Response status: ${status}`);

      if (status !== 200) {
        const responseText = await response
          .text()
          .catch(() => "Unable to read response");
        const responseJson = await response.json().catch(() => null);
        console.error(`❌ [TEST] Error response (${status}):`, {
          status,
          text: responseText,
          json: responseJson ? JSON.stringify(responseJson, null, 2) : null,
        });
        throw new Error(
          `Failed to set Guest role: ${status} - ${responseText}`,
        );
      }

      const responseBody = await response.json().catch(() => null);
      console.log(
        `🔍 [TEST] Response body:`,
        JSON.stringify(responseBody, null, 2),
      );
      await use(page);
    } catch (error) {
      console.error(`❌ [TEST] Error in loggedInPageAsGuest fixture:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorStringified: JSON.stringify(
          error,
          Object.getOwnPropertyNames(error),
        ),
      });
      throw error;
    }
  },

  /**
   * Fixture that sets Member role and returns the page
   */
  loggedInPageAsMember: async (
    { page, request }: { page: Page; request: APIRequestContext },
    use: (page: Page) => Promise<void>,
  ) => {
    try {
      console.log(`🔍 [TEST] Setting Member role via fixture`);
      const response = await request.post("/api/test/set-session", {
        data: { role: Role.Member },
      });
      const status = response.status();
      console.log(`🔍 [TEST] Response status: ${status}`);

      if (status !== 200) {
        const responseText = await response
          .text()
          .catch(() => "Unable to read response");
        const responseJson = await response.json().catch(() => null);
        console.error(`❌ [TEST] Error response (${status}):`, {
          status,
          text: responseText,
          json: responseJson ? JSON.stringify(responseJson, null, 2) : null,
        });
        throw new Error(
          `Failed to set Member role: ${status} - ${responseText}`,
        );
      }

      const responseBody = await response.json().catch(() => null);
      console.log(
        `🔍 [TEST] Response body:`,
        JSON.stringify(responseBody, null, 2),
      );
      await use(page);
    } catch (error) {
      console.error(`❌ [TEST] Error in loggedInPageAsMember fixture:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorStringified: JSON.stringify(
          error,
          Object.getOwnPropertyNames(error),
        ),
      });
      throw error;
    }
  },

  /**
   * Fixture that sets Admin role and returns the page
   */
  loggedInPageAsAdmin: async (
    { page, request }: { page: Page; request: APIRequestContext },
    use: (page: Page) => Promise<void>,
  ) => {
    try {
      console.log(`🔍 [TEST] Setting Admin role via fixture`);
      const response = await request.post("/api/test/set-session", {
        data: { role: Role.Admin },
      });
      const status = response.status();
      console.log(`🔍 [TEST] Response status: ${status}`);

      if (status !== 200) {
        const responseText = await response
          .text()
          .catch(() => "Unable to read response");
        const responseJson = await response.json().catch(() => null);
        console.error(`❌ [TEST] Error response (${status}):`, {
          status,
          text: responseText,
          json: responseJson ? JSON.stringify(responseJson, null, 2) : null,
        });
        throw new Error(
          `Failed to set Admin role: ${status} - ${responseText}`,
        );
      }

      const responseBody = await response.json().catch(() => null);
      console.log(
        `🔍 [TEST] Response body:`,
        JSON.stringify(responseBody, null, 2),
      );
      await use(page);
    } catch (error) {
      console.error(`❌ [TEST] Error in loggedInPageAsAdmin fixture:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorStringified: JSON.stringify(
          error,
          Object.getOwnPropertyNames(error),
        ),
      });
      throw error;
    }
  },
});

export { expect } from "@playwright/test";
