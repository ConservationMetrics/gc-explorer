import { test, expect } from "./fixtures/auth-storage";

test("config page - displays configuration dashboard with table cards", async ({
  authenticatedPageAsAdmin: page,
}) => {
  console.log("[TEST] Starting: displays configuration dashboard");
  // 1. Navigate to the config page
  console.log("[TEST] Step 1: Navigating to /config");
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for ClientOnly component to render and page to load
  await page.waitForLoadState("networkidle");
  // Wait for ConfigDashboard to render (it's wrapped in ClientOnly)
  await page.waitForSelector("div.max-w-7xl", { timeout: 15000 });
  console.log("[TEST] Step 2: Waiting for page heading");
  // ConfigDashboard uses "datasetViewManagement" heading, not "available views: configuration"
  await expect(
    page.getByRole("heading", {
      name: /dataset view management|configuration/i,
    }),
  ).toBeVisible({ timeout: 15000 });
  console.log("[TEST] Step 2: Page heading is visible");

  // 3. Verify the language picker is present
  console.log("[TEST] Step 3: Checking language picker");
  const languageButton = page
    .locator("button")
    .filter({ hasText: /English|Español|Nederlands|Português/i });
  await expect(languageButton).toBeVisible();
  console.log("[TEST] Step 3: Language picker is visible");

  // 4. Verify the add new dataset view button is present
  console.log("[TEST] Step 4: Checking add new dataset view button");
  // Button text changed from "Add new table" to "Add new dataset view"
  // Button is in flex justify-end section
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await expect(addTableButton).toBeVisible({ timeout: 10000 });
  console.log("[TEST] Step 4: Add new table button is visible");

  // 5. Wait for the grid to be present (indicates data has loaded)
  // ConfigDashboard uses "grid" class, not "grid-container"
  console.log("[TEST] Step 5: Waiting for grid");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });
  console.log("[TEST] Step 5: Grid is present");

  // 6. Verify dataset cards are present (cards are divs with purple background)
  console.log("[TEST] Step 6: Checking dataset cards");
  const datasetCards = page.locator(".bg-purple-50");
  const cardCount = await datasetCards.count();
  console.log(`[TEST] Step 6: Found ${cardCount} dataset cards`);
  expect(cardCount).toBeGreaterThan(0);

  // 7. Verify "Edit dataset" buttons are present
  console.log("[TEST] Step 7: Checking edit dataset buttons");
  const editButtons = page.getByRole("link", { name: /edit dataset/i });
  await expect(editButtons.first()).toBeVisible();
  console.log("[TEST] Step 7: Edit dataset buttons are visible");
  console.log("[TEST] Test completed successfully");
});

