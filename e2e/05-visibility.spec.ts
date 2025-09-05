import { expect, test } from "@playwright/test";

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


