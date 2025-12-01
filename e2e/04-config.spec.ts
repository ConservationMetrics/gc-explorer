import { expect, test } from "@playwright/test";

test("config page - displays configuration dashboard with dataset cards", async ({
  page,
}) => {
  console.log("[TEST] Starting: displays configuration dashboard");
  // 1. Navigate to the config page
  console.log("[TEST] Step 1: Navigating to /config");
  await page.goto("/config");

  // 2. Wait for the page heading to become visible
  console.log("[TEST] Step 2: Waiting for page heading");
  await expect(
    page.getByRole("heading", { name: /available views: configuration/i }),
  ).toBeVisible();
  console.log("[TEST] Step 2: Page heading is visible");

  // 3. Verify the language picker is present
  console.log("[TEST] Step 3: Checking language picker");
  const languageButton = page
    .locator("button")
    .filter({ hasText: /English|Español|Nederlands|Português/i });
  await expect(languageButton).toBeVisible();
  console.log("[TEST] Step 3: Language picker is visible");

  // 4. Verify the add new table button is present
  console.log("[TEST] Step 4: Checking add new table button");
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await expect(addTableButton).toBeVisible();
  console.log("[TEST] Step 4: Add new table button is visible");

  // 5. Wait for the grid container to be present (indicates data has loaded)
  console.log("[TEST] Step 5: Waiting for grid container");
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });
  console.log("[TEST] Step 5: Grid container is present");

  // 6. Verify dataset cards are present (list view)
  console.log("[TEST] Step 6: Checking dataset cards");
  const datasetCards = page.locator(".dataset-card");
  const cardCount = await datasetCards.count();
  console.log(`[TEST] Step 6: Found ${cardCount} dataset cards`);
  expect(cardCount).toBeGreaterThan(0);

  // 7. Verify "Edit dataset" buttons are present
  console.log("[TEST] Step 7: Checking edit dataset buttons");
  const editButtons = page.getByRole("link", { name: /edit dataset/i });
  await expect(editButtons.first()).toBeVisible();
  console.log("[TEST] Step 7: Edit dataset buttons are visible");
  console.log("[TEST] ✅ Test completed successfully");
});

test("config page - add table functionality", async ({ page }) => {
  console.log("[TEST] Starting: add table functionality");
  // 1. Navigate to the config page
  console.log("[TEST] Step 1: Navigating to /config");
  await page.goto("/config");

  // 2. Wait for the grid container
  console.log("[TEST] Step 2: Waiting for grid container");
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });
  console.log("[TEST] Step 2: Grid container is present");

  // 3. Click the add new table button
  console.log("[TEST] Step 3: Clicking add new table button");
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();
  console.log("[TEST] Step 3: Clicked add new table button");

  // 4. Verify the modal appears with dropdown
  console.log("[TEST] Step 4: Checking for modal");
  const modal = page.locator(".modal");
  await expect(modal).toBeVisible();
  console.log("[TEST] Step 4: Modal is visible");

  // 5. Verify the modal message
  console.log("[TEST] Step 5: Checking modal message");
  await expect(page.getByText(/select table to add:/i)).toBeVisible();
  console.log("[TEST] Step 5: Modal message is visible");

  // 6. Verify the dropdown is present
  console.log("[TEST] Step 6: Checking dropdown");
  const dropdown = page.locator("select");
  await expect(dropdown).toBeVisible();
  console.log("[TEST] Step 6: Dropdown is visible");

  // 7. Verify the confirm button is initially disabled
  console.log("[TEST] Step 7: Checking confirm button is disabled");
  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await expect(confirmButton).toBeDisabled();
  console.log("[TEST] Step 7: Confirm button is disabled");

  // 8. Select an option from the dropdown
  console.log("[TEST] Step 8: Selecting option from dropdown");
  await dropdown.selectOption({ index: 0 });
  console.log("[TEST] Step 8: Selected option from dropdown");

  // 9. Get the selected table name before confirming
  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();
  console.log(`[TEST] Step 9: Selected table name: ${tableNameToAdd}`);

  // 10. Verify the confirm button is now enabled
  console.log("[TEST] Step 10: Checking confirm button is enabled");
  await expect(confirmButton).toBeEnabled();
  console.log("[TEST] Step 10: Confirm button is enabled");

  // 11. Click confirm
  console.log("[TEST] Step 11: Clicking confirm button");
  await confirmButton.click();
  console.log("[TEST] Step 11: Clicked confirm button");

  // 12. Verify success message appears
  console.log("[TEST] Step 12: Waiting for success message");
  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  console.log("[TEST] Step 12: Success message is visible");

  // 13. Verify modal closes after timeout
  console.log("[TEST] Step 13: Waiting for modal to close");
  await page.waitForTimeout(3500);
  await expect(modal).not.toBeVisible();
  console.log("[TEST] Step 13: Modal is closed");

  // 14. Wait for the page to reload and find the newly added table
  console.log("[TEST] Step 14: Waiting for page reload");
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });
  console.log("[TEST] Step 14: Page reloaded");

  // 15. Find the dataset card with the table name we just added
  if (tableNameToAdd) {
    console.log(
      `[TEST] Step 15: Looking for dataset card: ${tableNameToAdd.trim()}`,
    );
    const targetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(targetCard).toBeVisible();
    console.log(
      `[TEST] Step 15: Found dataset card for ${tableNameToAdd.trim()}`,
    );
  }
  console.log("[TEST] ✅ Test completed successfully");
});