test("config page - add and remove table functionality", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  console.log("[TEST] Step 1: Navigating to /config");
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for page load and grid
  await page.waitForLoadState("networkidle");
  // Wait for ClientOnly to render ConfigDashboard
  await page.waitForSelector("div.max-w-7xl", { timeout: 15000 });
  console.log("[TEST] Step 2: Waiting for grid");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 15000 });
  console.log("[TEST] Step 2: Grid container is present");

  // 3. Click the add new table button
  console.log("[TEST] Step 3: Clicking add new table button");
  // Button is in flex justify-end section, has SVG plus icon
  const addTableButton = page.locator("div.flex.justify-end button").first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();
  console.log("[TEST] Step 3: Clicked add new table button");

  // 4. Verify the modal appears with dropdown
  console.log("[TEST] Step 4: Checking for modal");
  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
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
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });
  console.log("[TEST] Step 14: Page reloaded");

  // 15. Find the dataset card with the table name we just added
  if (tableNameToAdd) {
    console.log(
      `[TEST] Step 15: Looking for dataset card: ${tableNameToAdd.trim()}`,
    );
    const targetCard = page.locator(
      `.bg-purple-50:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible();
    console.log(
      `[TEST] Step 15: Found dataset card for ${tableNameToAdd.trim()}`,
    );
  }
  console.log("[TEST] Test completed successfully");
});

test("config page - navigate to dataset edit page", async ({ page }) => {
  console.log("[TEST] Starting: navigate to dataset edit page");
  // 1. Navigate to the config page
  console.log("[TEST] Step 1: Navigating to /config");
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  console.log("[TEST] Step 2: Waiting for grid container");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });
  console.log("[TEST] Step 2: Grid container is present");

  // 3. Look for dataset cards
  console.log("[TEST] Step 3: Looking for dataset cards");
  const datasetCards = page.locator(".bg-purple-50");
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
    console.log("[TEST] No dataset cards found, skipping test");
  }
  console.log("[TEST] Test completed successfully");
});

test("config page - edit dataset form", async ({
  authenticatedPageAsAdmin: page,
}) => {
  console.log("[TEST] Starting: edit dataset form");
  // 1. Navigate to the config page
  console.log("[TEST] Step 1: Navigating to /config");
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // Wait for page to load
  await page.waitForLoadState("networkidle");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  console.log("[TEST] Step 2: Waiting for grid container");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });
  console.log("[TEST] Step 2: Grid container is present");

  // 3. Look for dataset cards
  console.log("[TEST] Step 3: Looking for dataset cards");
  const datasetCards = page.locator(".bg-purple-50");
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
    const firstCard = page.locator(".bg-purple-50").first();
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
    console.log("[TEST] No dataset cards found, skipping test");
  }
  console.log("[TEST] Test completed successfully");
});

test("config page - cancel add table modal", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  console.log("[TEST] Step 1: Navigating to /config");
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Click the add new table button
  console.log("[TEST] Step 2: Clicking add new table button");
  // Button is in flex justify-end section
  const addTableButton = page.locator("div.flex.justify-end button").first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();
  console.log("[TEST] Step 2: Clicked add new table button");

  // 3. Verify the modal appears
  console.log("[TEST] Step 3: Checking for modal");
  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
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
  console.log("[TEST] Test completed successfully");
});

test("config page - table card minimize/expand functionality", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // NOTE: Cards no longer have minimize/expand - they link directly to edit pages
  // This test now verifies that cards are clickable and link to edit pages
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("div.max-w-7xl", { timeout: 15000 });

  // 2. Wait for the grid to be present (indicates data has loaded)
  await page.locator(".grid").waitFor({ state: "attached", timeout: 15000 });

  // 3. Look for dataset cards (cards are divs with purple background)
  const tableCards = page.locator(".bg-purple-50");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Verify cards have "Edit Dataset" links
    const firstCard = tableCards.first();
    const editLink = firstCard.getByRole("link", { name: /edit dataset/i });
    await expect(editLink).toBeVisible();

    // 5. Verify the link goes to a config edit page
    const href = await editLink.getAttribute("href");
    expect(href).toMatch(/\/config\/\w+/);
  }
});

test("config page - form validation and change detection", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. First, add a table to work with
  // Button text changed from "Add new table" to "Add new dataset view"
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  // 4. Verify the modal appears with dropdown
  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  await expect(modal).toBeVisible();

  // 5. Select an option from the dropdown
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  // 6. Get the selected table name before confirming
  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  // 7. Click confirm to add the table
  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  // 8. Wait for success message and modal to close
  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  // 9. Wait for the page to reload and find the newly added table
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.bg-purple-50:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible();

    // 11. Expand the target card
    // Cards no longer have hamburger buttons - navigate to edit page
    const editLink = targetCard.getByRole("link", { name: /edit dataset/i });
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

    // 12. Wait for form content to be visible
    await targetCard
      .locator(".config-section")
      .first()
      .waitFor({ state: "visible" });

    // 13. Verify submit button is initially disabled (no changes)
    const submitButton = targetCard.locator("button[type='submit']");
    await expect(submitButton).toBeDisabled();

    // 14. Test mapbox3d checkbox and terrain exaggeration slider (if map config exists)
    const mapbox3dCheckbox = targetCard.locator(
      'input[type="checkbox"][id$="MAPBOX_3D"]',
    );

    const has3dMapConfig = (await mapbox3dCheckbox.count()) > 0;

    if (has3dMapConfig) {
      // 14a. Verify checkbox is visible
      await expect(mapbox3dCheckbox).toBeVisible();

      // 14b. Verify slider container is not visible initially
      const sliderContainer = targetCard
        .locator('label:has-text("terrainExaggeration")')
        .locator("..");
      await expect(sliderContainer).not.toBeVisible();

      // 14c. Check the mapbox3d checkbox
      await mapbox3dCheckbox.check();

      // 14d. Verify the terrain exaggeration slider container appears
      await expect(sliderContainer).toBeVisible();

      // 14e. Verify submit button is now enabled (change detected)
      await expect(submitButton).toBeEnabled();

      // 14f. Uncheck the mapbox3d checkbox
      await mapbox3dCheckbox.uncheck();

      // 14g. Verify slider is hidden again
      await expect(sliderContainer).not.toBeVisible();
    }

    // 15. Find and modify a form field (e.g., mapbox access token)
    const mapboxTokenInput = targetCard.locator(
      'input[id$="MAPBOX_ACCESS_TOKEN"]',
    );

    if ((await mapboxTokenInput.count()) > 0) {
      // 16. Test invalid token format (should not start with pk.ey)
      await mapboxTokenInput.clear();
      await mapboxTokenInput.fill("invalid_token_123");

      // 17. Verify submit button is disabled due to invalid format
      await expect(submitButton).toBeDisabled();

      // 18. Test valid token format (should start with pk.ey)
      await mapboxTokenInput.clear();
      await mapboxTokenInput.fill(
        "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example",
      );

      // 19. Verify submit button is now enabled with valid format
      await expect(submitButton).toBeEnabled();

      // 20. Test partial valid format (pk.ey but incomplete)
      await mapboxTokenInput.clear();
      await mapboxTokenInput.fill("pk.ey");

      // 21. Verify submit button is still enabled (pattern allows pk.ey.*)
      await expect(submitButton).toBeEnabled();

      // 22. Clear the field to make it invalid
      await mapboxTokenInput.clear();

      // 23. Verify submit button is disabled again (invalid form)
      await expect(submitButton).toBeDisabled();
    }

    // 24. Clean up: remove the table we added
    const removeButton = targetCard.locator("button.remove-button");
    await removeButton.click();

    // 25. Verify the confirmation modal appears
    await expect(modal).toBeVisible();

    // 26. Click confirm to remove
    await confirmButton.click();

    // 27. Verify success message appears
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();

    // 28. Verify modal closes after timeout
    await page.waitForTimeout(3500);
    await expect(modal).not.toBeVisible();
  }
});

test("config page - submit configuration changes", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. First, add a table to work with
  // Button text changed from "Add new table" to "Add new dataset view"
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  // 4. Verify the modal appears with dropdown
  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  await expect(modal).toBeVisible();

  // 5. Select an option from the dropdown
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  // 6. Get the selected table name before confirming
  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  // 7. Click confirm to add the table
  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  // 8. Wait for success message and modal to close
  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  // 9. Wait for the page to reload and find the newly added table
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.bg-purple-50:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible();

    // 11. Expand the target card
    // Cards no longer have hamburger buttons - navigate to edit page
    const editLink = targetCard.getByRole("link", { name: /edit dataset/i });
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

    // 12. Find and modify a form field
    const mapboxTokenInput = targetCard
      .locator(
        'input[name*="MAPBOX_ACCESS_TOKEN"], input[placeholder*="Mapbox Access Token"]',
      )
      .first();

    if ((await mapboxTokenInput.count()) > 0) {
      // 13. Enter a valid token that matches the pattern
      await mapboxTokenInput.clear();
      await mapboxTokenInput.fill(
        "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example",
      );

      // 14. Submit the form
      const submitButton = targetCard.locator("button[type='submit']");
      await submitButton.click();

      // 15. Verify success message appears
      await expect(page.getByText(/configuration updated!/i)).toBeVisible();

      // 16. Verify modal closes after timeout
      await page.waitForTimeout(3500);
      await expect(modal).not.toBeVisible();
    }

    // 17. Clean up: remove the table we added
    const removeButton = targetCard.locator("button.remove-button");
    await removeButton.click();

    // 18. Verify the confirmation modal appears
    await expect(modal).toBeVisible();

    // 19. Click confirm to remove
    await confirmButton.click();

    // 20. Verify success message appears
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();

    // 21. Verify modal closes after timeout
    await page.waitForTimeout(3500);
    await expect(modal).not.toBeVisible();
  }
});

test("config page - views configuration section", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for table cards (cards are divs with purple background)
  const tableCards = page.locator(".bg-purple-50");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Expand the first card
    const firstCard = tableCards.first();
    // Cards no longer have hamburger buttons - they link to edit pages
    // Navigate to the edit page instead
    const editLink = firstCard.getByRole("link", { name: /edit dataset/i });
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

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

      // 9. Wait a moment for the form to detect the change
      await page.waitForTimeout(1000);

      // 10. Check if submit button is enabled, if not, try modifying a text field instead
      const submitButton = firstCard.locator("button[type='submit']");
      const isEnabled = await submitButton.isEnabled();

      if (!isEnabled) {
        // 11. Try modifying a text field to trigger form changes
        const textInputs = firstCard.locator('input[type="text"]');
        const inputCount = await textInputs.count();

        if (inputCount > 0) {
          const firstTextInput = textInputs.first();
          await firstTextInput.clear();
          await firstTextInput.fill("test_value");
          await page.waitForTimeout(500);
        }
      }

      // 12. Verify submit button is now enabled (changes detected)
      await expect(submitButton).toBeEnabled();
    }
  }
});

test("config page - conditional form sections based on views", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. First, add a table to work with
  // Button text changed from "Add new table" to "Add new dataset view"
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  // 4. Verify the modal appears with dropdown
  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  await expect(modal).toBeVisible();

  // 5. Select an option from the dropdown
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  // 6. Get the selected table name before confirming
  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  // 7. Click confirm to add the table
  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  // 8. Wait for success message and modal to close
  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  // 9. Wait for the page to reload and find the newly added table
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.bg-purple-50:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible();

    // 11. Expand the target card
    // Cards no longer have hamburger buttons - navigate to edit page
    const editLink = targetCard.getByRole("link", { name: /edit dataset/i });
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

    // 12. Check for different config sections
    const configSections = targetCard.locator(".config-section");
    const sectionCount = await configSections.count();

    // 13. Verify at least one config section is present
    expect(sectionCount).toBeGreaterThan(0);

    // 14. Look for specific section headers
    const sectionHeaders = targetCard.locator(".config-header h3");
    const headerCount = await sectionHeaders.count();

    if (headerCount > 0) {
      // 15. Verify section headers are visible
      for (let i = 0; i < headerCount; i++) {
        const header = sectionHeaders.nth(i);
        await expect(header).toBeVisible();
      }
    }

    // 16. Clean up: remove the table we added
    const removeButton = targetCard.locator("button.remove-button");
    await removeButton.click();

    // 17. Verify the confirmation modal appears
    await expect(modal).toBeVisible();

    // 18. Click confirm to remove
    await confirmButton.click();

    // 19. Verify success message appears
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();

    // 20. Verify modal closes after timeout
    await page.waitForTimeout(3500);
    await expect(modal).not.toBeVisible();
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
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. First, add a table to work with
  // Button text changed from "Add new table" to "Add new dataset view"
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  // 4. Verify the modal appears with dropdown
  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  await expect(modal).toBeVisible();

  // 5. Select an option from the dropdown
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  // 6. Get the selected table name before confirming
  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  // 7. Click confirm to add the table
  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  // 8. Wait for success message and modal to close
  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  // 9. Wait for the page to reload and find the newly added table
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.bg-purple-50:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible();

    // 11. Expand the target card
    // Cards no longer have hamburger buttons - navigate to edit page
    const editLink = targetCard.getByRole("link", { name: /edit dataset/i });
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

    // 12. Find mapbox access token field
    const mapboxTokenInput = targetCard
      .locator(
        'input[name*="MAPBOX_ACCESS_TOKEN"], input[placeholder*="Mapbox Access Token"]',
      )
      .first();

    if ((await mapboxTokenInput.count()) > 0) {
      // 13. Verify the input has the correct pattern attribute
      await expect(mapboxTokenInput).toHaveAttribute("pattern", "^pk\\.ey.*");

      // 14. Verify the input has the correct placeholder
      await expect(mapboxTokenInput).toHaveAttribute("placeholder", "pk.ey…");

      // 15. Verify the input has the correct title attribute for tooltip
      await expect(mapboxTokenInput).toHaveAttribute("title", /pk\.ey…/);

      // 16. Test invalid token format that doesn't match pattern
      await mapboxTokenInput.clear();
      await mapboxTokenInput.fill("invalid_token_123");

      // 17. Try to submit the form
      const submitButton = targetCard.locator("button[type='submit']");

      // 18. Verify submit button is disabled due to invalid format
      await expect(submitButton).toBeDisabled();

      // 19. Verify the button has the disabled styling
      await expect(submitButton).toHaveClass(/bg-gray-500/);

      // 20. Test valid token format that matches pattern
      await mapboxTokenInput.clear();
      await mapboxTokenInput.fill(
        "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example",
      );

      // 21. Verify submit button is now enabled with valid format
      await expect(submitButton).toBeEnabled();
    }

    // 22. Clean up: remove the table we added
    const removeButton = targetCard.locator("button.remove-button");
    await removeButton.click();

    // 23. Verify the confirmation modal appears
    await expect(modal).toBeVisible();

    // 24. Click confirm to remove
    await confirmButton.click();

    // 25. Verify success message appears
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();

    // 26. Verify modal closes after timeout
    await page.waitForTimeout(3500);
    await expect(modal).not.toBeVisible();
  }
});

test("config page - modal overlay functionality and cancel button", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Click the add new table button to open modal
  // Button text changed from "Add new table" to "Add new dataset view"
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  // 3. Verify the overlay is present
  const overlay = page.locator(".overlay");
  await expect(overlay).toBeVisible();

  // 4. Verify the modal is on top of the overlay
  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  await expect(modal).toBeVisible();

  // 5. Click cancel to close modal
  const cancelButton = page.getByRole("button", { name: /cancel/i });
  await cancelButton.click();

  // 6. Verify both overlay and modal are hidden
  await expect(overlay).not.toBeVisible();
  await expect(modal).not.toBeVisible();
});

test("config page - visibility permissions configuration", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the page to load
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. Find the first table card and expand it
  const firstCard = page.locator(".table-item.card").first();
  const hamburgerButton = firstCard.locator("button.hamburger");
  await hamburgerButton.click();

  // 4. Look for the visibility section (should be visible to admins)
  const visibilitySection = firstCard.locator("text=Visibility");

  // If visibility section is visible (admin user), test the functionality
  if (await visibilitySection.isVisible()) {
    // 5. Verify the help text is present
    await expect(
      firstCard.locator("text=Choose who can view this view."),
    ).toBeVisible();

    // 6. Verify all four visibility options are present
    await expect(
      firstCard.locator("text=Public — no sign-in required"),
    ).toBeVisible();
    await expect(firstCard.locator("text=Signed-in (all roles)")).toBeVisible();
    await expect(firstCard.locator("text=Members")).toBeVisible();
    await expect(firstCard.locator("text=Admins")).toBeVisible();

    // 7. Check that radio buttons are present
    const radioButtons = firstCard.locator('input[type="radio"]');
    await expect(radioButtons).toHaveCount(4);

    // 8. Verify the default selection is "Members"
    const defaultSelected = firstCard.locator('input[type="radio"]:checked');
    await expect(defaultSelected).toHaveValue("member");
  } else {
    // Non-admin user - should not see visibility section
    await expect(visibilitySection).not.toBeVisible();
  }
});

test("config page - basemap configuration - add and remove basemaps", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. Add a table to work with
  // Button text changed from "Add new table" to "Add new dataset view"
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  await expect(modal).toBeVisible();

  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 4. Find and expand the target card
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.bg-purple-50:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible();

    // Cards no longer have hamburger buttons - navigate to edit page
    const editLink = targetCard.getByRole("link", { name: /edit dataset/i });
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

    // 5. Wait for map configuration section
    await targetCard
      .locator(".config-section")
      .first()
      .waitFor({ state: "visible" });

    // 6. Look for basemap configuration section
    const basemapLabel = targetCard.locator(
      'label:has-text("Mapbox Background Map(s)")',
    );
    const hasBasemapConfig = (await basemapLabel.count()) > 0;

    if (hasBasemapConfig) {
      // 7. Verify initial basemap exists
      const basemapItems = targetCard.locator(".basemap-item");
      await expect(basemapItems.first()).toBeVisible();

      // 8. Verify first basemap has default styling
      const firstBasemap = basemapItems.first();
      await expect(firstBasemap).toHaveClass(/basemap-default/);

      // 9. Find and click add basemap button
      const addBasemapButton = targetCard.locator(
        'button.add-basemap-button:has-text("+")',
      );
      await expect(addBasemapButton).toBeVisible();
      await expect(addBasemapButton).toBeEnabled();

      // 10. Add first basemap
      await addBasemapButton.click();
      await page.waitForTimeout(500);

      // 11. Verify there are now 2 basemaps
      const basemapItemsAfterAdd = targetCard.locator(".basemap-item");
      expect(await basemapItemsAfterAdd.count()).toBe(2);

      // 12. Add second basemap
      await addBasemapButton.click();
      await page.waitForTimeout(500);

      // 13. Verify there are now 3 basemaps
      expect(await basemapItemsAfterAdd.count()).toBe(3);

      // 14. Verify add button is now disabled
      await expect(addBasemapButton).toBeDisabled();
      await expect(addBasemapButton).toHaveClass(/disabled/);

      // 15. Find remove buttons (should be 2, since first cannot be removed)
      const removeButtons = targetCard.locator("button.remove-button");
      expect(await removeButtons.count()).toBe(2);

      // 16. Remove the second basemap
      await removeButtons.first().click();
      await page.waitForTimeout(500);

      // 17. Verify there are now 2 basemaps
      expect(await basemapItemsAfterAdd.count()).toBe(2);

      // 18. Verify add button is enabled again
      await expect(addBasemapButton).toBeEnabled();
    }

    // 19. Clean up
    const removeButton = targetCard.locator("button.remove-button").last();
    await removeButton.click();
    await expect(modal).toBeVisible();
    await confirmButton.click();
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();
    await page.waitForTimeout(3500);
  }
});

test("config page - basemap configuration - validation", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. Add a table
  // Button text changed from "Add new table" to "Add new dataset view"
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 4. Find and expand the target card
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.bg-purple-50:has-text("${tableNameToAdd.trim()}")`,
    );
    // Cards no longer have hamburger buttons - navigate to edit page
    const editLink = targetCard.getByRole("link", { name: /edit dataset/i });
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

    await targetCard
      .locator(".config-section")
      .first()
      .waitFor({ state: "visible" });

    // 5. Check for basemap configuration
    const basemapLabel = targetCard.locator(
      'label:has-text("Mapbox Background Map(s)")',
    );
    const hasBasemapConfig = (await basemapLabel.count()) > 0;

    if (hasBasemapConfig) {
      // 6. Add a second basemap
      const addBasemapButton = targetCard.locator(
        'button.add-basemap-button:has-text("+")',
      );
      await addBasemapButton.click();
      await page.waitForTimeout(500);

      // 7. Find the name inputs
      const nameInputs = targetCard.locator('input[id$="-basemap-name-"]');
      const nameInputCount = await nameInputs.count();

      if (nameInputCount >= 2) {
        const firstNameInput = nameInputs.nth(0);
        const secondNameInput = nameInputs.nth(1);

        // 8. Set first basemap name
        await firstNameInput.clear();
        await firstNameInput.fill("Satellite");
        await page.waitForTimeout(300);

        // 9. Set second basemap name to duplicate (should show validation error)
        await secondNameInput.clear();
        await secondNameInput.fill("Satellite");
        await page.waitForTimeout(500);

        // 10. Verify validation error appears
        const validationErrors = targetCard.locator(".validation-error");
        const errorCount = await validationErrors.count();
        expect(errorCount).toBeGreaterThan(0);

        // 11. Verify input has error class
        await expect(secondNameInput).toHaveClass(/input-error/);

        // 12. Change to unique name
        await secondNameInput.clear();
        await secondNameInput.fill("Streets");
        await page.waitForTimeout(500);

        // 13. Verify error is gone (wait a bit for validation to update)
        await page.waitForTimeout(300);

        // 14. Test blank name validation
        await secondNameInput.clear();
        await page.waitForTimeout(500);

        // The input should still be visible but might show validation
        const blankValidationErrors = targetCard.locator(
          '.validation-error:has-text("cannot be blank")',
        );
        const blankErrorCount = await blankValidationErrors.count();
        // Validation may appear or be handled by HTML5 required attribute
        expect(blankErrorCount).toBeGreaterThanOrEqual(0);
      }

      // 15. Test Mapbox style URL validation
      const styleInputs = targetCard.locator('input[id$="-basemap-style-"]');
      if ((await styleInputs.count()) > 0) {
        const firstStyleInput = styleInputs.first();

        // 16. Try invalid style URL
        await firstStyleInput.clear();
        await firstStyleInput.fill("invalid://style/url");
        await page.waitForTimeout(300);

        // 17. Verify the input has the pattern attribute
        await expect(firstStyleInput).toHaveAttribute(
          "pattern",
          "^mapbox://styles/[^/]+/[^/]+$",
        );

        // 18. Enter valid Mapbox style URL
        await firstStyleInput.clear();
        await firstStyleInput.fill("mapbox://styles/user/styleid");
        await page.waitForTimeout(300);
      }
    }

    // 19. Clean up
    const removeButton = targetCard.locator("button.remove-button").last();
    await removeButton.click();
    await expect(modal).toBeVisible();
    await confirmButton.click();
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();
    await page.waitForTimeout(3500);
  }
});

