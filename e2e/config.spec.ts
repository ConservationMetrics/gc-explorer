import { expect, test } from "@playwright/test";

test("config page - displays configuration dashboard with table cards", async ({
  page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views: configuration/i }),
  ).toBeVisible();

  // 3. Verify the language picker is present
  const languageButton = page
    .locator("button")
    .filter({ hasText: /English|Español|Nederlands|Português/i });
  await expect(languageButton).toBeVisible();

  // 4. Verify the add new table button is present
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await expect(addTableButton).toBeVisible();

  // 5. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });
});

test("config page - add new table functionality", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Click the add new table button
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  // 3. Verify the modal appears with dropdown
  const modal = page.locator(".modal");
  await expect(modal).toBeVisible();

  // 4. Verify the modal message
  await expect(page.getByText(/select table to add:/i)).toBeVisible();

  // 5. Verify the dropdown is present
  const dropdown = page.locator("select");
  await expect(dropdown).toBeVisible();

  // 6. Verify the confirm button is initially disabled
  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await expect(confirmButton).toBeDisabled();

  // 7. Select an option from the dropdown
  await dropdown.selectOption({ index: 0 });

  // 8. Verify the confirm button is now enabled
  await expect(confirmButton).toBeEnabled();

  // 9. Click confirm
  await confirmButton.click();

  // 10. Verify success message appears
  await expect(page.getByText(/table added to views!/i)).toBeVisible();

  // 11. Verify modal closes after timeout
  await page.waitForTimeout(3500);
  await expect(modal).not.toBeVisible();
});

test("config page - cancel add table modal", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Click the add new table button
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  // 3. Verify the modal appears
  const modal = page.locator(".modal");
  await expect(modal).toBeVisible();

  // 4. Click the cancel button
  const cancelButton = page.getByRole("button", { name: /cancel/i });
  await cancelButton.click();

  // 5. Verify the modal closes
  await expect(modal).not.toBeVisible();
});

test("config page - table card minimize/expand functionality", async ({
  page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for table cards
  const tableCards = page.locator(".table-item.card");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Click the hamburger button on the first card
    const firstCard = tableCards.first();
    const hamburgerButton = firstCard.locator("button.hamburger");
    await hamburgerButton.click();

    // 5. Verify the card body is now visible (expanded)
    const cardBody = firstCard.locator(".card-body");
    await expect(cardBody).toBeVisible();

    // 6. Click the hamburger button again to minimize
    await hamburgerButton.click();

    // 7. Verify the card body is hidden (minimized)
    await expect(cardBody).not.toBeVisible();
  }
});

test("config page - form validation and change detection", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for table cards
  const tableCards = page.locator(".table-item.card");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Expand the first card
    const firstCard = tableCards.first();
    const hamburgerButton = firstCard.locator("button.hamburger");
    await hamburgerButton.click();

    // 5. Verify submit button is initially disabled (no changes)
    const submitButton = firstCard.locator("button[type='submit']");
    await expect(submitButton).toBeDisabled();

    // 6. Find and modify a form field (e.g., mapbox access token)
    const mapboxTokenInput = firstCard
      .locator(
        'input[name*="MAPBOX_ACCESS_TOKEN"], input[placeholder*="Mapbox Access Token"]',
      )
      .first();

    if ((await mapboxTokenInput.count()) > 0) {
      // 7. Clear and enter a new value
      await mapboxTokenInput.clear();
      await mapboxTokenInput.fill("test_token_123");

      // 8. Verify submit button is now enabled
      await expect(submitButton).toBeEnabled();

      // 9. Clear the field to make it invalid
      await mapboxTokenInput.clear();

      // 10. Verify submit button is disabled again (invalid form)
      await expect(submitButton).toBeDisabled();
    }
  }
});

test("config page - remove table functionality", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for table cards
  const tableCards = page.locator(".table-item.card");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Expand the first card
    const firstCard = tableCards.first();
    const hamburgerButton = firstCard.locator("button.hamburger");
    await hamburgerButton.click();

    // 5. Get the table name
    const tableName = await firstCard.locator(".table-name").textContent();

    // 6. Click the remove table button
    const removeButton = firstCard.locator("button.remove-button");
    await removeButton.click();

    // 7. Verify the confirmation modal appears
    const modal = page.locator(".modal");
    await expect(modal).toBeVisible();

    // 8. Verify the modal message contains the table name
    if (tableName) {
      await expect(
        page.getByText(
          new RegExp(
            `are you sure you want to remove this table: ${tableName.trim()}\\?`,
            "i",
          ),
        ),
      ).toBeVisible();
    }

    // 9. Click confirm
    const confirmButton = page.getByRole("button", { name: /confirm/i });
    await confirmButton.click();

    // 10. Verify success message appears
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();

    // 11. Verify modal closes after timeout
    await page.waitForTimeout(3500);
    await expect(modal).not.toBeVisible();
  }
});

test("config page - cancel remove table modal", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for table cards
  const tableCards = page.locator(".table-item.card");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Expand the first card
    const firstCard = tableCards.first();
    const hamburgerButton = firstCard.locator("button.hamburger");
    await hamburgerButton.click();

    // 5. Click the remove table button
    const removeButton = firstCard.locator("button.remove-button");
    await removeButton.click();

    // 6. Verify the confirmation modal appears
    const modal = page.locator(".modal");
    await expect(modal).toBeVisible();

    // 7. Click cancel
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();

    // 8. Verify the modal closes
    await expect(modal).not.toBeVisible();
  }
});

