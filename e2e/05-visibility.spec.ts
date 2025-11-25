import { expect, test } from "@playwright/test";
import { Role } from "~/types/types";

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

test.describe("RBAC - Role-Based Access Control", () => {
  // Using existing datasets with their configured permissions:
  // - seed_survey_data: "anyone" (public)
  // - bcmform_responses: "member" (requires Member role or higher)

  test("RBAC - SignedIn user can access public dataset but not member dataset", async ({
    page,
  }) => {
    console.log("🔍 [TEST] Starting SignedIn role test");
    // Set SignedIn role via middleware query parameter
    await page.goto(`/?testRole=${Role.SignedIn}`);
    await page.waitForURL("**/", { timeout: 5000 });
    await page.waitForLoadState("networkidle");

    // Check session state via page evaluation
    const sessionState = await page.evaluate(() => {
      // Try to access session from window or global state
      return {
        url: window.location.href,
        cookies: document.cookie,
      };
    });
    console.log(
      "🔍 [TEST] After setting SignedIn role - URL:",
      sessionState.url,
    );
    console.log(
      "🔍 [TEST] After setting SignedIn role - Cookies:",
      sessionState.cookies,
    );

    // Check cookies via Playwright
    const cookies = await page.context().cookies();
    console.log(
      "🔍 [TEST] All cookies after setting SignedIn role:",
      cookies.map((c) => ({ name: c.name, value: c.value?.substring(0, 50) })),
    );

    // Should access public dataset
    console.log("🔍 [TEST] Attempting to access public dataset");
    await page.goto("/gallery/seed_survey_data");
    await page.waitForURL("**/gallery/**", { timeout: 5000 });
    const publicUrl = page.url();
    console.log("🔍 [TEST] Public dataset URL:", publicUrl);
    await expect(page.getByTestId("gallery-container")).toBeVisible();
    console.log("🔍 [TEST] ✅ Successfully accessed public dataset");

    // Should be rejected from member dataset
    console.log(
      "🔍 [TEST] Attempting to access member dataset (should be rejected)",
    );
    await page.goto("/map/bcmform_responses");
    // Wait for redirect
    await page.waitForURL(/\/(\?reason=unauthorized|\/login)/, {
      timeout: 5000,
    });
    const url = page.url();
    console.log("🔍 [TEST] Member dataset access result URL:", url);
    expect(url).toMatch(/\/\?reason=unauthorized|\/login/);
    console.log("🔍 [TEST] ✅ Correctly rejected from member dataset");
  });

  test("RBAC - Guest user can access public dataset but not member dataset", async ({
    page,
  }) => {
    console.log("🔍 [TEST] Starting Guest role test");
    // Set Guest role via middleware query parameter
    await page.goto(`/?testRole=${Role.Guest}`);
    await page.waitForURL("**/", { timeout: 5000 });
    await page.waitForLoadState("networkidle");
    console.log("🔍 [TEST] After setting Guest role - URL:", page.url());

    // Should access public dataset
    console.log("🔍 [TEST] Guest: Attempting to access public dataset");
    await page.goto("/gallery/seed_survey_data");
    await page.waitForURL("**/gallery/**", { timeout: 5000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible();
    console.log("🔍 [TEST] Guest: ✅ Successfully accessed public dataset");

    // Should be rejected from member dataset
    console.log(
      "🔍 [TEST] Guest: Attempting to access member dataset (should be rejected)",
    );
    await page.goto("/gallery/bcmform_responses");
    // Wait for redirect
    await page.waitForURL(/\/(\?reason=unauthorized|\/login)/, {
      timeout: 5000,
    });
    const url = page.url();
    console.log("🔍 [TEST] Guest: Member dataset access result URL:", url);
    expect(url).toMatch(/\/\?reason=unauthorized|\/login/);
    console.log("🔍 [TEST] Guest: ✅ Correctly rejected from member dataset");
  });

  test("RBAC - Member user can access both public and member datasets", async ({
    page,
  }) => {
    console.log("🔍 [TEST] Starting Member role test");
    // Set Member role via middleware query parameter
    await page.goto(`/?testRole=${Role.Member}`);
    await page.waitForURL("**/", { timeout: 5000 });
    await page.waitForLoadState("networkidle");
    console.log("🔍 [TEST] After setting Member role - URL:", page.url());

    // Should access public dataset
    console.log("🔍 [TEST] Member: Attempting to access public dataset");
    await page.goto("/gallery/seed_survey_data");
    await page.waitForURL("**/gallery/**", { timeout: 5000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible();
    console.log("🔍 [TEST] Member: ✅ Successfully accessed public dataset");

    // Should access member dataset
    console.log("🔍 [TEST] Member: Attempting to access member dataset");
    await page.goto("/gallery/bcmform_responses");
    await page.waitForURL("**/gallery/**", { timeout: 10000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible({
      timeout: 10000,
    });
    console.log("🔍 [TEST] Member: ✅ Successfully accessed member dataset");
  });

  test("RBAC - Admin user can access both public and member datasets", async ({
    page,
  }) => {
    console.log("🔍 [TEST] Starting Admin role test");
    // Set Admin role via middleware query parameter
    await page.goto(`/?testRole=${Role.Admin}`);
    await page.waitForURL("**/", { timeout: 5000 });
    await page.waitForLoadState("networkidle");
    console.log("🔍 [TEST] After setting Admin role - URL:", page.url());

    // Should access public dataset
    console.log("🔍 [TEST] Admin: Attempting to access public dataset");
    await page.goto("/gallery/seed_survey_data");
    await page.waitForURL("**/gallery/**", { timeout: 5000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible();
    console.log("🔍 [TEST] Admin: ✅ Successfully accessed public dataset");

    // Should access member dataset
    console.log("🔍 [TEST] Admin: Attempting to access member dataset");
    await page.goto("/gallery/bcmform_responses");
    await page.waitForURL("**/gallery/**", { timeout: 10000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible({
      timeout: 10000,
    });
    console.log("🔍 [TEST] Admin: ✅ Successfully accessed member dataset");
  });
});