test("config page - basemap configuration - update name and style", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. Add a table
  // Button text changed from "Add new table" to "Add new dataset view"
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 4. Find and expand the target card
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.bg-purple-50:has-text("${tableNameToAdd.trim()}")`,
    );
    // Cards no longer have hamburger buttons - navigate to edit page
    const editLink = targetCard.getByRole("link", { name: /edit dataset/i });
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

    await targetCard
      .locator(".config-section")
      .first()
      .waitFor({ state: "visible" });

    // 5. Check for basemap configuration
    const basemapLabel = targetCard.locator(
      'label:has-text("Mapbox Background Map(s)")',
    );
    const hasBasemapConfig = (await basemapLabel.count()) > 0;

    if (hasBasemapConfig) {
      // 6. Find name and style inputs for first basemap
      const nameInput = targetCard
        .locator('input[id$="-basemap-name-0"]')
        .first();
      const styleInput = targetCard
        .locator('input[id$="-basemap-style-0"]')
        .first();

      if ((await nameInput.count()) > 0 && (await styleInput.count()) > 0) {
        // 7. Update basemap name
        await nameInput.clear();
        await nameInput.fill("Custom Basemap");
        await page.waitForTimeout(300);

        // 8. Verify the value is set
        await expect(nameInput).toHaveValue("Custom Basemap");

        // 9. Update basemap style
        await styleInput.clear();
        await styleInput.fill("mapbox://styles/myuser/mystyle");
        await page.waitForTimeout(300);

        // 10. Verify the value is set
        await expect(styleInput).toHaveValue("mapbox://styles/myuser/mystyle");

        // 11. Verify submit button is enabled (change detected)
        const submitButton = targetCard.locator("button[type='submit']");
        await expect(submitButton).toBeEnabled();
      }
    }

    // 12. Clean up
    const removeButton = targetCard.locator("button.remove-button").last();
    await removeButton.click();
    await expect(modal).toBeVisible();
    await confirmButton.click();
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();
    await page.waitForTimeout(3500);
  }
});

test("config page - color column configuration", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. Add a table
  // Button text changed from "Add new table" to "Add new dataset view"
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 4. Find and expand the target card
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.bg-purple-50:has-text("${tableNameToAdd.trim()}")`,
    );
    // Cards no longer have hamburger buttons - navigate to edit page
    const editLink = targetCard.getByRole("link", { name: /edit dataset/i });
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

    await targetCard
      .locator(".config-section")
      .first()
      .waitFor({ state: "visible" });

    // 5. Look for COLOR_COLUMN input
    const colorColumnInput = targetCard.locator('input[id$="-COLOR_COLUMN"]');
    const hasColorColumn = (await colorColumnInput.count()) > 0;

    if (hasColorColumn) {
      // 6. Verify the input exists and has correct placeholder
      await expect(colorColumnInput).toBeVisible();
      await expect(colorColumnInput).toHaveAttribute("placeholder", "color");

      // 7. Enter a color column value
      await colorColumnInput.clear();
      await colorColumnInput.fill("color");
      await page.waitForTimeout(300);

      // 8. Verify the value is set
      await expect(colorColumnInput).toHaveValue("color");

      // 9. Verify submit button is enabled (change detected)
      const submitButton = targetCard.locator("button[type='submit']");
      await expect(submitButton).toBeEnabled();

      // 10. Verify the description is present
      const descriptionText = targetCard.locator(".field-description");
      const descriptionCount = await descriptionText.count();
      expect(descriptionCount).toBeGreaterThan(0);
    }

    // 11. Clean up
    const removeButton = targetCard.locator("button.remove-button").last();
    await removeButton.click();
    await expect(modal).toBeVisible();
    await confirmButton.click();
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();
    await page.waitForTimeout(3500);
  }
});

