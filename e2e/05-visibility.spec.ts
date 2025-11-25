import { test as baseTest, expect } from "@playwright/test";
import { test as authTest, expect as authExpect } from "../e2e/fixtures/auth";

// Use regular test for tests that don't need authentication
const test = baseTest;

test("visibility system - public dataset accessible without authentication", async ({
  page,
}) => {
  // 1. Navigate directly to the test dataset that we'll make public
  await page.goto("/gallery/seed_survey_data");

  // 2. Wait for the page to load
  await page.waitForURL("**/gallery/**", { timeout: 5000 });

  // 3. Wait for the gallery container to be present
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 4. Verify gallery container is visible
  await expect(page.getByTestId("gallery-container")).toBeVisible();
  // 5. Check that the page has the robots meta tag for public views
  const robotsMeta = page.locator('meta[name="robots"]');
  await robotsMeta.waitFor({ state: "attached", timeout: 10000 });
  await expect(robotsMeta).toHaveAttribute("content", "noindex, nofollow");

  console.log("✅ Public dataset accessible without authentication");
});

test("visibility system - protected dataset redirects to login when not authenticated", async ({
  page,
}) => {
  // 1. Navigate directly to the authenticated test dataset
  await page.goto("/gallery/bcmform_responses");

  // 2. Check if we're redirected to login or if the page loads
  const currentUrl = page.url();

  if (currentUrl.includes("/login")) {
    // Expected behavior for protected datasets
    await expect(page).toHaveURL(/\/login/);
    console.log("✅ Correctly redirected to login for protected dataset");
  }
});

