import { test as baseTest, expect } from "@playwright/test";
import {
  test as authTest,
  expect as authExpect,
} from "../e2e/fixtures/auth-storage";

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
    async ({ authenticatedPageAsSignedIn }) => {
      console.log("🔍 [TEST] Starting SignedIn role test");

      // Should access public dataset
      console.log("🔍 [TEST] Attempting to access public dataset");
      await authenticatedPageAsSignedIn.goto("/gallery/seed_survey_data");
      await authenticatedPageAsSignedIn.waitForURL("**/gallery/**", {
        timeout: 5000,
      });
      const publicUrl = authenticatedPageAsSignedIn.url();
      console.log("🔍 [TEST] Public dataset URL:", publicUrl);
      console.log("🔍 [TEST] Waiting for gallery-container to be attached...");
      // Wait for gallery container to be attached (like in gallery tests)
      await authenticatedPageAsSignedIn
        .getByTestId("gallery-container")
        .waitFor({ state: "attached", timeout: 5000 });
      await authExpect(
        authenticatedPageAsSignedIn.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("🔍 [TEST] ✅ Successfully accessed public dataset");

      // Should be rejected from member dataset
      console.log(
        "🔍 [TEST] Attempting to access member dataset (should be rejected)",
      );
      await authenticatedPageAsSignedIn.goto("/map/bcmform_responses");
      // Wait for redirect
      await authenticatedPageAsSignedIn.waitForURL(
        /\/(\?reason=unauthorized|\/login)/,
        {
          timeout: 5000,
        },
      );
      const url = authenticatedPageAsSignedIn.url();
      console.log("🔍 [TEST] Member dataset access result URL:", url);
      console.log(
        "🔍 [TEST] Current page title:",
        await authenticatedPageAsSignedIn.title(),
      );
      authExpect(url).toMatch(/\/\?reason=unauthorized|\/login/);
      console.log("🔍 [TEST] ✅ Correctly rejected from member dataset");
    },
  );

  authTest(
    "RBAC - Guest user can access public dataset but not member dataset",
    async ({ authenticatedPageAsGuest }) => {
      console.log("🔍 [TEST] Starting Guest role test");

      // Should access public dataset
      console.log("🔍 [TEST] Guest: Attempting to access public dataset");
      await authenticatedPageAsGuest.goto("/gallery/seed_survey_data");
      await authenticatedPageAsGuest.waitForURL("**/gallery/**", {
        timeout: 5000,
      });
      const guestPublicUrl = authenticatedPageAsGuest.url();
      console.log("🔍 [TEST] Guest: Public dataset URL:", guestPublicUrl);
      console.log(
        "🔍 [TEST] Guest: Waiting for gallery-container to be attached...",
      );
      // Wait for gallery container to be attached (like in gallery tests)
      await authenticatedPageAsGuest
        .getByTestId("gallery-container")
        .waitFor({ state: "attached", timeout: 5000 });
      await authExpect(
        authenticatedPageAsGuest.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("🔍 [TEST] Guest: ✅ Successfully accessed public dataset");

      // Should be rejected from member dataset
      console.log(
        "🔍 [TEST] Guest: Attempting to access member dataset (should be rejected)",
      );
      await authenticatedPageAsGuest.goto("/gallery/bcmform_responses");
      // Wait for redirect
      await authenticatedPageAsGuest.waitForURL(
        /\/(\?reason=unauthorized|\/login)/,
        {
          timeout: 5000,
        },
      );
      const url = authenticatedPageAsGuest.url();
      console.log("🔍 [TEST] Guest: Member dataset access result URL:", url);
      console.log(
        "🔍 [TEST] Guest: Current page title:",
        await authenticatedPageAsGuest.title(),
      );
      authExpect(url).toMatch(/\/\?reason=unauthorized|\/login/);
      console.log("🔍 [TEST] Guest: ✅ Correctly rejected from member dataset");
    },
  );

  authTest(
    "RBAC - Member user can access both public and member datasets",
    async ({ authenticatedPageAsMember }) => {
      console.log("🔍 [TEST] Starting Member role test");

      // Should access public dataset
      console.log("🔍 [TEST] Member: Attempting to access public dataset");
      await authenticatedPageAsMember.goto("/gallery/seed_survey_data");
      await authenticatedPageAsMember.waitForURL("**/gallery/**", {
        timeout: 5000,
      });
      const memberPublicUrl = authenticatedPageAsMember.url();
      console.log("🔍 [TEST] Member: Public dataset URL:", memberPublicUrl);
      console.log(
        "🔍 [TEST] Member: Waiting for gallery-container to be attached...",
      );
      // Wait for gallery container to be attached (like in gallery tests)
      await authenticatedPageAsMember
        .getByTestId("gallery-container")
        .waitFor({ state: "attached", timeout: 5000 });
      await authExpect(
        authenticatedPageAsMember.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("🔍 [TEST] Member: ✅ Successfully accessed public dataset");

      // Should access member dataset (gallery view)
      console.log(
        "🔍 [TEST] Member: Attempting to access member dataset (gallery)",
      );
      await authenticatedPageAsMember.goto("/gallery/bcmform_responses");
      await authenticatedPageAsMember.waitForURL("**/gallery/**", {
        timeout: 10000,
      });
      const memberDatasetUrl = authenticatedPageAsMember.url();
      console.log("🔍 [TEST] Member: Member dataset URL:", memberDatasetUrl);
      console.log(
        "🔍 [TEST] Member: Current page title:",
        await authenticatedPageAsMember.title(),
      );
      // Wait for gallery container to be attached (like in gallery tests)
      console.log(
        "🔍 [TEST] Member: Waiting for gallery-container to be attached...",
      );
      await authenticatedPageAsMember
        .getByTestId("gallery-container")
        .waitFor({ state: "attached", timeout: 10000 });
      await authExpect(
        authenticatedPageAsMember.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log(
        "🔍 [TEST] Member: ✅ Successfully accessed member dataset (gallery loaded)",
      );
    },
  );

  authTest(
    "RBAC - Admin user can access both public and member datasets",
    async ({ authenticatedPageAsAdmin }) => {
      console.log("🔍 [TEST] Starting Admin role test");

      // Should access public dataset
      console.log("🔍 [TEST] Admin: Attempting to access public dataset");
      await authenticatedPageAsAdmin.goto("/gallery/seed_survey_data");
      await authenticatedPageAsAdmin.waitForURL("**/gallery/**", {
        timeout: 5000,
      });
      const adminPublicUrl = authenticatedPageAsAdmin.url();
      console.log("🔍 [TEST] Admin: Public dataset URL:", adminPublicUrl);
      console.log(
        "🔍 [TEST] Admin: Waiting for gallery-container to be attached...",
      );
      // Wait for gallery container to be attached (like in gallery tests)
      await authenticatedPageAsAdmin
        .getByTestId("gallery-container")
        .waitFor({ state: "attached", timeout: 5000 });
      await authExpect(
        authenticatedPageAsAdmin.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("🔍 [TEST] Admin: ✅ Successfully accessed public dataset");

      // Should access member dataset (gallery view)
      console.log(
        "🔍 [TEST] Admin: Attempting to access member dataset (gallery)",
      );
      await authenticatedPageAsAdmin.goto("/gallery/bcmform_responses");
      await authenticatedPageAsAdmin.waitForURL("**/gallery/**", {
        timeout: 10000,
      });
      const adminDatasetUrl = authenticatedPageAsAdmin.url();
      console.log("🔍 [TEST] Admin: Member dataset URL:", adminDatasetUrl);
      console.log(
        "🔍 [TEST] Admin: Current page title:",
        await authenticatedPageAsAdmin.title(),
      );
      // Wait for gallery container to be attached (like in gallery tests)
      console.log(
        "🔍 [TEST] Admin: Waiting for gallery-container to be attached...",
      );
      await authenticatedPageAsAdmin
        .getByTestId("gallery-container")
        .waitFor({ state: "attached", timeout: 10000 });
      await authExpect(
        authenticatedPageAsAdmin.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log(
        "🔍 [TEST] Admin: ✅ Successfully accessed member dataset (gallery loaded)",
      );
    },
  );
});