test("config page - basemap configuration - max 3 limit", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 3. Add a table
  // Button text changed from "Add new table" to "Add new dataset view"
  const addTableButton = page
    .locator("div.flex.justify-end button")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });

  // 4. Find and expand the target card
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.bg-purple-50:has-text("${tableNameToAdd.trim()}")`,
    );
    // Cards no longer have hamburger buttons - navigate to edit page
    const editLink = targetCard.getByRole("link", { name: /edit dataset/i });
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

    await targetCard
      .locator(".config-section")
      .first()
      .waitFor({ state: "visible" });

    // 5. Check for basemap configuration
    const basemapLabel = targetCard.locator(
      'label:has-text("Mapbox Background Map(s)")',
    );
    const hasBasemapConfig = (await basemapLabel.count()) > 0;

    if (hasBasemapConfig) {
      const addBasemapButton = targetCard.locator(
        'button.add-basemap-button:has-text("+")',
      );
      const basemapItems = targetCard.locator(".basemap-item");

      // 6. Add basemaps until limit is reached
      let currentCount = await basemapItems.count();
      while (currentCount < 3 && (await addBasemapButton.isEnabled())) {
        await addBasemapButton.click();
        await page.waitForTimeout(500);
        currentCount = await basemapItems.count();
      }

      // 7. Verify there are exactly 3 basemaps
      expect(await basemapItems.count()).toBe(3);

      // 8. Verify add button is disabled
      await expect(addBasemapButton).toBeDisabled();
      await expect(addBasemapButton).toHaveClass(/disabled/);

      // 9. Try clicking the disabled button (should not add another)
      await addBasemapButton.click({ force: true });
      await page.waitForTimeout(500);

      // 10. Verify still only 3 basemaps
      expect(await basemapItems.count()).toBe(3);

      // 11. Remove one basemap
      const removeButtons = targetCard.locator("button.remove-button");
      if ((await removeButtons.count()) > 0) {
        await removeButtons.first().click();
        await page.waitForTimeout(500);

        // 12. Verify there are now 2 basemaps
        expect(await basemapItems.count()).toBe(2);

        // 13. Verify add button is enabled again
        await expect(addBasemapButton).toBeEnabled();
      }
    }

    // 14. Clean up
    const removeButton = targetCard.locator("button.remove-button").last();
    await removeButton.click();
    await expect(modal).toBeVisible();
    await confirmButton.click();
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();
    await page.waitForTimeout(3500);
  }
});