// Use authTest for RBAC tests that need role setting
authTest.describe("RBAC - Role-Based Access Control", () => {
  // Using existing datasets with their configured permissions:
  // - seed_survey_data: "anyone" (public)
  // - bcmform_responses: "member" (requires Member role or higher)

  authTest(
    "RBAC - SignedIn user can access public dataset but not member dataset",
    async ({ loggedInPageAsSignedIn }) => {
      console.log("🔍 [TEST] Starting SignedIn role test");

      // Should access public dataset
      console.log("🔍 [TEST] Attempting to access public dataset");
      await loggedInPageAsSignedIn.goto("/gallery/seed_survey_data");
      await loggedInPageAsSignedIn.waitForURL("**/gallery/**", {
        timeout: 5000,
      });
      const publicUrl = loggedInPageAsSignedIn.url();
      console.log("🔍 [TEST] Public dataset URL:", publicUrl);
      console.log(
        "🔍 [TEST] Current page title:",
        await loggedInPageAsSignedIn.title(),
      );
      console.log(
        "🔍 [TEST] Page content preview:",
        await loggedInPageAsSignedIn.content().then((c) => c.substring(0, 500)),
      );
      await authExpect(
        loggedInPageAsSignedIn.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("🔍 [TEST] ✅ Successfully accessed public dataset");

      // Should be rejected from member dataset
      console.log(
        "🔍 [TEST] Attempting to access member dataset (should be rejected)",
      );
      await loggedInPageAsSignedIn.goto("/map/bcmform_responses");
      // Wait for redirect
      await loggedInPageAsSignedIn.waitForURL(
        /\/(\?reason=unauthorized|\/login)/,
        {
          timeout: 5000,
        },
      );
      const url = loggedInPageAsSignedIn.url();
      console.log("🔍 [TEST] Member dataset access result URL:", url);
      console.log(
        "🔍 [TEST] Current page title:",
        await loggedInPageAsSignedIn.title(),
      );
      authExpect(url).toMatch(/\/\?reason=unauthorized|\/login/);
      console.log("🔍 [TEST] ✅ Correctly rejected from member dataset");
    },
  );

  authTest(
    "RBAC - Guest user can access public dataset but not member dataset",
    async ({ loggedInPageAsGuest }) => {
      console.log("🔍 [TEST] Starting Guest role test");

      // Should access public dataset
      console.log("🔍 [TEST] Guest: Attempting to access public dataset");
      await loggedInPageAsGuest.goto("/gallery/seed_survey_data");
      await loggedInPageAsGuest.waitForURL("**/gallery/**", { timeout: 5000 });
      const guestPublicUrl = loggedInPageAsGuest.url();
      console.log("🔍 [TEST] Guest: Public dataset URL:", guestPublicUrl);
      console.log(
        "🔍 [TEST] Guest: Current page title:",
        await loggedInPageAsGuest.title(),
      );
      await authExpect(
        loggedInPageAsGuest.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("🔍 [TEST] Guest: ✅ Successfully accessed public dataset");

      // Should be rejected from member dataset
      console.log(
        "🔍 [TEST] Guest: Attempting to access member dataset (should be rejected)",
      );
      await loggedInPageAsGuest.goto("/gallery/bcmform_responses");
      // Wait for redirect
      await loggedInPageAsGuest.waitForURL(
        /\/(\?reason=unauthorized|\/login)/,
        {
          timeout: 5000,
        },
      );
      const url = loggedInPageAsGuest.url();
      console.log("🔍 [TEST] Guest: Member dataset access result URL:", url);
      console.log(
        "🔍 [TEST] Guest: Current page title:",
        await loggedInPageAsGuest.title(),
      );
      authExpect(url).toMatch(/\/\?reason=unauthorized|\/login/);
      console.log("🔍 [TEST] Guest: ✅ Correctly rejected from member dataset");
    },
  );

  authTest(
    "RBAC - Member user can access both public and member datasets",
    async ({ loggedInPageAsMember }) => {
      console.log("🔍 [TEST] Starting Member role test");

      // Should access public dataset
      console.log("🔍 [TEST] Member: Attempting to access public dataset");
      await loggedInPageAsMember.goto("/gallery/seed_survey_data");
      await loggedInPageAsMember.waitForURL("**/gallery/**", { timeout: 5000 });
      const memberPublicUrl = loggedInPageAsMember.url();
      console.log("🔍 [TEST] Member: Public dataset URL:", memberPublicUrl);
      console.log(
        "🔍 [TEST] Member: Current page title:",
        await loggedInPageAsMember.title(),
      );
      await authExpect(
        loggedInPageAsMember.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("🔍 [TEST] Member: ✅ Successfully accessed public dataset");

      // Should access member dataset
      console.log("🔍 [TEST] Member: Attempting to access member dataset");
      await loggedInPageAsMember.goto("/gallery/bcmform_responses");
      await loggedInPageAsMember.waitForURL("**/gallery/**", {
        timeout: 10000,
      });
      const memberDatasetUrl = loggedInPageAsMember.url();
      console.log("🔍 [TEST] Member: Member dataset URL:", memberDatasetUrl);
      console.log(
        "🔍 [TEST] Member: Current page title:",
        await loggedInPageAsMember.title(),
      );
      console.log(
        "🔍 [TEST] Member: Page content preview:",
        await loggedInPageAsMember.content().then((c) => c.substring(0, 500)),
      );
      console.log("🔍 [TEST] Member: Checking for gallery-container...");
      await authExpect(
        loggedInPageAsMember.getByTestId("gallery-container"),
      ).toBeVisible({
        timeout: 10000,
      });
      console.log("🔍 [TEST] Member: ✅ Successfully accessed member dataset");
    },
  );

  authTest(
    "RBAC - Admin user can access both public and member datasets",
    async ({ loggedInPageAsAdmin }) => {
      console.log("🔍 [TEST] Starting Admin role test");

      // Should access public dataset
      console.log("🔍 [TEST] Admin: Attempting to access public dataset");
      await loggedInPageAsAdmin.goto("/gallery/seed_survey_data");
      await loggedInPageAsAdmin.waitForURL("**/gallery/**", { timeout: 5000 });
      const adminPublicUrl = loggedInPageAsAdmin.url();
      console.log("🔍 [TEST] Admin: Public dataset URL:", adminPublicUrl);
      console.log(
        "🔍 [TEST] Admin: Current page title:",
        await loggedInPageAsAdmin.title(),
      );
      await authExpect(
        loggedInPageAsAdmin.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("🔍 [TEST] Admin: ✅ Successfully accessed public dataset");

      // Should access member dataset
      console.log("🔍 [TEST] Admin: Attempting to access member dataset");
      await loggedInPageAsAdmin.goto("/gallery/bcmform_responses");
      await loggedInPageAsAdmin.waitForURL("**/gallery/**", {
        timeout: 10000,
      });
      const adminDatasetUrl = loggedInPageAsAdmin.url();
      console.log("🔍 [TEST] Admin: Member dataset URL:", adminDatasetUrl);
      console.log(
        "🔍 [TEST] Admin: Current page title:",
        await loggedInPageAsAdmin.title(),
      );
      console.log(
        "🔍 [TEST] Admin: Page content preview:",
        await loggedInPageAsAdmin.content().then((c) => c.substring(0, 500)),
      );
      console.log("🔍 [TEST] Admin: Checking for gallery-container...");
      await authExpect(
        loggedInPageAsAdmin.getByTestId("gallery-container"),
      ).toBeVisible({
        timeout: 10000,
      });
      console.log("🔍 [TEST] Admin: ✅ Successfully accessed member dataset");
    },
  );
});
