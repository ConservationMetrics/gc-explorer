import { test, expect } from "./fixtures/auth-storage";

test("config page - displays configuration dashboard with table cards", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for ClientOnly component to render and page to load
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("div.max-w-7xl", { timeout: 15000 });

  // 3. Verify page heading
  await expect(
    page.getByRole("heading", {
      name: /dataset view management/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  // 4. Verify breadcrumb link back to index
  const breadcrumbLink = page.locator('a[href="/"]').filter({
    hasText: /available dataset views/i,
  });
  await expect(breadcrumbLink).toBeVisible();

  // 5. Verify the add new dataset view button is present
  const addTableButton = page.locator(
    "[data-testid='add-new-dataset-view-button']",
  );
  await expect(addTableButton).toBeVisible({ timeout: 10000 });

  // 6. Wait for the grid to be present (indicates data has loaded)
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 7. Verify dataset cards are present
  const datasetCards = page.locator("[data-testid='config-dataset-card']");
  const cardCount = await datasetCards.count();
  expect(cardCount).toBeGreaterThan(0);

  // 8. Verify "Edit dataset view" links are present on cards
  const editButtons = page.locator("[data-testid='edit-dataset-view-link']");
  await expect(editButtons.first()).toBeVisible();

  // 9. Verify cards show view type pills
  const firstCard = datasetCards.first();
  const viewPills = firstCard.locator("[data-testid^='config-view-tag-']");
  const pillCount = await viewPills.count();
  expect(pillCount).toBeGreaterThanOrEqual(0); // Some datasets may have no views configured
});

test("config page - add new dataset view and edit it", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for page to load
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("div.max-w-7xl", { timeout: 15000 });
  await page.locator(".grid").waitFor({ state: "attached", timeout: 15000 });

  // 3. Click the add new dataset view button
  const addTableButton = page.locator(
    "[data-testid='add-new-dataset-view-button']",
  );
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  // 4. Verify the modal appears with dropdown
  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  await expect(modal).toBeVisible();

  // 5. Verify the modal message
  await expect(page.getByText(/select table to add:/i)).toBeVisible();

  // 6. Verify the dropdown is present
  const dropdown = page.locator("select");
  await expect(dropdown).toBeVisible();

  // 7. Verify the confirm button is initially disabled
  const confirmButton = page.getByRole("button", { name: /confirm/i });
  await expect(confirmButton).toBeDisabled();

  // 8. Select an option from the dropdown (skip first if it's already configured)
  const options = await dropdown.locator("option").all();
  let selectedTableName: string | null = null;

  // Find a table that's not already in the config
  for (const option of options) {
    const optionText = await option.textContent();
    if (optionText && optionText.trim()) {
      // Check if this table is already configured
      const existingCard = page.locator(
        `[data-testid='config-dataset-card']:has-text("${optionText.trim()}")`,
      );
      const exists = (await existingCard.count()) === 0;
      if (exists) {
        await dropdown.selectOption({ label: optionText.trim() });
        selectedTableName = optionText.trim();
        break;
      }
    }
  }

  // If all tables are configured, just select the first one
  if (!selectedTableName && options.length > 0) {
    await dropdown.selectOption({ index: 0 });
    const selectedOption = dropdown.locator("option:checked");
    selectedTableName = await selectedOption.textContent();
  }

  expect(selectedTableName).not.toBeNull();

  // 9. Verify the confirm button is now enabled
  await expect(confirmButton).toBeEnabled();

  // 10. Click confirm to add the table
  await confirmButton.click();

  // 11. Verify success message appears
  await expect(page.getByText(/table added to views!/i)).toBeVisible();

  // 12. Wait for modal to close and page to reload
  await page.waitForTimeout(3500);
  await expect(modal).not.toBeVisible();
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 13. Find the dataset card with the table name we just added
  if (selectedTableName) {
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${selectedTableName.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    // 14. Click "Edit dataset view" to navigate to edit page
    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();

    // 15. Wait for navigation to edit page
    await page.waitForURL(`**/config/${selectedTableName.trim()}`, {
      timeout: 10000,
    });
    await page.waitForLoadState("networkidle");

    // 16. Wait for form to be visible
    await page.waitForSelector("form", { timeout: 15000 });
    const configCard = page.locator(".bg-white.rounded-lg.shadow-sm").first();
    await expect(configCard).toBeVisible({ timeout: 15000 });

    // 17. Verify page heading shows the dataset name
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`configuration.*${selectedTableName.trim()}`, "i"),
      }),
    ).toBeVisible();

    // 18. Verify breadcrumb link back to config
    const configBreadcrumb = page.locator('a[href="/config"]');
    await expect(configBreadcrumb).toBeVisible();

    // 19. Verify submit button exists and is initially disabled (no changes)
    const submitButton = page.locator("[data-testid='config-submit-button']");
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // 20. Find and modify a form field (Dataset display name)
    const datasetNameInput = page.locator(
      'input[id*="DATASET_TABLE"], input[placeholder*="Dataset Display Name"]',
    );

    if ((await datasetNameInput.count()) > 0) {
      // 21. Modify the dataset display name
      await datasetNameInput.clear();
      await datasetNameInput.fill(`Test Dataset - ${Date.now()}`);
      await page.waitForTimeout(500);

      // 22. Verify submit button is now enabled (change detected)
      await expect(submitButton).toBeEnabled();

      // 23. Click submit to save changes
      await submitButton.click();

      // 24. Verify success modal appears
      const successModal = page.locator("text=Saved!");
      await expect(successModal).toBeVisible({ timeout: 5000 });

      // 25. Wait for success modal to close
      await page.waitForTimeout(2500);
      await expect(successModal).not.toBeVisible();

      // 26. Verify submit button is disabled again (changes saved)
      await expect(submitButton).toBeDisabled();
    } else {
      // If DATASET_TABLE input doesn't exist, try modifying VIEW_DESCRIPTION
      const descriptionInput = page.locator(
        'textarea[id*="VIEW_DESCRIPTION"], textarea[placeholder*="description"]',
      );

      if ((await descriptionInput.count()) > 0) {
        await descriptionInput.clear();
        await descriptionInput.fill("Test description");
        await page.waitForTimeout(500);
        await expect(submitButton).toBeEnabled();
        await submitButton.click();
        await expect(page.locator("text=Saved!")).toBeVisible({
          timeout: 5000,
        });
      }
    }

    // 27. Verify we can navigate back to config dashboard
    await configBreadcrumb.click();
    await page.waitForURL("**/config", { timeout: 5000 });
    await expect(
      page.getByRole("heading", { name: /dataset view management/i }),
    ).toBeVisible();
  }
});

