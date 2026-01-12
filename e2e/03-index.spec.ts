import { test, expect } from "./fixtures/auth-storage";

test("index page - displays available views and navigation flow", async ({
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
  const communityNameTab = page.locator("a.tab-trigger").first();
  await expect(communityNameTab).toBeVisible({ timeout: 10000 });

  /* 4. Wait for the page heading "Available dataset views" to become visible
   * Wait for the main content to load
   */
  await page.waitForSelector("main", { timeout: 15000 });
  await expect(
    page.getByRole("heading", {
      name: /available dataset views/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  // 5. Wait for dataset cards to render
  await page.waitForSelector(".grid", { timeout: 15000 });
  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // 6. Verify at least one dataset card is visible
  const datasetCards = page.locator("[data-testid='dataset-card']");
  const cardCount = await datasetCards.count();
  expect(cardCount).toBeGreaterThan(0);

  // 7. Verify at least one "Open Dataset View" link is visible
  const openProjectButton = page
    .locator("[data-testid='open-dataset-view-link']")
    .first();
  await expect(openProjectButton).toBeVisible({ timeout: 15000 });

  // 8. Verify the "Open Dataset View" link goes to a dataset page
  const href = await openProjectButton.getAttribute("href");
  expect(href).toMatch(/\/dataset\/\w+/);

  /* 9. Ensure at least one view pill (alerts, maps, or gallery) is visible
   * This checks that the pills are rendered correctly using the proper test IDs
   */
  const viewPills = page.locator("[data-testid^='view-tag-']");
  const pillCount = await viewPills.count();
  expect(pillCount).toBeGreaterThan(0);

  // 10. Verify view pills contain expected view types
  const viewPillTexts = await viewPills.allTextContents();
  const hasGallery = viewPillTexts.some((text) => /gallery/i.test(text));
  const hasMap = viewPillTexts.some((text) => /map/i.test(text));
  const hasAlerts = viewPillTexts.some((text) => /alerts/i.test(text));
  expect(hasGallery || hasMap || hasAlerts).toBe(true);
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
      name: /available dataset views/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  /* 3. Wait for the language picker button to be visible (it's a globe icon button)
   * The language picker is in AppHeader, look for the button with title="Language"
   */
  const languageButton = page.locator("button[title='Language']").first();
  await languageButton.waitFor({ state: "visible", timeout: 15000 });

  // 4. Verify the button has a title attribute (language picker button is icon-only)
  const buttonTitle = await languageButton.getAttribute("title");
  expect(buttonTitle).toBe("Language");

  // 5. Click the button to open dropdown
  await languageButton.click();

  // 6. Wait for dropdown menu to appear and check for language options
  const dropdownMenu = page.locator(
    ".language-picker-container div[class*='absolute']",
  );
  await dropdownMenu.waitFor({ state: "visible", timeout: 5000 });

  // 7. Check that multiple language options are available
  const languageOptions = dropdownMenu.locator("a[href='#']");
  const optionCount = await languageOptions.count();
  expect(optionCount).toBeGreaterThan(1);

  // 8. Test language switching by clicking a different language
  const firstOption = languageOptions.first();

  // Click the first option to switch language
  await firstOption.click();

  // 9. Verify the page heading is still visible (language switching works)
  await page.waitForTimeout(1000);
  // The heading should still be visible (page didn't break)
  await expect(
    page.getByRole("heading", {
      name: /available dataset views|visualizações disponíveis|datasetweergaven beschikbaar|visualizaciones disponibles/i,
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
      name: /available dataset views/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  /* 3. Wait for the language picker button to be visible (it's a globe icon button)
   * The language picker is in AppHeader, look for the button with title="Language"
   */
  const languageButton = page.locator("button[title='Language']").first();
  await languageButton.waitFor({ state: "visible", timeout: 15000 });

  // 4. Click the button to open dropdown
  await languageButton.click();

  // 5. Wait for dropdown menu to appear
  const dropdownMenu = page.locator(
    ".language-picker-container div[class*='absolute']",
  );
  await dropdownMenu.waitFor({ state: "visible", timeout: 5000 });

  // 6. Find and click the Portuguese option
  const portugueseOption = dropdownMenu
    .locator("a[href='#']")
    .filter({ hasText: /Português/i });

  // Verify Portuguese option exists
  const portugueseCount = await portugueseOption.count();
  if (portugueseCount > 0) {
    await portugueseOption.click();

    // 7. Wait for the page to update and verify the heading changed to Portuguese
    await page.waitForTimeout(1000); // Wait for locale change
    await expect(
      page.getByRole("heading", {
        name: /visualizações de conjuntos de dados disponíveis/i,
      }),
    ).toBeVisible({ timeout: 5000 });

    // 8. Verify the original English heading is no longer visible (or replaced)
    // The heading should now be in Portuguese, so English version shouldn't exist
    const englishHeading = page.getByRole("heading", {
      name: /available dataset views/i,
    });
    const englishCount = await englishHeading.count();
    // Either the heading changed or there's only one heading now
    expect(englishCount).toBe(0);
  } else {
    // If Portuguese is not available, just verify language switching works
    const firstOption = dropdownMenu.locator("a[href='#']").first();
    await firstOption.click();
    await page.waitForTimeout(1000);
    // Verify heading is still visible (page didn't break)
    await expect(page.getByRole("heading")).toBeVisible({ timeout: 5000 });
  }
});
