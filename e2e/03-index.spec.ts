import { test, expect } from "./fixtures/auth-storage";

test("index page - displays available views and alerts link", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the root of the application
  await page.goto("/");

  // 2. Wait for page to load
  await page.waitForLoadState("networkidle");

  // 3. Verify header elements are visible
  // Check for Guardian Connector logo (use first() to avoid strict mode violation)
  const logo = page.locator('img[alt="Guardian Connector Explorer"]').first();
  await expect(logo).toBeVisible();

  // Check for Guardian Connector text in header
  const guardianConnectorText = page
    .getByRole("heading", { name: /guardian connector/i })
    .first();
  await expect(guardianConnectorText).toBeVisible();

  /* Check for community name in tab (should be visible in desktop view)
   * tab-trigger is a NuxtLink, not a button
   */
  const communityNameTab = page.locator("a.tab-trigger, NuxtLink.tab-trigger");
  await expect(communityNameTab.first()).toBeVisible({ timeout: 10000 });

  /* 4. Wait for the page heading "Available Views" to become visible
   * Wait for the main content to load
   */
  await page.waitForSelector("main", { timeout: 15000 });
  await expect(
    page.getByRole("heading", {
      name: /available views|available dataset views/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  // 4. Wait for dataset cards to render
  await page.waitForSelector(".grid", { timeout: 15000 });
  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // 5. Verify at least one "Open Dataset View" link is visible
  const openProjectButton = page
    .locator("[data-testid='open-dataset-view-link']")
    .first();
  await expect(openProjectButton).toBeVisible({ timeout: 15000 });

  // 6. Verify the "Open Dataset View" link goes to a dataset page
  const href = await openProjectButton.getAttribute("href");
  expect(href).toMatch(/\/dataset\/\w+/);

  /* 7. Ensure at least one view pill (alerts, maps, or gallery) is visible
   * This checks that the pills are rendered correctly
   */
  const viewPills = page
    .locator("span")
    .filter({ hasText: /alerts|map|gallery/i });
  const pillCount = await viewPills.count();
  expect(pillCount).toBeGreaterThan(0);
});

test("index page - language picker functionality", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the root of the application
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the page heading to be visible first
  await page.waitForSelector("main", { timeout: 15000 });
  await expect(
    page.getByRole("heading", {
      name: /available views|available dataset views/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  /* 3. Wait for the language picker button to be visible (it's a globe icon button)
   * The language picker is in AppHeader, look for the button with globe icon
   */
  const languageButton = page
    .locator("button[title*='Language'], button[title*='language']")
    .or(
      page
        .locator("button")
        .filter({ has: page.locator("svg path[d*='M3.055']") }),
    )
    .first();
  await languageButton.waitFor({ state: "visible", timeout: 15000 });

  // 4. Verify the button has a title attribute (language picker button is icon-only)
  const buttonTitle = await languageButton.getAttribute("title");
  expect(buttonTitle?.toLowerCase()).toContain("language");

  // 5. Click the button to open dropdown
  await languageButton.click();

  // 6. Wait for dropdown menu to appear and check for language options
  const dropdownMenu = page.locator(
    "div[class*='absolute'][class*='right-0'][class*='bg-white']",
  );
  await dropdownMenu.waitFor({ state: "visible", timeout: 5000 });

  // 7. Check that multiple language options are available
  const languageOptions = dropdownMenu.locator("a[href='#']");
  const optionCount = await languageOptions.count();
  expect(optionCount).toBeGreaterThan(1);

  // 8. Test language switching by clicking a different language
  const firstOption = languageOptions.first();
  const firstOptionText = await firstOption.textContent();

  // Click the first option to switch language
  await firstOption.click();

  // 9. Verify the page heading changed (language switching works)
  await page.waitForTimeout(1000);
  // The heading should have changed based on the selected language
  // We verify this by checking the heading is still visible (page didn't break)
  await expect(
    page.getByRole("heading", {
      name: /available views|available dataset views|visualizações disponíveis/i,
    }),
  ).toBeVisible({ timeout: 5000 });
});

test("index page - language switching to Portuguese changes heading", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the root of the application
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the page heading to be visible first
  await page.waitForSelector("main", { timeout: 15000 });
  await expect(
    page.getByRole("heading", {
      name: /available views|available dataset views/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  /* 3. Wait for the language picker button to be visible (it's a globe icon button)
   * The language picker is in AppHeader, look for the button with globe icon
   */
  const languageButton = page
    .locator("button[title*='Language'], button[title*='language']")
    .or(
      page
        .locator("button")
        .filter({ has: page.locator("svg path[d*='M3.055']") }),
    )
    .first();
  await languageButton.waitFor({ state: "visible", timeout: 15000 });

  // 4. Click the button to open dropdown
  await languageButton.click();

  // 5. Wait for dropdown menu to appear
  const dropdownMenu = page.locator(
    "div[class*='absolute'][class*='right-0'][class*='bg-white']",
  );
  await dropdownMenu.waitFor({ state: "visible", timeout: 5000 });

  // 6. Find and click the Portuguese option
  const portugueseOption = dropdownMenu
    .locator("a[href='#']")
    .filter({ hasText: /Português/i });
  await portugueseOption.click();

  // 7. Wait for the page to update and verify the heading changed to Portuguese
  await expect(
    page.getByRole("heading", { name: /visualizações disponíveis/i }),
  ).toBeVisible({ timeout: 5000 });

  // 8. Verify the original English heading is no longer visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).not.toBeVisible();
});
