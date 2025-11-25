import { test as baseTest } from "@playwright/test";
import { Role } from "~/types/types";

/**
 * Custom Playwright fixture for setting user sessions in tests
 * This allows us to test RBAC without actual authentication
 * Uses page.request to ensure cookies are shared with page context
 */
export const test = baseTest.extend<{
  setTestRole: (role: Role) => Promise<void>;
  clearTestSession: () => Promise<void>;
}>({
  /**
   * Helper function to set a test user role via server endpoint
   * Uses page.request so cookies are shared with the page context
   */
  setTestRole: async ({ page }, use) => {
    let currentRole: Role | null = null;

    await use(async (role: Role) => {
      currentRole = role;
      console.log(`🔍 [TEST] Setting test role via fixture: ${role}`);
      try {
        // Use page.request to ensure cookies are shared with page context
        const response = await page.request.post("/api/test/set-session", {
          data: { role },
        });
        console.log(`🔍 [TEST] Set role response status:`, response.status());
        const responseBody = await response.json();
        console.log(`🔍 [TEST] Set role response:`, responseBody);

        // Verify cookies were set
        const cookies = await page.context().cookies();
        console.log(
          `🔍 [TEST] Cookies after setting role:`,
          cookies.map((c) => c.name),
        );
      } catch (error) {
        console.error(`🔍 [TEST] Failed to set role:`, error);
        throw error;
      }
    });

    // Cleanup: clear session after test
    if (currentRole !== null) {
      try {
        await page.request.post("/api/test/set-session", {
          data: { role: null },
        });
        console.log("🔍 [TEST] Cleared session after test");
      } catch (error) {
        console.warn("🔍 [TEST] Failed to clear session after test:", error);
      }
    }
  },

  /**
   * Helper function to clear test session
   */
  clearTestSession: async ({ page }, use) => {
    await use(async () => {
      console.log("🔍 [TEST] Clearing test session via fixture");
      try {
        await page.request.post("/api/test/set-session", {
          data: { role: null },
        });
      } catch (error) {
        console.error("🔍 [TEST] Failed to clear session:", error);
      }
    });
  },
});

export { expect } from "@playwright/test";
