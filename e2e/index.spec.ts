import { expect, test } from "@playwright/test";

test("index page - displays available views and alerts link", async ({
  page,
}) => {
  // 1. Navigate to the root of the application
  await page.goto("/");

  // 2. Wait for the page heading "Available Views" to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Ensure at least one Alerts link is visible (guaranteed by other tests/config)
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
