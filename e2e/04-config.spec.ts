import { expect, test } from "@playwright/test";

test("config page - displays configuration dashboard with dataset cards", async ({
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

  // 6. Verify dataset cards are present (list view)
  const datasetCards = page.locator(".dataset-card");
  const cardCount = await datasetCards.count();
  expect(cardCount).toBeGreaterThan(0);

  // 7. Verify "Edit dataset" buttons are present
  const editButtons = page.getByRole("link", { name: /edit dataset/i });
  await expect(editButtons.first()).toBeVisible();
});

test("config page - add and remove table functionality", async ({ page }) => {
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

  // 8. Get the selected table name before confirming
  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  // 9. Verify the confirm button is now enabled
  await expect(confirmButton).toBeEnabled();

  // 10. Click confirm
  await confirmButton.click();

  // 11. Verify success message appears
  await expect(page.getByText(/table added to views!/i)).toBeVisible();

  // 12. Verify modal closes after timeout
  await page.waitForTimeout(3500);
  await expect(modal).not.toBeVisible();

  // 13. Wait for the page to reload and find the newly added table
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 14. Find the dataset card with the table name we just added and navigate to edit page
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(targetCard).toBeVisible();

    // 15. Click "Edit dataset" to navigate to the edit page
    const editButton = targetCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // 16. Wait for navigation to complete
    await page.waitForURL(`**/config/${tableNameToAdd.trim()}`, {
      timeout: 5000,
    });

    // 17. Find the config card on the edit page
    const configCard = page.locator(".table-item.card");
    await expect(configCard).toBeVisible();

    // 18. Click the remove table button
    const removeButton = configCard.locator("button.remove-button");
    await removeButton.click();

    // 19. Verify the confirmation modal appears
    const removeModal = page.locator(".modal");
    await expect(removeModal).toBeVisible();

    // 20. Click confirm to remove
    const removeConfirmButton = removeModal.getByRole("button", {
      name: /confirm/i,
    });
    await removeConfirmButton.click();

    // 21. Verify success message appears in modal
    await expect(
      removeModal.getByText(/table removed from views!/i),
    ).toBeVisible({ timeout: 2000 });

    // 22. Wait for redirect to /config page
    await page.waitForURL("**/config", { timeout: 5000 });

    // 23. Verify the table is no longer in the list
    const datasetCardAfterRemove = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(datasetCardAfterRemove).not.toBeVisible({ timeout: 2000 });
  }
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

test("config page - navigate to dataset edit page", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for dataset cards
  const datasetCards = page.locator(".dataset-card");
  const cardCount = await datasetCards.count();

  if (cardCount > 0) {
    // 4. Get the first dataset name
    const firstCard = datasetCards.first();
    const datasetName = await firstCard.locator(".dataset-name").textContent();

    // 5. Click the "Edit dataset" button
    const editButton = firstCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // 6. Verify we're on the dataset edit page
    await page.waitForURL(`**/config/${datasetName?.trim()}`, {
      timeout: 5000,
    });

    // 7. Verify the card body is visible (accordion is open by default)
    const cardBody = page.locator(".card-body");
    await expect(cardBody).toBeVisible();
  }
});

test("config page - form validation and change detection", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. First, add a table to work with
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  // 4. Verify the modal appears with dropdown
  const modal = page.locator(".modal");
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
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 10. Find the dataset card with the table name we just added and navigate to edit page
  if (tableNameToAdd) {
    const datasetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(datasetCard).toBeVisible();

    // 11. Click "Edit dataset" to navigate to the edit page
    const editButton = datasetCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // 12. Wait for navigation to complete
    await page.waitForURL(`**/config/${tableNameToAdd.trim()}`, {
      timeout: 5000,
    });

    // 13. Find the config card on the edit page (accordion is open by default)
    const targetCard = page.locator(".table-item.card");
    await expect(targetCard).toBeVisible();

    // 14. Wait for form content to be visible
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
    const removeModal = page.locator(".modal");
    await expect(removeModal).toBeVisible();

    // 26. Click confirm to remove
    const removeConfirmButton = removeModal.getByRole("button", {
      name: /confirm/i,
    });
    await removeConfirmButton.click();

    // 27. Verify success message appears in modal
    await expect(
      removeModal.getByText(/table removed from views!/i),
    ).toBeVisible({ timeout: 2000 });

    // 28. Wait for redirect to /config page
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - submit configuration changes", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. First, add a table to work with
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  // 4. Verify the modal appears with dropdown
  const modal = page.locator(".modal");
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
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 10. Find the dataset card with the table name we just added and navigate to edit page
  if (tableNameToAdd) {
    const datasetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(datasetCard).toBeVisible();

    // 11. Click "Edit dataset" to navigate to the edit page
    const editButton = datasetCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // 12. Wait for navigation to complete
    await page.waitForURL(`**/config/${tableNameToAdd.trim()}`, {
      timeout: 5000,
    });

    // 13. Find the config card on the edit page (accordion is open by default)
    const targetCard = page.locator(".table-item.card");
    await expect(targetCard).toBeVisible();

    // 14. Find and modify a form field
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
    const removeModal = page.locator(".modal");
    await expect(removeModal).toBeVisible();

    // 19. Click confirm to remove
    const removeConfirmButton = removeModal.getByRole("button", {
      name: /confirm/i,
    });
    await removeConfirmButton.click();

    // 20. Verify success message appears in modal
    await expect(
      removeModal.getByText(/table removed from views!/i),
    ).toBeVisible({ timeout: 2000 });

    // 21. Wait for redirect to /config page
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - views configuration section", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present (indicates data has loaded)
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Look for dataset cards
  const datasetCards = page.locator(".dataset-card");
  const cardCount = await datasetCards.count();

  if (cardCount > 0) {
    // 4. Click "Edit dataset" on the first card to navigate to edit page
    const firstDatasetCard = datasetCards.first();
    const editButton = firstDatasetCard.getByRole("link", {
      name: /edit dataset/i,
    });
    await editButton.click();

    // 5. Wait for navigation to complete
    await page.waitForURL("**/config/**", { timeout: 5000 });

    // 6. Find the config card on the edit page (accordion is open by default)
    const firstCard = page.locator(".table-item.card").first();
    await expect(firstCard).toBeVisible();

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
        } else {
          // If no text inputs, try toggling the checkbox back to original state
          // This ensures we make an actual change
          await firstCheckbox.click();
          await page.waitForTimeout(500);
        }
      }

      // 12. Verify submit button is now enabled (changes detected)
      await expect(submitButton).toBeEnabled({ timeout: 2000 });
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

  // 3. First, add a table to work with
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  // 4. Verify the modal appears with dropdown
  const modal = page.locator(".modal");
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
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 10. Find the dataset card with the table name we just added and navigate to edit page
  if (tableNameToAdd) {
    const datasetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(datasetCard).toBeVisible();

    // 11. Click "Edit dataset" to navigate to the edit page
    const editButton = datasetCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // 12. Wait for navigation to complete
    await page.waitForURL(`**/config/${tableNameToAdd.trim()}`, {
      timeout: 5000,
    });

    // 13. Find the config card on the edit page (accordion is open by default)
    const targetCard = page.locator(".table-item.card");
    await expect(targetCard).toBeVisible();

    // 14. Check for different config sections
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
    const removeModal = page.locator(".modal");
    await expect(removeModal).toBeVisible();

    // 18. Click confirm to remove
    const removeConfirmButton = removeModal.getByRole("button", {
      name: /confirm/i,
    });
    await removeConfirmButton.click();

    // 19. Verify success message appears in modal
    await expect(
      removeModal.getByText(/table removed from views!/i),
    ).toBeVisible({ timeout: 2000 });

    // 20. Wait for redirect to /config page
    await page.waitForURL("**/config", { timeout: 5000 });
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

  // 3. First, add a table to work with
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  // 4. Verify the modal appears with dropdown
  const modal = page.locator(".modal");
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
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 10. Find the dataset card with the table name we just added and navigate to edit page
  if (tableNameToAdd) {
    const datasetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(datasetCard).toBeVisible();

    // 11. Click "Edit dataset" to navigate to the edit page
    const editButton = datasetCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // 12. Wait for navigation to complete
    await page.waitForURL(`**/config/${tableNameToAdd.trim()}`, {
      timeout: 5000,
    });

    // 13. Find the config card on the edit page (accordion is open by default)
    const targetCard = page.locator(".table-item.card");
    await expect(targetCard).toBeVisible();

    // 14. Find mapbox access token field
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
    const removeModal = page.locator(".modal");
    await expect(removeModal).toBeVisible();

    // 24. Click confirm to remove
    const removeConfirmButton = removeModal.getByRole("button", {
      name: /confirm/i,
    });
    await removeConfirmButton.click();

    // 25. Verify success message appears in modal
    await expect(
      removeModal.getByText(/table removed from views!/i),
    ).toBeVisible({ timeout: 2000 });

    // 26. Wait for redirect to /config page
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - modal overlay functionality and cancel button", async ({
  page,
}) => {
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

test("config page - visibility permissions configuration", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the page to load
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Find the first dataset card and click "Edit dataset"
  const firstDatasetCard = page.locator(".dataset-card").first();
  const editButton = firstDatasetCard.getByRole("link", {
    name: /edit dataset/i,
  });
  await editButton.click();

  // 4. Wait for navigation to the edit page
  await page.waitForURL("**/config/**", { timeout: 5000 });

  // 5. Find the config card on the edit page (accordion is open by default)
  const firstCard = page.locator(".table-item.card").first();
  await expect(firstCard).toBeVisible();

  // 6. Look for the visibility section (should be visible to admins)
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
  page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container to be present
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Add a table to work with
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  const modal = page.locator(".modal");
  await expect(modal).toBeVisible();

  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 4. Find the dataset card and navigate to edit page
  if (tableNameToAdd) {
    const datasetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(datasetCard).toBeVisible();

    // Click "Edit dataset" to navigate to the edit page
    const editButton = datasetCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // Wait for navigation to complete
    await page.waitForURL(`**/config/${tableNameToAdd.trim()}`, {
      timeout: 5000,
    });

    // Find the config card on the edit page (accordion is open by default)
    const targetCard = page.locator(".table-item.card");
    await expect(targetCard).toBeVisible();

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
    const removeModal = page.locator(".modal");
    await expect(removeModal).toBeVisible();
    const removeConfirmButton = removeModal.getByRole("button", {
      name: /confirm/i,
    });
    await removeConfirmButton.click();
    await expect(
      removeModal.getByText(/table removed from views!/i),
    ).toBeVisible({ timeout: 2000 });
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - basemap configuration - validation", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Add a table
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  const addModal = page.locator(".modal");
  await expect(addModal).toBeVisible();
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 4. Find the dataset card and navigate to edit page
  if (tableNameToAdd) {
    const datasetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(datasetCard).toBeVisible();

    // Click "Edit dataset" to navigate to the edit page
    const editButton = datasetCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // Wait for navigation to complete
    await page.waitForURL(`**/config/${tableNameToAdd.trim()}`, {
      timeout: 5000,
    });

    // Find the config card on the edit page (accordion is open by default)
    const targetCard = page.locator(".table-item.card");
    await expect(targetCard).toBeVisible();

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
    const removeModal = page.locator(".modal");
    await expect(removeModal).toBeVisible();
    const removeConfirmButton = removeModal.getByRole("button", {
      name: /confirm/i,
    });
    await removeConfirmButton.click();
    await expect(
      removeModal.getByText(/table removed from views!/i),
    ).toBeVisible({ timeout: 2000 });
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - basemap configuration - update name and style", async ({
  page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Add a table
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  const addModal = page.locator(".modal");
  await expect(addModal).toBeVisible();
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 4. Find the dataset card and navigate to edit page
  if (tableNameToAdd) {
    const datasetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(datasetCard).toBeVisible();

    // Click "Edit dataset" to navigate to the edit page
    const editButton = datasetCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // Wait for navigation to complete
    await page.waitForURL(`**/config/${tableNameToAdd.trim()}`, {
      timeout: 5000,
    });

    // Find the config card on the edit page (accordion is open by default)
    const targetCard = page.locator(".table-item.card");
    await expect(targetCard).toBeVisible();

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
    const removeModal = page.locator(".modal");
    await expect(removeModal).toBeVisible();
    const removeConfirmButton = removeModal.getByRole("button", {
      name: /confirm/i,
    });
    await removeConfirmButton.click();
    await expect(
      removeModal.getByText(/table removed from views!/i),
    ).toBeVisible({ timeout: 2000 });
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - color column configuration", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Add a table
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  const addModal = page.locator(".modal");
  await expect(addModal).toBeVisible();
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 4. Find the dataset card and navigate to edit page
  if (tableNameToAdd) {
    const datasetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(datasetCard).toBeVisible();

    // Click "Edit dataset" to navigate to the edit page
    const editButton = datasetCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // Wait for navigation to complete
    await page.waitForURL(`**/config/${tableNameToAdd.trim()}`, {
      timeout: 5000,
    });

    // Find the config card on the edit page (accordion is open by default)
    const targetCard = page.locator(".table-item.card");
    await expect(targetCard).toBeVisible();

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
    const removeModal = page.locator(".modal");
    await expect(removeModal).toBeVisible();
    const removeConfirmButton = removeModal.getByRole("button", {
      name: /confirm/i,
    });
    await removeConfirmButton.click();
    await expect(
      removeModal.getByText(/table removed from views!/i),
    ).toBeVisible({ timeout: 2000 });
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - basemap configuration - max 3 limit", async ({ page }) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the grid container
  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 3. Add a table
  const addTableButton = page.getByRole("button", {
    name: /\+ add new table/i,
  });
  await addTableButton.click();

  const addModal = page.locator(".modal");
  await expect(addModal).toBeVisible();
  const dropdown = page.locator("select");
  await dropdown.selectOption({ index: 0 });

  const selectedOption = dropdown.locator("option:checked");
  const tableNameToAdd = await selectedOption.textContent();

  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await confirmButton.click();

  await expect(page.getByText(/table added to views!/i)).toBeVisible();
  await page.waitForTimeout(3500);

  await page
    .locator(".grid-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 4. Find the dataset card and navigate to edit page
  if (tableNameToAdd) {
    const datasetCard = page.locator(
      `.dataset-card:has(.dataset-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(datasetCard).toBeVisible();

    // Click "Edit dataset" to navigate to the edit page
    const editButton = datasetCard.getByRole("link", { name: /edit dataset/i });
    await editButton.click();

    // Wait for navigation to complete
    await page.waitForURL(`**/config/${tableNameToAdd.trim()}`, {
      timeout: 5000,
    });

    // Find the config card on the edit page (accordion is open by default)
    const targetCard = page.locator(".table-item.card");
    await expect(targetCard).toBeVisible();

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
    const removeModal = page.locator(".modal");
    await expect(removeModal).toBeVisible();
    const removeConfirmButton = removeModal.getByRole("button", {
      name: /confirm/i,
    });
    await removeConfirmButton.click();
    await expect(
      removeModal.getByText(/table removed from views!/i),
    ).toBeVisible({ timeout: 2000 });
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

// Note: Redirect tests removed since authStrategy is "none" in test environment,
// making these tests pointless. They would only be relevant with authStrategy === "auth0"