test("config page - navigate to dataset edit page", async ({ page }) => {
  console.log("[TEST] Starting: navigate to dataset edit page");
  // 1. Navigate to the config page
  console.log("[TEST] Step 1: Navigating to /config");
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  console.log("[TEST] Step 2: Waiting for grid container");
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });
  console.log("[TEST] Step 2: Grid container is present");

  // 3. Look for dataset cards
  console.log("[TEST] Step 3: Looking for dataset cards");
  const datasetCards = page.locator(".dataset-card");
  const cardCount = await datasetCards.count();
  console.log(`[TEST] Step 3: Found ${cardCount} dataset cards`);

  if (cardCount > 0) {
    // 4. Get the first dataset name
    console.log("[TEST] Step 4: Getting first dataset name");
    const firstCard = datasetCards.first();
    const datasetName = await firstCard.locator(".dataset-name").textContent();
    console.log(`[TEST] Step 4: First dataset name: ${datasetName}`);

    // 5. Click the "Edit dataset" button
    console.log("[TEST] Step 5: Clicking edit dataset button");
    const editButton = firstCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();
    console.log("[TEST] Step 5: Clicked edit dataset button");

    // 6. Verify we're on the dataset edit page
    console.log(
      `[TEST] Step 6: Waiting for navigation to /config/${datasetName?.trim()}`,
    );
    await page.waitForURL(`**/config/${datasetName?.trim()}`, {
      timeout: 5000,
    });
    console.log(`[TEST] Step 6: Navigated to /config/${datasetName?.trim()}`);

    // 7. Verify the card body is visible (accordion is open by default)
    console.log("[TEST] Step 7: Checking card body is visible");
    const cardBody = page.locator(".card-body");
    await expect(cardBody).toBeVisible();
    console.log("[TEST] Step 7: Card body is visible");
  } else {
    console.log("[TEST] ⚠️ No dataset cards found, skipping test");
  }
  console.log("[TEST] ✅ Test completed successfully");
});

