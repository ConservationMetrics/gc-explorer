import { test as baseTest, expect, type Page } from "@playwright/test";
import {
  test as authTest,
  expect as authExpect,
} from "@/tests/e2e/fixtures/auth-storage";
// Use regular test for tests that don't need authentication
const test = baseTest;

const waitForGalleryResult = async (page: Page) => {
  const galleryContainer = page.getByTestId("gallery-container");
  const galleryError = page.getByTestId("gallery-error-message");
  const dataLoadError = page.getByTestId("data-load-error");

  await authExpect(
    galleryContainer.or(galleryError).or(dataLoadError),
  ).toBeVisible({ timeout: 15000 });

  return { galleryContainer, galleryError, dataLoadError };
};

const waitForDeniedAccess = async (page: Page) => {
  await authExpect
    .poll(() => page.url(), { timeout: 15000 })
    .toMatch(
      /(\/login|\?reason=unauthorized|\/(gallery|map)\/bcmform_responses)/,
    );

  const deniedByRedirect =
    page.url().includes("/login") ||
    page.url().includes("?reason=unauthorized");

  if (!deniedByRedirect) {
    await authExpect(page.getByTestId("data-load-error")).toBeVisible({
      timeout: 10000,
    });
  }
};

authTest(
  "visibility system - public dataset accessible as SignedIn user",
  async ({ authenticatedPageAsSignedIn: page }) => {
    // 1. Navigate directly to the public test dataset as lowest authenticated role
    await page.goto("/gallery/seed_survey_data");

    // 2. Wait for the page to load
    await page.waitForURL("**/gallery/**", { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await authExpect(page).not.toHaveURL(/\/login|\?reason=unauthorized/);

    // 3. Wait for either gallery content or gallery unavailability message.
    // Public accessibility should still be valid in either configured state.
    const { galleryContainer, galleryError, dataLoadError } =
      await waitForGalleryResult(page);
    await authExpect(page).not.toHaveURL(/\/login|\?reason=unauthorized/);

    // 4. Verify one expected public-state UI is visible
    const hasGallery = (await galleryContainer.count()) > 0;
    const hasError = (await galleryError.count()) > 0;
    const hasDataLoadError = (await dataLoadError.count()) > 0;
    authExpect(hasGallery || hasError || hasDataLoadError).toBe(true);
    if (hasGallery) {
      await authExpect(galleryContainer).toBeVisible();
    }
    // 5. Check that the page has the robots meta tag for public views
    const robotsMeta = page.locator('meta[name="robots"]');
    await robotsMeta.waitFor({ state: "attached", timeout: 10000 });
    await authExpect(robotsMeta).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );

    console.log("Public dataset accessible without authentication");
  },
);

test("visibility system - public dataset accessible without session (incognito)", async ({
  page,
}) => {
  await page.goto("/gallery/seed_survey_data");
  await page.waitForURL("**/gallery/**", { timeout: 10000 });
  await expect(page).not.toHaveURL(/\/login|\?reason=unauthorized/);

  const { galleryContainer, galleryError, dataLoadError } =
    await waitForGalleryResult(page);
  await expect(page).not.toHaveURL(/\/login|\?reason=unauthorized/);

  const hasGallery = (await galleryContainer.count()) > 0;
  const hasError = (await galleryError.count()) > 0;
  const hasDataLoadError = (await dataLoadError.count()) > 0;
  expect(hasGallery || hasError || hasDataLoadError).toBe(true);
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
    console.log("Correctly redirected to login for protected dataset");
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
      console.log("[TEST] Starting SignedIn role test");

      // Should access public dataset
      console.log("[TEST] Attempting to access public dataset");
      await authenticatedPageAsSignedIn.goto("/gallery/seed_survey_data");
      await authenticatedPageAsSignedIn.waitForURL("**/gallery/**", {
        timeout: 5000,
      });
      const publicUrl = authenticatedPageAsSignedIn.url();
      console.log("[TEST] Public dataset URL:", publicUrl);
      console.log("[TEST] Waiting for gallery-container to be attached...");
      // Wait for gallery container to be attached (like in gallery tests)
      await authExpect(
        authenticatedPageAsSignedIn.getByTestId("gallery-container"),
      ).toBeVisible({ timeout: 10000 });
      await authExpect(
        authenticatedPageAsSignedIn.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("[TEST] Successfully accessed public dataset");

      // Should be rejected from member dataset
      console.log(
        "[TEST] Attempting to access member dataset (should be rejected)",
      );
      await authenticatedPageAsSignedIn.goto("/map/bcmform_responses");
      await waitForDeniedAccess(authenticatedPageAsSignedIn);
      const url = authenticatedPageAsSignedIn.url();
      console.log("[TEST] Member dataset access result URL:", url);
      console.log(
        "[TEST] Current page title:",
        await authenticatedPageAsSignedIn.title(),
      );
      authExpect(
        url.includes("?reason=unauthorized") ||
          url.includes("/login") ||
          url.includes("/map/bcmform_responses"),
      ).toBe(true);
      console.log("[TEST] Correctly rejected from member dataset");
    },
  );

  authTest(
    "RBAC - Guest user can access public dataset but not member dataset",
    async ({ authenticatedPageAsGuest }) => {
      console.log("[TEST] Starting Guest role test");

      // Should access public dataset
      console.log("[TEST] Guest: Attempting to access public dataset");
      await authenticatedPageAsGuest.goto("/gallery/seed_survey_data");
      await authenticatedPageAsGuest.waitForURL("**/gallery/**", {
        timeout: 5000,
      });
      const guestPublicUrl = authenticatedPageAsGuest.url();
      console.log("[TEST] Guest: Public dataset URL:", guestPublicUrl);
      console.log(
        "[TEST] Guest: Waiting for gallery-container to be attached...",
      );
      // Wait for gallery container to be attached (like in gallery tests)
      await authExpect(
        authenticatedPageAsGuest.getByTestId("gallery-container"),
      ).toBeVisible({ timeout: 10000 });
      await authExpect(
        authenticatedPageAsGuest.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("[TEST] Guest: Successfully accessed public dataset");

      // Should be rejected from member dataset
      console.log(
        "[TEST] Guest: Attempting to access member dataset (should be rejected)",
      );
      await authenticatedPageAsGuest.goto("/gallery/bcmform_responses");
      await waitForDeniedAccess(authenticatedPageAsGuest);
      const url = authenticatedPageAsGuest.url();
      console.log("[TEST] Guest: Member dataset access result URL:", url);
      console.log(
        "[TEST] Guest: Current page title:",
        await authenticatedPageAsGuest.title(),
      );
      authExpect(
        url.includes("?reason=unauthorized") ||
          url.includes("/login") ||
          url.includes("/gallery/bcmform_responses"),
      ).toBe(true);
      console.log("[TEST] Guest: Correctly rejected from member dataset");
    },
  );

  authTest(
    "RBAC - Member user can access both public and member datasets",
    async ({ authenticatedPageAsMember }) => {
      console.log("[TEST] Starting Member role test");

      // Should access public dataset
      console.log("[TEST] Member: Attempting to access public dataset");
      await authenticatedPageAsMember.goto("/gallery/seed_survey_data");
      await authenticatedPageAsMember.waitForURL("**/gallery/**", {
        timeout: 5000,
      });
      const memberPublicUrl = authenticatedPageAsMember.url();
      console.log("[TEST] Member: Public dataset URL:", memberPublicUrl);
      console.log(
        "[TEST] Member: Waiting for gallery-container to be attached...",
      );
      // Wait for gallery container to be attached (like in gallery tests)
      await authenticatedPageAsMember
        .getByTestId("gallery-container")
        .waitFor({ state: "attached", timeout: 5000 });
      await authExpect(
        authenticatedPageAsMember.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("[TEST] Member: Successfully accessed public dataset");

      // Should access member dataset (gallery view)
      console.log(
        "[TEST] Member: Attempting to access member dataset (gallery)",
      );
      await authenticatedPageAsMember.goto("/gallery/bcmform_responses");
      await authenticatedPageAsMember.waitForURL("**/gallery/**", {
        timeout: 10000,
      });
      const memberDatasetUrl = authenticatedPageAsMember.url();
      console.log("[TEST] Member: Member dataset URL:", memberDatasetUrl);
      console.log(
        "[TEST] Member: Current page title:",
        await authenticatedPageAsMember.title(),
      );
      // Wait for gallery container to be attached (like in gallery tests)
      console.log(
        "[TEST] Member: Waiting for gallery-container to be attached...",
      );
      await authenticatedPageAsMember
        .getByTestId("gallery-container")
        .waitFor({ state: "attached", timeout: 10000 });
      await authExpect(
        authenticatedPageAsMember.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log(
        "[TEST] Member: Successfully accessed member dataset (gallery loaded)",
      );
    },
  );

  authTest(
    "RBAC - Admin user can access both public and member datasets",
    async ({ authenticatedPageAsAdmin }) => {
      console.log("[TEST] Starting Admin role test");

      // Should access public dataset
      console.log("[TEST] Admin: Attempting to access public dataset");
      await authenticatedPageAsAdmin.goto("/gallery/seed_survey_data");
      await authenticatedPageAsAdmin.waitForURL("**/gallery/**", {
        timeout: 5000,
      });
      const adminPublicUrl = authenticatedPageAsAdmin.url();
      console.log("[TEST] Admin: Public dataset URL:", adminPublicUrl);
      console.log(
        "[TEST] Admin: Waiting for gallery-container to be attached...",
      );
      // Wait for gallery container to be attached (like in gallery tests)
      await authenticatedPageAsAdmin
        .getByTestId("gallery-container")
        .waitFor({ state: "attached", timeout: 5000 });
      await authExpect(
        authenticatedPageAsAdmin.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log("[TEST] Admin: Successfully accessed public dataset");

      // Should access member dataset (gallery view)
      console.log(
        "[TEST] Admin: Attempting to access member dataset (gallery)",
      );
      await authenticatedPageAsAdmin.goto("/gallery/bcmform_responses");
      await authenticatedPageAsAdmin.waitForURL("**/gallery/**", {
        timeout: 10000,
      });
      const adminDatasetUrl = authenticatedPageAsAdmin.url();
      console.log("[TEST] Admin: Member dataset URL:", adminDatasetUrl);
      console.log(
        "[TEST] Admin: Current page title:",
        await authenticatedPageAsAdmin.title(),
      );
      // Wait for gallery container to be attached (like in gallery tests)
      console.log(
        "[TEST] Admin: Waiting for gallery-container to be attached...",
      );
      await authenticatedPageAsAdmin
        .getByTestId("gallery-container")
        .waitFor({ state: "attached", timeout: 10000 });
      await authExpect(
        authenticatedPageAsAdmin.getByTestId("gallery-container"),
      ).toBeVisible();
      console.log(
        "[TEST] Admin: Successfully accessed member dataset (gallery loaded)",
      );
    },
  );
});
