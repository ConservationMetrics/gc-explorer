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

  // Check for community name in tab (should be visible in desktop view)
  const communityNameTab = page.locator("button.tab-trigger");
  await expect(communityNameTab).toBeVisible({ timeout: 5000 });

  // 4. Wait for the page heading "Available Views" to become visible
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible({ timeout: 10000 });

  // 4. Verify at least one "Open Project" button is visible
  const openProjectButton = page
    .locator("a")
    .filter({ hasText: /open project/i })
    .first();
  await expect(openProjectButton).toBeVisible();

  // 5. Verify the "Open Project" button links to a dataset page
  const href = await openProjectButton.getAttribute("href");
  expect(href).toMatch(/\/dataset\/\w+/);

  // 6. Ensure at least one view pill (alerts, maps, or gallery) is visible
  // This checks that the pills are rendered correctly
  const viewPills = page
    .locator("span")
    .filter({ hasText: /alerts|maps|gallery/i });
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
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible({ timeout: 10000 });

  // 3. Wait for the language picker button to be visible
  const languageButton = page
    .locator("button")
    .filter({ hasText: /English|Español|Nederlands|Português/i });
  await languageButton.waitFor({ state: "visible", timeout: 10000 });

  // 4. Verify the button shows current language
  const buttonText = await languageButton.textContent();
  expect(["English", "Español", "Nederlands", "Português"]).toContain(
    buttonText?.trim(),
  );

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

  // Only switch if it's different from current language (trim whitespace)
  if (firstOptionText?.trim() !== buttonText?.trim()) {
    await firstOption.click();

    // 9. Verify the button text changed
    await page.waitForTimeout(1000);
    const newButtonText = await languageButton.textContent();
    expect(newButtonText?.trim()).toBe(firstOptionText?.trim());
  }
});

test("index page - language switching to Portuguese changes heading", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the root of the application
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the page heading to be visible first
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible({ timeout: 10000 });

  // 3. Wait for the language picker button to be visible
  const languageButton = page
    .locator("button")
    .filter({ hasText: /English|Español|Nederlands|Português/i });
  await languageButton.waitFor({ state: "visible", timeout: 10000 });

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
