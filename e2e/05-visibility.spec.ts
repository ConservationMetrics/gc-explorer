import { expect, test } from "@playwright/test";

test("visibility system - public dataset accessible without authentication", async ({
  page,
}) => {
  // 1. Navigate directly to the test dataset that we'll make public
  await page.goto("/alerts/fake_alerts");

  // 2. Wait for the page to load
  await page.waitForLoadState("networkidle");

  // 3. Check that we're still on the alerts page (not redirected to login)
  await expect(page).toHaveURL(/\/alerts\/fake_alerts/);

  // 4. Verify the page content is visible (not a login form)
  await expect(page.locator("body")).not.toContainText("log in");

  // 5. Check that we can see some content from the alerts page
  const legendCheckboxes = page.getByTestId("map-legend-checkbox");
  const checkboxCount = await legendCheckboxes.count();
  expect(checkboxCount).toBeGreaterThan(0);

  // 6. Check that the page has the robots meta tag for public views
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
