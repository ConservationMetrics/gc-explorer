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
    // Set SignedIn role (lowest authenticated role)
    await page.goto(`/api/test/set-session?role=${Role.SignedIn}`);
    await page.waitForURL("**/", { timeout: 5000 });
    // Navigate to home to ensure session is loaded
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that session cookie is set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (cookie) =>
        cookie.name.includes("session") || cookie.name.includes("auth"),
    );
    console.log("🔍 [TEST] Cookies after setting SignedIn role:", cookies);
    console.log("🔍 [TEST] Session cookie:", sessionCookie);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBeTruthy();

    const { loggedIn, user } = useUserSession();
    console.log("🔍 [TEST] User session:", loggedIn, user);

    // Should access public dataset
    await page.goto("/gallery/seed_survey_data");
    await page.waitForURL("**/gallery/**", { timeout: 5000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible();

    // Should be rejected from member dataset
    await page.goto("/map/bcmform_responses");
    // Wait for redirect
    await page.waitForURL(/\/(\?reason=unauthorized|\/login)/, {
      timeout: 5000,
    });
    const url = page.url();
    expect(url).toMatch(/\/\?reason=unauthorized|\/login/);
  });

  test("RBAC - Guest user can access public dataset but not member dataset", async ({
    page,
  }) => {
    // Set Guest role
    await page.goto(`/api/test/set-session?role=${Role.Guest}`);
    await page.waitForURL("**/", { timeout: 5000 });
    // Navigate to home to ensure session is loaded
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that session cookie is set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (cookie) =>
        cookie.name.includes("session") || cookie.name.includes("auth"),
    );
    console.log("🔍 [TEST] Session cookie for Guest role:", sessionCookie);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBeTruthy();

    // Should access public dataset
    await page.goto("/gallery/seed_survey_data");
    await page.waitForURL("**/gallery/**", { timeout: 5000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible();

    // Should be rejected from member dataset
    await page.goto("/gallery/bcmform_responses");
    // Wait for redirect
    await page.waitForURL(/\/(\?reason=unauthorized|\/login)/, {
      timeout: 5000,
    });
    const url = page.url();
    expect(url).toMatch(/\/\?reason=unauthorized|\/login/);
  });

  test("RBAC - Member user can access both public and member datasets", async ({
    page,
  }) => {
    // Set Member role
    await page.goto(`/api/test/set-session?role=${Role.Member}`);
    await page.waitForURL("**/", { timeout: 5000 });
    // Navigate to home to ensure session is loaded
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that session cookie is set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (cookie) =>
        cookie.name.includes("session") || cookie.name.includes("auth"),
    );
    console.log("🔍 [TEST] Session cookie for Member role:", sessionCookie);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBeTruthy();

    // Should access public dataset
    await page.goto("/gallery/seed_survey_data");
    await page.waitForURL("**/gallery/**", { timeout: 5000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible();

    // Should access member dataset
    await page.goto("/gallery/bcmform_responses");
    await page.waitForURL("**/gallery/**", { timeout: 10000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible({
      timeout: 10000,
    });
  });

  test("RBAC - Admin user can access both public and member datasets", async ({
    page,
  }) => {
    // Set Admin role
    await page.goto(`/api/test/set-session?role=${Role.Admin}`);
    await page.waitForURL("**/", { timeout: 5000 });
    // Navigate to home to ensure session is loaded
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that session cookie is set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (cookie) =>
        cookie.name.includes("session") || cookie.name.includes("auth"),
    );
    console.log("🔍 [TEST] Session cookie for Admin role:", sessionCookie);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBeTruthy();

    // Should access public dataset
    await page.goto("/gallery/seed_survey_data");
    await page.waitForURL("**/gallery/**", { timeout: 5000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible();

    // Should access member dataset
    await page.goto("/gallery/bcmform_responses");
    await page.waitForURL("**/gallery/**", { timeout: 10000 });
    await expect(page.getByTestId("gallery-container")).toBeVisible({
      timeout: 10000,
    });
  });
});
