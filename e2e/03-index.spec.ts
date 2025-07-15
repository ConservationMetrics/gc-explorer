import { expect, test } from "@playwright/test";

test("index page - displays available views and alerts link", async ({
  page,
}) => {
  // 1. Navigate to the root of the application
  await page.goto("/");
  // Debug: Log page content to understand what's rendered
  console.log("🔍 Page title:", await page.title());
  console.log("🔍 Page URL:", page.url());

  // Debug: Check if there are any links on the page
  const allLinks = page.locator("a");
  const linkCount = await allLinks.count();
  console.log("🔍 Total links on page:", linkCount);

  // Debug: Log all link texts
  for (let i = 0; i < linkCount; i++) {
    const link = allLinks.nth(i);
    const text = await link.textContent();
    const href = await link.getAttribute("href");
    console.log(`🔍 Link ${i}: text="${text?.trim()}", href="${href}"`);
  }

  // Debug: Check if there are any elements with "alerts" text
  const alertsElements = page.locator("*:has-text('alerts')");
  const alertsCount = await alertsElements.count();
  console.log("🔍 Elements containing 'alerts' text:", alertsCount);

  // Debug: Log page HTML for debugging
  const pageContent = await page.content();
  console.log(
    "🔍 Page HTML (first 1000 chars):",
    pageContent.substring(0, 1000),
  );

  // 2. Wait for the page heading "Available Views" to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Ensure at least one Alerts link is visible (guaranteed through a database connection that has an alerts view)
  const alertsLink = page.getByRole("link", { name: /alerts/i }).first();
  await alertsLink.waitFor({ state: "visible", timeout: 10000 });

  // 4. (Optional) Verify the link's href leads to an alerts route pattern
  const href = await alertsLink.getAttribute("href");
  expect(href).toMatch(/^\/alerts\//);

  // 5. Verify the logo image is displayed
  const logoImage = page.locator("img[alt='Guardian Connector Explorer Logo']");
  await expect(logoImage).toBeVisible();
  expect(await logoImage.getAttribute("src")).toBe("/gcexplorer.png");
});

test("index page - language picker functionality", async ({ page }) => {
  // 1. Navigate to the root of the application
  await page.goto("/");

  // 2. Wait for the language picker button to be visible
  const languageButton = page
    .locator("button")
    .filter({ hasText: /English|Español|Nederlands|Português/i });
  await languageButton.waitFor({ state: "visible", timeout: 10000 });

  // 3. Verify the button shows current language
  const buttonText = await languageButton.textContent();
  expect(["English", "Español", "Nederlands", "Português"]).toContain(
    buttonText?.trim(),
  );

  // 4. Click the button to open dropdown
  await languageButton.click();

  // 5. Wait for dropdown menu to appear and check for language options
  const dropdownMenu = page.locator(
    "div[class*='absolute'][class*='right-0'][class*='bg-white']",
  );
  await dropdownMenu.waitFor({ state: "visible", timeout: 5000 });

  // 6. Check that multiple language options are available
  const languageOptions = dropdownMenu.locator("a[href='#']");
  const optionCount = await languageOptions.count();
  expect(optionCount).toBeGreaterThan(1);

  // 7. Test language switching by clicking a different language
  const firstOption = languageOptions.first();
  const firstOptionText = await firstOption.textContent();

  // Only switch if it's different from current language (trim whitespace)
  if (firstOptionText?.trim() !== buttonText?.trim()) {
    await firstOption.click();

    // 8. Verify the button text changed
    await page.waitForTimeout(1000);
    const newButtonText = await languageButton.textContent();
    expect(newButtonText?.trim()).toBe(firstOptionText?.trim());
  }
});

test("index page - language switching to Portuguese changes heading", async ({
  page,
}) => {
  // 1. Navigate to the root of the application
  await page.goto("/");

  // 2. Wait for the language picker button to be visible
  const languageButton = page
    .locator("button")
    .filter({ hasText: /English|Español|Nederlands|Português/i });
  await languageButton.waitFor({ state: "visible", timeout: 10000 });

  // 3. Click the button to open dropdown
  await languageButton.click();

  // 4. Wait for dropdown menu to appear
  const dropdownMenu = page.locator(
    "div[class*='absolute'][class*='right-0'][class*='bg-white']",
  );
  await dropdownMenu.waitFor({ state: "visible", timeout: 5000 });

  // 5. Find and click the Portuguese option
  const portugueseOption = dropdownMenu
    .locator("a[href='#']")
    .filter({ hasText: /Português/i });
  await portugueseOption.click();

  // 6. Wait for the page to update and verify the heading changed to Portuguese
  await expect(
    page.getByRole("heading", { name: /visualizações disponíveis/i }),
  ).toBeVisible();

  // 7. Verify the original English heading is no longer visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).not.toBeVisible();
});