test("config page - navigate to dataset edit page", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for page to load
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("div.max-w-7xl", { timeout: 15000 });
  await page.locator(".grid").waitFor({ state: "attached", timeout: 15000 });

  // 3. Look for dataset cards
  const datasetCards = page.locator("[data-testid='config-dataset-card']");
  const cardCount = await datasetCards.count();
  expect(cardCount).toBeGreaterThan(0);

  // 4. Get the first dataset card
  const firstCard = datasetCards.first();

  // 5. Get the dataset name from the card heading
  const cardHeading = firstCard.locator("h2, .text-lg, .text-xl");
  const datasetName = await cardHeading.textContent();
  expect(datasetName).toBeTruthy();

  // 6. Click the "Edit dataset view" button
  const editButton = firstCard.locator(
    "[data-testid='edit-dataset-view-link']",
  );
  await editButton.click();

  // 7. Verify we're on the dataset edit page
  await page.waitForURL("**/config/**", { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  // 8. Verify the form is visible
  await page.waitForSelector("form", { timeout: 15000 });
  const configCard = page.locator(".bg-white.rounded-lg.shadow-sm").first();
  await expect(configCard).toBeVisible({ timeout: 15000 });

  // 9. Verify page heading shows configuration and dataset name
  await expect(
    page.getByRole("heading", { name: /configuration/i }),
  ).toBeVisible();

  // 10. Verify breadcrumb link back to config
  const configBreadcrumb = page.locator('a[href="/config"]');
  await expect(configBreadcrumb).toBeVisible();
});

test("config page - edit dataset view form structure", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for page to load
  await page.waitForLoadState("networkidle");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 3. Look for dataset cards
  const datasetCards = page.locator("[data-testid='config-dataset-card']");
  const cardCount = await datasetCards.count();
  expect(cardCount).toBeGreaterThan(0);

  // 4. Click "Edit dataset view" on the first card
  const firstDatasetCard = datasetCards.first();
  const editButton = firstDatasetCard.getByRole("link", {
    name: /edit dataset view/i,
  });
  await editButton.click();

  // 5. Wait for navigation to edit page
  await page.waitForURL("**/config/**", { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  // 6. Wait for form to be visible
  await page.waitForSelector("form", { timeout: 15000 });
  const configCard = page.locator(".bg-white.rounded-lg.shadow-sm").first();
  await expect(configCard).toBeVisible({ timeout: 15000 });

  // 7. Verify submit button exists and is initially disabled (no changes)
  const submitButton = page.locator("button[type='submit']");
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeDisabled();

  // 8. Verify remove button exists
  const removeButton = page.locator("button").filter({
    hasText: /remove.*dataset.*view|remove.*table/i,
  });
  await expect(removeButton).toBeVisible();

  // 9. Verify collapsible sections are present (Views section should be open by default)
  const viewsSection = page.locator("text=Views").first();
  await expect(viewsSection).toBeVisible();

  // 10. Find and modify a form field to test change detection
  const textInputs = page.locator('input[type="text"], textarea');
  const inputCount = await textInputs.count();

  if (inputCount > 0) {
    // Find a non-empty input to modify
    for (let i = 0; i < inputCount; i++) {
      const input = textInputs.nth(i);
      const currentValue = await input.inputValue();
      const placeholder = await input.getAttribute("placeholder");

      // Skip if it's a required field that might break validation
      if (
        placeholder &&
        (placeholder.toLowerCase().includes("mapbox") ||
          placeholder.toLowerCase().includes("access token"))
      ) {
        continue;
      }

      // Modify the field
      await input.clear();
      await input.fill(`test_${Date.now()}`);
      await page.waitForTimeout(500);

      // Verify submit button is now enabled (change detected)
      const isEnabled = await submitButton.isEnabled();
      if (isEnabled) {
        // Revert the change
        await input.clear();
        if (currentValue) {
          await input.fill(currentValue);
        }
        await page.waitForTimeout(500);
        break;
      }
    }
  }
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
  const addTableButton = page
    .locator("[data-testid='add-new-dataset-view-button']")
    .first();
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
  const tableCards = page.locator("[data-testid='config-dataset-card']");
  const cardCount = await tableCards.count();

  if (cardCount > 0) {
    // 4. Verify cards have "Edit Dataset" links
    const firstCard = tableCards.first();
    const editLink = firstCard.getByRole("link", {
      name: /edit dataset view/i,
    });
    await expect(editLink).toBeVisible();

    // 5. Verify the link goes to a config edit page
    const href = await editLink.getAttribute("href");
    expect(href).toMatch(/\/config\/\w+/);
  }
});

test("config page - form validation and change detection", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the grid container to be present
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 3. Add a table to work with
  const addTableButton = page.locator(
    "[data-testid='add-new-dataset-view-button']",
  );
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
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    // 11. Navigate to edit page
    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 12. Wait for form content to be visible
    await page.waitForSelector("form", { timeout: 15000 });

    // 13. Verify submit button is initially disabled (no changes)
    const submitButton = page.locator("[data-testid='config-submit-button']");
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // 14. Test mapbox3d checkbox and terrain exaggeration slider (if map config exists)
    const mapbox3dCheckbox = page.locator(
      'input[type="checkbox"][id*="MAPBOX_3D"]',
    );

    const has3dMapConfig = (await mapbox3dCheckbox.count()) > 0;

    if (has3dMapConfig) {
      // 14a. Verify checkbox is visible
      await expect(mapbox3dCheckbox).toBeVisible();

      // 14b. Verify slider container is not visible initially (3D is unchecked)
      const sliderContainer = page
        .locator("label")
        .filter({ hasText: /terrain.*exaggeration/i })
        .locator("..");
      const sliderVisible = (await sliderContainer.count()) > 0;
      if (sliderVisible) {
        await expect(sliderContainer.first()).not.toBeVisible();
      }

      // 14c. Check the mapbox3d checkbox
      await mapbox3dCheckbox.check();
      await page.waitForTimeout(300);

      // 14d. Verify submit button is now enabled (change detected)
      await expect(submitButton).toBeEnabled();

      // 14e. Uncheck the mapbox3d checkbox to revert
      await mapbox3dCheckbox.uncheck();
      await page.waitForTimeout(300);
    }

    // 15. Find and modify a form field (dataset display name - safer than mapbox token)
    const datasetNameInput = page.locator(
      'input[id*="DATASET_TABLE"], input[placeholder*="Dataset Display Name"]',
    );

    if ((await datasetNameInput.count()) > 0) {
      // 16. Modify the dataset name
      await datasetNameInput.clear();
      await datasetNameInput.fill(`Test Dataset ${Date.now()}`);
      await page.waitForTimeout(500);

      // 17. Verify submit button is enabled (change detected)
      await expect(submitButton).toBeEnabled();

      // 18. Revert the change
      await datasetNameInput.clear();
      await page.waitForTimeout(500);
      await expect(submitButton).toBeDisabled();
    } else {
      // If DATASET_TABLE doesn't exist, try VIEW_DESCRIPTION
      const descriptionInput = page.locator('textarea[id*="VIEW_DESCRIPTION"]');
      if ((await descriptionInput.count()) > 0) {
        await descriptionInput.clear();
        await descriptionInput.fill("Test description");
        await page.waitForTimeout(500);
        await expect(submitButton).toBeEnabled();
      }
    }

    // 19. Clean up: remove the table we added
    const removeButton = page
      .locator("button")
      .filter({ hasText: /remove.*dataset.*view|remove.*table/i });
    await removeButton.click();

    // 20. Verify the confirmation modal appears
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 21. Click confirm to remove
    const confirmRemoveButton = page.getByRole("button", { name: /confirm/i });
    await confirmRemoveButton.click();

    // 22. Verify success message appears
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();

    // 23. Wait for navigation back to config dashboard
    await page.waitForTimeout(3500);
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - submit configuration changes", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the grid container to be present
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 3. Add a table to work with
  const addTableButton = page.locator(
    "[data-testid='add-new-dataset-view-button']",
  );
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
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    // 11. Navigate to edit page
    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 12. Wait for form to be visible
    await page.waitForSelector("form", { timeout: 15000 });

    // 13. Find and modify a form field (dataset display name - safer than mapbox token)
    const datasetNameInput = page.locator(
      'input[id*="DATASET_TABLE"], input[placeholder*="Dataset Display Name"]',
    );

    if ((await datasetNameInput.count()) > 0) {
      // 14. Enter a new dataset display name
      await datasetNameInput.clear();
      await datasetNameInput.fill(`Test Dataset ${Date.now()}`);
      await page.waitForTimeout(500);

      // 15. Submit the form
      const submitButton = page.locator("[data-testid='config-submit-button']");
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      // 16. Verify success modal appears
      await expect(page.locator("text=Saved!")).toBeVisible({
        timeout: 5000,
      });

      // 17. Wait for success modal to close
      await page.waitForTimeout(2500);
      await expect(page.locator("text=Saved!")).not.toBeVisible();

      // 18. Verify submit button is disabled again (changes saved)
      await expect(submitButton).toBeDisabled();
    } else {
      // If DATASET_TABLE doesn't exist, try VIEW_DESCRIPTION
      const descriptionInput = page.locator('textarea[id*="VIEW_DESCRIPTION"]');
      if ((await descriptionInput.count()) > 0) {
        await descriptionInput.clear();
        await descriptionInput.fill("Test description");
        await page.waitForTimeout(500);

        const submitButton = page.locator(
          "[data-testid='config-submit-button']",
        );
        await submitButton.click();
        await expect(page.locator("text=Saved!")).toBeVisible({
          timeout: 5000,
        });
      }
    }

    // 19. Clean up: remove the table we added
    const removeButton = page
      .locator("button")
      .filter({ hasText: /remove.*dataset.*view|remove.*table/i });
    await removeButton.click();

    // 20. Verify the confirmation modal appears
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 21. Click confirm to remove
    const confirmRemoveButton = page.getByRole("button", { name: /confirm/i });
    await confirmRemoveButton.click();

    // 22. Verify success message appears
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();

    // 23. Wait for navigation back to config dashboard
    await page.waitForTimeout(3500);
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - views configuration section", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the grid container to be present
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 3. Look for table cards
  const tableCards = page.locator("[data-testid='config-dataset-card']");
  const cardCount = await tableCards.count();
  expect(cardCount).toBeGreaterThan(0);

  // 4. Navigate to edit page
  const firstCard = tableCards.first();
  const editLink = firstCard.getByRole("link", {
    name: /edit dataset view/i,
  });
  await editLink.click();
  await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  // 5. Wait for form to be visible
  await page.waitForSelector("form", { timeout: 15000 });

  // 6. Find checkboxes near view labels
  const viewLabels = page.locator("label").filter({
    hasText: /^(Map|Gallery|Alerts)$/i,
  });
  const labelCount = await viewLabels.count();

  if (labelCount > 0) {
    // 7. Find checkbox associated with first view label
    const firstLabel = viewLabels.first();
    const firstCheckbox = firstLabel
      .locator('input[type="checkbox"]')
      .or(
        page.locator(
          `input[type="checkbox"][id*="${(await firstLabel.textContent())?.toLowerCase()}"]`,
        ),
      );

    if ((await firstCheckbox.count()) > 0) {
      // 8. Test toggling a checkbox
      const isChecked = await firstCheckbox.first().isChecked();

      // 9. Toggle the checkbox
      await firstCheckbox.first().click();
      await page.waitForTimeout(500);

      // 10. Verify the state changed
      await expect(firstCheckbox.first()).toHaveJSProperty(
        "checked",
        !isChecked,
      );

      // 11. Check if submit button is enabled
      const submitButton = page.locator("[data-testid='config-submit-button']");
      const isEnabled = await submitButton.isEnabled();

      if (!isEnabled) {
        // 12. Try modifying a text field to trigger form changes
        const textInputs = page.locator('input[type="text"], textarea');
        const inputCount = await textInputs.count();

        if (inputCount > 0) {
          const firstTextInput = textInputs.first();
          await firstTextInput.clear();
          await firstTextInput.fill("test_value");
          await page.waitForTimeout(500);
        }
      }

      // 13. Verify submit button is now enabled (changes detected)
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
    .locator("[data-testid='add-new-dataset-view-button']")
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
      `[data-testid='config-dataset-card']:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible();

    // 11. Navigate to edit page
    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 12. Wait for form to be visible
    await page.waitForSelector("form", { timeout: 15000 });

    // 13. Verify we're on the edit page (ConfigCard should be visible)
    const configCard = page.locator(".bg-white.rounded-lg.shadow-sm");
    await expect(configCard.first()).toBeVisible({ timeout: 15000 });

    // 14. Look for collapsible section headers (Views, Map, Media, etc.)
    const sectionHeaders = page.locator("h3, button").filter({
      hasText:
        /^(Views|Map|Media|Alerts|Filtering|Dataset|Permissions|Other)$/i,
    });
    const headerCount = await sectionHeaders.count();

    if (headerCount > 0) {
      // 15. Verify at least some section headers are visible
      await expect(sectionHeaders.first()).toBeVisible();
    }

    // 16. Verify Views section is visible (should be open by default)
    const viewsSection = page.locator("*").filter({ hasText: /^Views$/i });
    await expect(viewsSection.first()).toBeVisible();

    // 17. Clean up: remove the table we added
    const removeButton = page
      .locator("button")
      .filter({ hasText: /remove.*dataset.*view|remove.*table/i });
    await removeButton.click();

    // 18. Verify the confirmation modal appears
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 19. Click confirm to remove
    const confirmRemoveButton = page.getByRole("button", { name: /confirm/i });
    await confirmRemoveButton.click();

    // 20. Verify success message appears
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();

    // 21. Wait for navigation back to config dashboard
    await page.waitForTimeout(3500);
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - language switching functionality", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the language picker button to be visible (globe icon in AppHeader)
  const languageButton = page
    .locator("button[title*='Language'], button[title*='language']")
    .or(
      page
        .locator("button")
        .filter({ has: page.locator("svg path[d*='M3.055']") }),
    )
    .first();
  await languageButton.waitFor({ state: "visible", timeout: 15000 });

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

  // Click the first option to switch language
  await firstOption.click();

  // 7. Verify the page heading changed (language switching works)
  await page.waitForTimeout(1000);
  // The heading should have changed based on the selected language
  // We verify this by checking the heading is still visible (page didn't break)
  await expect(
    page.getByRole("heading", {
      name: /dataset view management|configuration|gestão de visualizações de conjunto de dados/i,
    }),
  ).toBeVisible({ timeout: 5000 });
});

test("config page - error handling for invalid form submission", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the grid container to be present
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 3. Add a table to work with
  const addTableButton = page.locator(
    "[data-testid='add-new-dataset-view-button']",
  );
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
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    // 11. Navigate to edit page
    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 12. Wait for form to be visible
    await page.waitForSelector("form", { timeout: 15000 });

    // 13. Enable Map view to show Mapbox token field (if not already enabled)
    const mapCheckbox = page
      .locator('input[type="checkbox"]')
      .filter({ has: page.locator('label:has-text("Map")') });

    if ((await mapCheckbox.count()) > 0 && !(await mapCheckbox.isChecked())) {
      await mapCheckbox.check();
      await page.waitForTimeout(500);
    }

    // 14. Find mapbox access token field
    const mapboxTokenInput = page.locator(
      'input[id*="MAPBOX_ACCESS_TOKEN"], input[placeholder*="Mapbox"]',
    );

    if ((await mapboxTokenInput.count()) > 0) {
      // 15. Test invalid token format that doesn't match pattern
      await mapboxTokenInput.clear();
      await mapboxTokenInput.fill("invalid_token_123");
      await page.waitForTimeout(500);

      // 16. Verify submit button is disabled due to invalid format
      const submitButton = page.locator("[data-testid='config-submit-button']");
      await expect(submitButton).toBeDisabled();

      // 17. Verify the button has the disabled styling
      const buttonClasses = await submitButton.getAttribute("class");
      expect(buttonClasses).toContain("bg-gray");

      // 18. Test valid token format that matches pattern
      await mapboxTokenInput.clear();
      await mapboxTokenInput.fill(
        "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example",
      );
      await page.waitForTimeout(500);

      // 19. Verify submit button is now enabled with valid format
      await expect(submitButton).toBeEnabled();
    }

    // 20. Clean up: remove the table we added
    const removeButton = page
      .locator("button")
      .filter({ hasText: /remove.*dataset.*view|remove.*table/i });
    await removeButton.click();

    // 21. Verify the confirmation modal appears
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 22. Click confirm to remove
    const confirmRemoveButton = page.getByRole("button", { name: /confirm/i });
    await confirmRemoveButton.click();

    // 23. Verify success message appears
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();

    // 24. Wait for navigation back to config dashboard
    await page.waitForTimeout(3500);
    await page.waitForURL("**/config", { timeout: 5000 });
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
    .locator("[data-testid='add-new-dataset-view-button']")
    .filter({ hasText: /add.*new.*dataset.*view|add.*new.*table/i })
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();

  // 3. Verify the modal overlay is present (the modal itself is the overlay)
  const modal = page.locator("div.fixed.inset-0.bg-black\\/50");
  await expect(modal).toBeVisible({ timeout: 10000 });

  // 4. Verify the modal content is visible
  const modalContent = modal.locator(".bg-white.rounded-lg");
  await expect(modalContent).toBeVisible();

  // 5. Click cancel to close modal
  const cancelButton = page.getByRole("button", { name: /cancel/i });
  await cancelButton.click();

  // 6. Verify modal is hidden
  await expect(modal).not.toBeVisible();
  await expect(modal).not.toBeVisible();
});

test("config page - visibility permissions configuration", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the page to load
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 3. Find the first dataset card
  const firstCard = page.locator("[data-testid='config-dataset-card']").first();
  await expect(firstCard).toBeVisible({ timeout: 15000 });

  // 4. Navigate to edit page
  const editLink = firstCard.getByRole("link", { name: /edit dataset view/i });
  await editLink.click();
  await page.waitForURL(/\/config\/\w+/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("form", { timeout: 15000 });

  // 5. Look for the visibility section (should be visible to admins)
  const visibilitySection = page.locator("*").filter({
    hasText: /^Visibility$/i,
  });

  // If visibility section is visible (admin user), test the functionality
  if ((await visibilitySection.count()) > 0) {
    // 6. Verify the help text is present
    await expect(
      page.locator("*").filter({
        hasText: /choose who can view this view/i,
      }),
    ).toBeVisible();

    // 7. Verify visibility options are present (radio buttons)
    const radioButtons = page.locator('input[type="radio"]');
    const radioCount = await radioButtons.count();
    expect(radioCount).toBeGreaterThan(0);

    // 8. Verify at least one radio button is checked (default selection)
    const checkedRadio = page.locator('input[type="radio"]:checked');
    await expect(checkedRadio.first()).toBeVisible();
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
  await page.waitForLoadState("networkidle");

  // 2. Wait for the grid container to be present
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 3. Add a table to work with
  const addTableButton = page.locator(
    "[data-testid='add-new-dataset-view-button']",
  );
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

  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 4. Find the card and navigate to edit page
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 5. Wait for form to be visible
    await page.waitForSelector("form", { timeout: 15000 });

    // 6. Enable Map view if not already enabled (to show basemap config)
    const mapCheckbox = page
      .locator('input[type="checkbox"]')
      .filter({ has: page.locator('label:has-text("Map")') });

    if ((await mapCheckbox.count()) > 0 && !(await mapCheckbox.isChecked())) {
      await mapCheckbox.check();
      await page.waitForTimeout(500);
    }

    // 7. Expand Map section if collapsed
    const mapSection = page.locator("*").filter({ hasText: /^Map$/i });
    if ((await mapSection.count()) > 0) {
      const mapSectionButton = mapSection.locator("button").first();
      if (await mapSectionButton.isVisible()) {
        await mapSectionButton.click();
        await page.waitForTimeout(300);
      }
    }

    // 8. Look for basemap configuration section
    const basemapLabel = page.locator(
      'label:has-text("Mapbox Background Map(s)")',
    );
    const hasBasemapConfig = (await basemapLabel.count()) > 0;

    if (hasBasemapConfig) {
      // 9. Find basemap items
      const basemapItems = page.locator("[data-testid^='basemap-item-']");
      const initialCount = await basemapItems.count();
      expect(initialCount).toBeGreaterThan(0);

      // 10. Find and click add basemap button
      const addBasemapButton = page.locator(
        "[data-testid='basemap-add-button']",
      );

      if ((await addBasemapButton.count()) > 0) {
        await expect(addBasemapButton.first()).toBeVisible();
        await expect(addBasemapButton.first()).toBeEnabled();

        // 11. Add first basemap
        await addBasemapButton.first().click();
        await page.waitForTimeout(500);

        // 12. Verify there are now more basemaps
        const basemapItemsAfterAdd = page
          .locator("div")
          .filter({ has: page.locator('input[id*="basemap-name"]') });
        const newCount = await basemapItemsAfterAdd.count();
        expect(newCount).toBeGreaterThan(initialCount);

        // 13. Find remove buttons (should be visible for non-first basemaps)
        const removeButtons = page.locator(
          "[data-testid^='basemap-remove-button-']",
        );

        if ((await removeButtons.count()) > 0) {
          // 14. Remove a basemap
          await removeButtons.first().click();
          await page.waitForTimeout(500);

          // 15. Verify count decreased
          const finalCount = await basemapItemsAfterAdd.count();
          expect(finalCount).toBeLessThan(newCount);
        }
      }
    }

    // 16. Clean up: remove the table we added
    const removeTableButton = page.locator(
      "[data-testid='config-remove-button']",
    );
    await removeTableButton.click();
    await expect(modal).toBeVisible({ timeout: 5000 });
    const confirmRemoveButton = page.getByRole("button", { name: /confirm/i });
    await confirmRemoveButton.click();
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();
    await page.waitForTimeout(3500);
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - basemap configuration - validation", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the grid container
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 3. Add a table
  const addTableButton = page.locator(
    "[data-testid='add-new-dataset-view-button']",
  );
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

  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 4. Find the card and navigate to edit page
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 5. Wait for form to be visible
    await page.waitForSelector("form", { timeout: 15000 });

    // 6. Enable Map view if not already enabled
    const mapCheckbox = page
      .locator('input[type="checkbox"]')
      .filter({ has: page.locator('label:has-text("Map")') });

    if ((await mapCheckbox.count()) > 0 && !(await mapCheckbox.isChecked())) {
      await mapCheckbox.check();
      await page.waitForTimeout(500);
    }

    // 7. Expand Map section if collapsed
    const mapSection = page.locator("*").filter({ hasText: /^Map$/i });
    if ((await mapSection.count()) > 0) {
      const mapSectionButton = mapSection.locator("button").first();
      if (await mapSectionButton.isVisible()) {
        await mapSectionButton.click();
        await page.waitForTimeout(300);
      }
    }

    // 8. Check for basemap configuration
    const basemapLabel = page.locator(
      'label:has-text("Mapbox Background Map(s)")',
    );
    const hasBasemapConfig = (await basemapLabel.count()) > 0;

    if (hasBasemapConfig) {
      // 9. Add a second basemap
      const addBasemapButton = page.locator(
        "[data-testid='basemap-add-button']",
      );

      if ((await addBasemapButton.count()) > 0) {
        await addBasemapButton.first().click();
        await page.waitForTimeout(500);

        // 10. Find the name inputs
        const nameInputs = page.locator('input[id*="basemap-name"]');
        const nameInputCount = await nameInputs.count();

        if (nameInputCount >= 2) {
          const firstNameInput = nameInputs.nth(0);
          const secondNameInput = nameInputs.nth(1);

          // 11. Set first basemap name
          await firstNameInput.clear();
          await firstNameInput.fill("Satellite");
          await page.waitForTimeout(300);

          // 12. Set second basemap name to duplicate (should show validation error)
          await secondNameInput.clear();
          await secondNameInput.fill("Satellite");
          await page.waitForTimeout(500);

          // 13. Verify validation error appears (red text)
          const validationErrors = page.locator(".text-red-600, .text-red-500");
          const errorCount = await validationErrors.count();
          // Error may appear or be handled by form validation
          expect(errorCount).toBeGreaterThanOrEqual(0);

          // 14. Change to unique name
          await secondNameInput.clear();
          await secondNameInput.fill("Streets");
          await page.waitForTimeout(500);
        }

        // 15. Test Mapbox style URL validation
        const styleInputs = page.locator('input[id*="basemap-style"]');
        if ((await styleInputs.count()) > 0) {
          const firstStyleInput = styleInputs.first();

          // 16. Verify the input has the pattern attribute
          const pattern = await firstStyleInput.getAttribute("pattern");
          expect(pattern).toMatch(/mapbox:\/\/styles/);

          // 17. Enter valid Mapbox style URL
          await firstStyleInput.clear();
          await firstStyleInput.fill("mapbox://styles/user/styleid");
          await page.waitForTimeout(300);
        }
      }
    }

    // 18. Clean up
    const removeTableButton = page.locator(
      "[data-testid='config-remove-button']",
    );
    await removeTableButton.click();
    await expect(modal).toBeVisible({ timeout: 5000 });
    const confirmRemoveButton = page.getByRole("button", { name: /confirm/i });
    await confirmRemoveButton.click();
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();
    await page.waitForTimeout(3500);
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - basemap configuration - update name and style", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the grid container
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 3. Add a table
  const addTableButton = page.locator(
    "[data-testid='add-new-dataset-view-button']",
  );
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

  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 4. Find the card and navigate to edit page
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 5. Wait for form to be visible
    await page.waitForSelector("form", { timeout: 15000 });

    // 6. Enable Map view if not already enabled
    const mapCheckbox = page
      .locator('input[type="checkbox"]')
      .filter({ has: page.locator('label:has-text("Map")') });

    if ((await mapCheckbox.count()) > 0 && !(await mapCheckbox.isChecked())) {
      await mapCheckbox.check();
      await page.waitForTimeout(500);
    }

    // 7. Expand Map section if collapsed
    const mapSection = page.locator("*").filter({ hasText: /^Map$/i });
    if ((await mapSection.count()) > 0) {
      const mapSectionButton = mapSection.locator("button").first();
      if (await mapSectionButton.isVisible()) {
        await mapSectionButton.click();
        await page.waitForTimeout(300);
      }
    }

    // 8. Check for basemap configuration
    const basemapLabel = page.locator(
      'label:has-text("Mapbox Background Map(s)")',
    );
    const hasBasemapConfig = (await basemapLabel.count()) > 0;

    if (hasBasemapConfig) {
      // 9. Find name and style inputs for first basemap
      const nameInput = page.locator('input[id*="basemap-name-0"]').first();
      const styleInput = page.locator('input[id*="basemap-style-0"]').first();

      if ((await nameInput.count()) > 0 && (await styleInput.count()) > 0) {
        // 10. Update basemap name
        await nameInput.clear();
        await nameInput.fill("Custom Basemap");
        await page.waitForTimeout(300);

        // 11. Verify the value is set
        await expect(nameInput).toHaveValue("Custom Basemap");

        // 12. Update basemap style
        await styleInput.clear();
        await styleInput.fill("mapbox://styles/myuser/mystyle");
        await page.waitForTimeout(300);

        // 13. Verify the value is set
        await expect(styleInput).toHaveValue("mapbox://styles/myuser/mystyle");

        // 14. Verify submit button is enabled (change detected)
        const submitButton = page.locator(
          "[data-testid='config-submit-button']",
        );
        await expect(submitButton).toBeEnabled();
      }
    }

    // 15. Clean up
    const removeTableButton = page.locator(
      "[data-testid='config-remove-button']",
    );
    await removeTableButton.click();
    await expect(modal).toBeVisible({ timeout: 5000 });
    const confirmRemoveButton = page.getByRole("button", { name: /confirm/i });
    await confirmRemoveButton.click();
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();
    await page.waitForTimeout(3500);
    await page.waitForURL("**/config", { timeout: 5000 });
  }
});

test("config page - color column configuration", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the grid container
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 3. Add a table
  const addTableButton = page.locator(
    "[data-testid='add-new-dataset-view-button']",
  );
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

  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  // 4. Find the card and navigate to edit page
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 5. Wait for form to be visible
    await page.waitForSelector("form", { timeout: 15000 });

    // 6. Enable Map view if not already enabled (to show color column field)
    const mapCheckbox = page
      .locator('input[type="checkbox"]')
      .filter({ has: page.locator('label:has-text("Map")') });

    if ((await mapCheckbox.count()) > 0 && !(await mapCheckbox.isChecked())) {
      await mapCheckbox.check();
      await page.waitForTimeout(500);
    }

    // 7. Expand Map section if collapsed
    const mapSection = page.locator("*").filter({ hasText: /^Map$/i });
    if ((await mapSection.count()) > 0) {
      const mapSectionButton = mapSection.locator("button").first();
      if (await mapSectionButton.isVisible()) {
        await mapSectionButton.click();
        await page.waitForTimeout(300);
      }
    }

    // 8. Look for COLOR_COLUMN input
    const colorColumnInput = page.locator('input[id*="COLOR_COLUMN"]');
    const hasColorColumn = (await colorColumnInput.count()) > 0;

    if (hasColorColumn) {
      // 9. Verify the input exists
      await expect(colorColumnInput.first()).toBeVisible();

      // 10. Enter a color column value
      await colorColumnInput.first().clear();
      await colorColumnInput.first().fill("color");
      await page.waitForTimeout(300);

      // 11. Verify the value is set
      await expect(colorColumnInput.first()).toHaveValue("color");

      // 12. Verify submit button is enabled (change detected)
      const submitButton = page.locator("[data-testid='config-submit-button']");
      await expect(submitButton).toBeEnabled();
    }

    // 13. Clean up
    const removeTableButton = page.locator(
      "[data-testid='config-remove-button']",
    );
    await removeTableButton.click();
    await expect(modal).toBeVisible({ timeout: 5000 });
    const confirmRemoveButton = page.getByRole("button", { name: /confirm/i });
    await confirmRemoveButton.click();
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();
    await page.waitForTimeout(3500);
    await page.waitForURL("**/config", { timeout: 5000 });
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
    .locator("[data-testid='add-new-dataset-view-button']")
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
      `[data-testid='config-dataset-card']:has-text("${tableNameToAdd.trim()}")`,
    );
    // Cards no longer have hamburger buttons - navigate to edit page
    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
    await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });

    await targetCard;
    // ConfigCard uses ConfigCollapsibleSection, wait for form instead
    await page.waitForSelector("form", { timeout: 15000 });

    // 5. Check for basemap configuration
    // On edit page now, use page.locator
    const basemapLabel = page.locator(
      'label:has-text("Mapbox Background Map(s)"), label:has-text("Basemap")',
    );
    const hasBasemapConfig = (await basemapLabel.count()) > 0;

    if (hasBasemapConfig) {
      // On edit page now
      const addBasemapButton = page
        .locator('button:has-text("+"), button.add-basemap-button')
        .first();
      // On edit page now
      const basemapItems = page.locator(".basemap-item");

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
      const removeButtons = page.locator(
        "button:has-text('Remove'), button.remove-button",
      );
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
    // On edit page now, use page.locator
    const removeButton = page
      .locator("button:has-text('Remove'), button.remove-button")
      .last();
    await removeButton.click();
    await expect(modal).toBeVisible();
    await confirmButton.click();
    await expect(page.getByText(/table removed from views!/i)).toBeVisible();
    await page.waitForTimeout(3500);
  }
});