test("config page - submit configuration changes", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for table cards
  const tableCards = page.locator(".table-item.card");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Expand the first card
    const firstCard = tableCards.first();
    const hamburgerButton = firstCard.locator("button.hamburger");
    await hamburgerButton.click();

    // 5. Find and modify a form field
    const mapboxTokenInput = firstCard
      .locator(
        'input[name*="MAPBOX_ACCESS_TOKEN"], input[placeholder*="Mapbox Access Token"]',
      )
      .first();

    if ((await mapboxTokenInput.count()) > 0) {
      // 6. Enter a valid token
      await mapboxTokenInput.clear();
      await mapboxTokenInput.fill("pk.test_token_123");

      // 7. Submit the form
      const submitButton = firstCard.locator("button[type='submit']");
      await submitButton.click();

      // 8. Verify success message appears
      await expect(page.getByText(/configuration updated!/i)).toBeVisible();

      // 9. Verify modal closes after timeout
      await page.waitForTimeout(3500);
      const modal = page.locator(".modal");
      await expect(modal).not.toBeVisible();
    }
  }
});

test("config page - views configuration section", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for table cards
  const tableCards = page.locator(".table-item.card");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Expand the first card
    const firstCard = tableCards.first();
    const hamburgerButton = firstCard.locator("button.hamburger");
    await hamburgerButton.click();

    // 5. Look for views checkboxes
    const viewsCheckboxes = firstCard.locator('input[type="checkbox"]');
    const checkboxCount = await viewsCheckboxes.count();

    if (checkboxCount > 0) {
      // 6. Test toggling a checkbox
      const firstCheckbox = viewsCheckboxes.first();
      const isChecked = await firstCheckbox.isChecked();

      // 7. Toggle the checkbox
      await firstCheckbox.click();

      // 8. Verify the state changed
      await expect(firstCheckbox).toHaveJSProperty("checked", !isChecked);

      // 9. Verify submit button is now enabled (changes detected)
      const submitButton = firstCard.locator("button[type='submit']");
      await expect(submitButton).toBeEnabled();
    }
  }
});

test("config page - conditional form sections based on views", async ({
  page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for table cards
  const tableCards = page.locator(".table-item.card");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Expand the first card
    const firstCard = tableCards.first();
    const hamburgerButton = firstCard.locator("button.hamburger");
    await hamburgerButton.click();

    // 5. Check for different config sections
    const configSections = firstCard.locator(".config-section");
    const sectionCount = await configSections.count();

    // 6. Verify at least one config section is present
    expect(sectionCount).toBeGreaterThan(0);

    // 7. Look for specific section headers
    const sectionHeaders = firstCard.locator(".config-header h3");
    const headerCount = await sectionHeaders.count();

    if (headerCount > 0) {
      // 8. Verify section headers are visible
      for (let i = 0; i < headerCount; i++) {
        const header = sectionHeaders.nth(i);
        await expect(header).toBeVisible();
      }
    }
  }
});

test("config page - language switching functionality", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the language picker button to be visible
  const languageButton = page
    .locator("button")
    .filter({ hasText: /English|Español|Nederlands|Português/i });
  await languageButton.waitFor({ state: "visible", timeout: 5000 });

  // 3. Click the button to open dropdown
  await languageButton.click();

  // 4. Wait for dropdown menu to appear
  const dropdownMenu = page.locator(
    "div[class*='absolute'][class*='right-0'][class*='bg-white']",
  );
  await dropdownMenu.waitFor({ state: "visible", timeout: 5000 });

  // 5. Check that multiple language options are available
  const languageOptions = dropdownMenu.locator("a[href='#']");
  const optionCount = await languageOptions.count();
  expect(optionCount).toBeGreaterThan(1);

  // 6. Test language switching by clicking a different language
  const firstOption = languageOptions.first();
  const firstOptionText = await firstOption.textContent();
  const buttonText = await languageButton.textContent();

  // Only switch if it's different from current language
  if (firstOptionText?.trim() !== buttonText?.trim()) {
    await firstOption.click();

    // 7. Verify the button text changed
    await page.waitForTimeout(1000);
    const newButtonText = await languageButton.textContent();
    expect(newButtonText?.trim()).toBe(firstOptionText?.trim());
  }
});

test("config page - error handling for invalid form submission", async ({
  page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for table cards
  const tableCards = page.locator(".table-item.card");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Expand the first card
    const firstCard = tableCards.first();
    const hamburgerButton = firstCard.locator("button.hamburger");
    await hamburgerButton.click();

    // 5. Find mapbox access token field
    const mapboxTokenInput = firstCard
      .locator(
        'input[name*="MAPBOX_ACCESS_TOKEN"], input[placeholder*="Mapbox Access Token"]',
      )
      .first();

    if ((await mapboxTokenInput.count()) > 0) {
      // 6. Clear the field to make it invalid
      await mapboxTokenInput.clear();

      // 7. Try to submit the form
      const submitButton = firstCard.locator("button[type='submit']");

      // 8. Verify submit button is disabled due to invalid form
      await expect(submitButton).toBeDisabled();

      // 9. Verify the button has the disabled styling
      await expect(submitButton).toHaveClass(/bg-gray-500/);
    }
  }
});

test("config page - modal overlay functionality", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Click the add new table button to open modal
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  // 3. Verify the overlay is present
  const overlay = page.locator(".overlay");
  await expect(overlay).toBeVisible();

  // 4. Verify the modal is on top of the overlay
  const modal = page.locator(".modal");
  await expect(modal).toBeVisible();

  // 5. Click cancel to close modal
  const cancelButton = page.getByRole("button", { name: /cancel/i });
  await cancelButton.click();

  // 6. Verify both overlay and modal are hidden
  await expect(overlay).not.toBeVisible();
  await expect(modal).not.toBeVisible();
});