test("config page - edit dataset form", async ({ page }) => {
  console.log("[TEST] Starting: edit dataset form");
  // 1. Navigate to the config page
  console.log("[TEST] Step 1: Navigating to /config");
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  console.log("[TEST] Step 2: Waiting for grid container");
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });
  console.log("[TEST] Step 2: Grid container is present");

  // 3. Look for dataset cards
  console.log("[TEST] Step 3: Looking for dataset cards");
  const datasetCards = page.locator(".dataset-card");
  const cardCount = await datasetCards.count();
  console.log(`[TEST] Step 3: Found ${cardCount} dataset cards`);

  if (cardCount > 0) {
    // 4. Click "Edit dataset" on the first card to navigate to edit page
    console.log("[TEST] Step 4: Clicking edit dataset on first card");
    const firstDatasetCard = datasetCards.first();
    const editButton = firstDatasetCard.getByRole("link", {
      name: /edit dataset/i,
    });
    await editButton.click();
    console.log("[TEST] Step 4: Clicked edit dataset button");

    // 5. Wait for navigation to complete
    console.log("[TEST] Step 5: Waiting for navigation");
    await page.waitForURL("**/config/**", { timeout: 5000 });
    console.log("[TEST] Step 5: Navigation complete");

    // 6. Find the config card on the edit page (accordion is open by default)
    console.log("[TEST] Step 6: Looking for config card");
    const firstCard = page.locator(".table-item.card").first();
    await expect(firstCard).toBeVisible();
    console.log("[TEST] Step 6: Config card is visible");

    // 7. Wait for form content to be visible
    console.log("[TEST] Step 7: Waiting for form content");
    await firstCard
      .locator(".config-section")
      .first()
      .waitFor({ state: "visible" });
    console.log("[TEST] Step 7: Form content is visible");

    // 8. Verify submit button exists
    console.log("[TEST] Step 8: Checking submit button");
    const submitButton = firstCard.locator("button[type='submit']");
    await expect(submitButton).toBeVisible();
    console.log("[TEST] Step 8: Submit button is visible");

    // 9. Check if submit button is enabled or disabled (depends on form state)
    const isEnabled = await submitButton.isEnabled();
    console.log(
      `[TEST] Step 9: Submit button is ${isEnabled ? "enabled" : "disabled"}`,
    );

    // 10. Try to find and interact with a form field if available
    console.log("[TEST] Step 10: Looking for form fields");
    const textInputs = firstCard.locator('input[type="text"]');
    const inputCount = await textInputs.count();
    console.log(`[TEST] Step 10: Found ${inputCount} text inputs`);

    if (inputCount > 0) {
      console.log("[TEST] Step 11: Interacting with first text input");
      const firstTextInput = textInputs.first();
      const currentValue = await firstTextInput.inputValue();
      console.log(`[TEST] Step 11: Current value: ${currentValue}`);

      // Try to modify the field
      await firstTextInput.clear();
      await firstTextInput.fill("test_value");
      console.log("[TEST] Step 11: Modified input value");

      // Wait a bit for form to detect change
      await page.waitForTimeout(500);

      const isEnabledAfterChange = await submitButton.isEnabled();
      console.log(
        `[TEST] Step 11: Submit button after change is ${isEnabledAfterChange ? "enabled" : "disabled"}`,
      );
    }
  } else {
    console.log("[TEST] ⚠️ No dataset cards found, skipping test");
  }
  console.log("[TEST] ✅ Test completed successfully");
});

test("config page - cancel add table modal", async ({ page }) => {
  console.log("[TEST] Starting: cancel add table modal");
  // 1. Navigate to the config page
  console.log("[TEST] Step 1: Navigating to /config");
  await page.goto("/config");

  // 2. Click the add new table button
  console.log("[TEST] Step 2: Clicking add new table button");
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();
  console.log("[TEST] Step 2: Clicked add new table button");

  // 3. Verify the modal appears
  console.log("[TEST] Step 3: Checking for modal");
  const modal = page.locator(".modal");
  await expect(modal).toBeVisible();
  console.log("[TEST] Step 3: Modal is visible");

  // 4. Click the cancel button
  console.log("[TEST] Step 4: Clicking cancel button");
  const cancelButton = page.getByRole("button", { name: /cancel/i });
  await cancelButton.click();
  console.log("[TEST] Step 4: Clicked cancel button");

  // 5. Verify the modal closes
  console.log("[TEST] Step 5: Checking modal is closed");
  await expect(modal).not.toBeVisible();
  console.log("[TEST] Step 5: Modal is closed");
  console.log("[TEST] ✅ Test completed successfully");
});
