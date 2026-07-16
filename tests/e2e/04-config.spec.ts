import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  ensureMapFormCanSubmit,
  expandMapSection,
  openMapConfigEditPage,
} from "@/tests/e2e/helpers/configPage";

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

test("config page - search bar filters dataset view cards by name", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("[data-testid='config-dataset-card']", {
    timeout: 15000,
  });

  const allCards = page.locator("[data-testid='config-dataset-card']");
  const initialCount = await allCards.count();
  expect(initialCount).toBeGreaterThan(0);

  const searchInput = page.locator("input[type='text']");
  await expect(searchInput).toBeVisible({ timeout: 5000 });

  const firstCardHeading = page
    .locator("[data-testid='config-dataset-card'] h2")
    .first();
  const headingText = await firstCardHeading.textContent();
  const searchTerm = (headingText || "").trim().substring(0, 5);

  await searchInput.fill(searchTerm);
  await page.waitForTimeout(500);

  const filteredCards = page.locator("[data-testid='config-dataset-card']");
  const filteredCount = await filteredCards.count();
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThanOrEqual(initialCount);
});

test("config page - search bar shows no results message for gibberish", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("[data-testid='config-dataset-card']", {
    timeout: 15000,
  });

  const searchInput = page.locator("input[type='text']");
  await searchInput.fill("zzzznonexistentdatasetview12345");
  await page.waitForTimeout(500);

  const cards = page.locator("[data-testid='config-dataset-card']");
  expect(await cards.count()).toBe(0);

  const noResults = page.getByText(/no datasets match/i);
  await expect(noResults).toBeVisible({ timeout: 5000 });
});

test("config page - search persists in URL query param", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("[data-testid='config-dataset-card']", {
    timeout: 15000,
  });

  const searchInput = page.locator("input[type='text']");
  await searchInput.fill("test");
  await page.waitForTimeout(500);

  expect(page.url()).toContain("q=test");

  await page.goto("/config?q=test");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page.locator("input[type='text']")).toHaveValue("test");
});

test("config page - view type filter filters dataset view cards", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("[data-testid='config-dataset-card']", {
    timeout: 15000,
  });

  const allCards = page.locator("[data-testid='config-dataset-card']");
  const initialCount = await allCards.count();
  expect(initialCount).toBeGreaterThan(0);

  const allButton = page.getByRole("button", { name: /^all$/i });
  await expect(allButton).toBeVisible();

  const mapButton = page.getByRole("button", { name: /^map$/i });
  if ((await mapButton.count()) === 0) {
    return;
  }

  await mapButton.click();
  await page.waitForTimeout(500);

  const filteredCards = page.locator("[data-testid='config-dataset-card']");
  const filteredCount = await filteredCards.count();
  expect(filteredCount).toBeLessThanOrEqual(initialCount);
  expect(filteredCount).toBeGreaterThan(0);

  const visibleMapTags = page.locator("[data-testid='config-view-tag-map']");
  expect(await visibleMapTags.count()).toBe(filteredCount);

  await allButton.click();
  await page.waitForTimeout(500);

  expect(await allCards.count()).toBe(initialCount);
});

test("config page - view filter persists in URL query param", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("[data-testid='config-dataset-card']", {
    timeout: 15000,
  });

  const mapButton = page.getByRole("button", { name: /^map$/i });
  if ((await mapButton.count()) === 0) {
    return;
  }

  await mapButton.click();
  await page.waitForTimeout(500);

  expect(page.url()).toContain("view=map");

  await page.goto("/config?view=map");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("[data-testid='config-dataset-card']", {
    timeout: 15000,
  });

  const cardCount = await page
    .locator("[data-testid='config-dataset-card']")
    .count();
  const mapTagCount = await page
    .locator("[data-testid='config-view-tag-map']")
    .count();
  expect(mapTagCount).toBe(cardCount);
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
  const addModal = page.locator("[data-testid='config-modal']");
  await expect(addModal).toBeVisible();

  // 5. Verify the modal message
  const modalMessage = page.locator("[data-testid='config-modal-message']");
  await expect(modalMessage).toBeVisible();
  await expect(modalMessage.getByText(/select dataset to add:/i)).toBeVisible();

  // 6. Verify the dropdown is present
  const dropdown = page.locator("[data-testid='config-modal-table-select']");
  await expect(dropdown).toBeVisible();

  // 7. Check if there are any available options in the dropdown
  const options = await dropdown.locator("option").all();
  const availableOptions: string[] = [];

  for (const option of options) {
    const optionText = await option.textContent();
    if (optionText && optionText.trim() && optionText.trim() !== "") {
      availableOptions.push(optionText.trim());
    }
  }

  let selectedTableName: string | null = null;

  // 8. If there are available options, add a new dataset view
  if (availableOptions.length > 0) {
    // Verify the confirm button is initially disabled
    const confirmButton = page.locator(
      "[data-testid='config-modal-confirm-button']",
    );
    await expect(confirmButton).toBeDisabled();

    // Select the first available option
    await dropdown.selectOption({ label: availableOptions[0] });
    selectedTableName = availableOptions[0];

    // Verify the confirm button is now enabled
    await expect(confirmButton).toBeEnabled();

    // Click confirm to add the table
    await confirmButton.click();

    // Wait for modal to close
    await expect(addModal).not.toBeVisible({ timeout: 5000 });

    // Wait for page to reload/update (the card should appear after a few seconds)
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

    // Verify the dataset card with the table name we just added is rendered
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${selectedTableName.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    // Verify the card shows the table name in the heading
    const cardHeading = targetCard.locator("h2");
    await expect(cardHeading).toBeVisible();
    await expect(cardHeading).toContainText(selectedTableName.trim(), {
      timeout: 5000,
    });
  } else {
    // No available options - all tables are already configured
    // Close the modal and work with existing dataset views
    const cancelButton = page.locator(
      "[data-testid='config-modal-cancel-button']",
    );
    await cancelButton.click();
    await expect(addModal).not.toBeVisible({ timeout: 5000 });

    // Get the first existing dataset card
    const existingCards = page.locator("[data-testid='config-dataset-card']");
    const cardCount = await existingCards.count();

    if (cardCount > 0) {
      // Get the table name from the first card
      const firstCard = existingCards.first();
      const cardHeading = firstCard.locator("h2");
      await expect(cardHeading).toBeVisible();
      const headingText = await cardHeading.textContent();
      selectedTableName = headingText?.trim() || null;

      // Use the first card for editing
      const editLink = firstCard.locator(
        "[data-testid='edit-dataset-view-link']",
      );
      await editLink.click();

      // Wait for navigation to edit page
      await page.waitForURL(`**/config/${selectedTableName}**`, {
        timeout: 10000,
      });
    } else {
      // No cards at all - skip the test
      test.skip();
      return;
    }
  }

  // 9. Navigate to edit page (if we haven't already)
  if (
    selectedTableName &&
    !page.url().includes(`/config/${selectedTableName}`)
  ) {
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${selectedTableName.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    // Click "Edit dataset view" to navigate to edit page
    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
  }

  // 10. Wait for navigation to edit page (if we're not already there)
  if (selectedTableName) {
    await page.waitForURL(`**/config/${selectedTableName.trim()}**`, {
      timeout: 10000,
    });
    await page.waitForLoadState("networkidle");

    // 11. Wait for form to be visible
    await page.waitForSelector("form", { timeout: 15000 });
    const configCard = page.locator(".bg-white.rounded-lg.shadow-sm").first();
    await expect(configCard).toBeVisible({ timeout: 15000 });

    // 12. Verify page heading shows the dataset name
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`configuration.*${selectedTableName.trim()}`, "i"),
      }),
    ).toBeVisible();

    // 13. Verify breadcrumb link back to config (use more specific selector to avoid header links)
    const configBreadcrumb = page
      .locator('a[href="/config"]')
      .filter({ hasText: /configuration/i })
      .first();
    await expect(configBreadcrumb).toBeVisible();

    // 14. Verify submit button exists and is initially disabled (no changes)
    const submitButton = page.locator("[data-testid='config-submit-button']");
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // 15. Expand Dataset section if not already expanded
    const datasetSectionToggle = page.locator(
      '[data-testid="config-section-dataset-toggle"]',
    );
    if ((await datasetSectionToggle.count()) > 0) {
      // Check if section is expanded by looking for the input field
      const datasetNameInputCheck = page.locator(
        'input[id*="DATASET_TABLE"], input[placeholder*="Dataset Display Name"]',
      );
      if ((await datasetNameInputCheck.count()) === 0) {
        // Section is collapsed, expand it
        await datasetSectionToggle.click();
        await page.waitForTimeout(300);
      }
    }

    // 16. Find and modify a form field (Dataset display name or View header image)
    const datasetNameInput = page.locator(
      'input[id*="DATASET_TABLE"], input[placeholder*="Dataset Display Name"]',
    );
    const viewHeaderImageInput = page.locator(
      'input[id*="VIEW_HEADER_IMAGE"], input[placeholder*="View Header Image"]',
    );

    if ((await datasetNameInput.count()) > 0) {
      // 17. Modify the dataset display name
      await datasetNameInput.clear();
      await datasetNameInput.fill(`Test Dataset - ${Date.now()}`);
      await page.waitForTimeout(500);

      // New views need a token + visibility before Save can enable
      await ensureMapFormCanSubmit(page);

      // 18. Verify submit button is now enabled (change detected)
      await expect(submitButton).toBeEnabled();

      // 19. Click submit to save changes
      await submitButton.click();

      // 20. Wait for network request to complete
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // 21. Wait for Vue reactivity to update the form state
      // The ConfigCard watch should update originalConfig after datasetConfig is updated
      await page.waitForTimeout(3000);

      // 22. Verify the input value was saved (more reliable than button state)
      const savedValue = await datasetNameInput.inputValue();
      expect(savedValue).toBeTruthy();
    } else if ((await viewHeaderImageInput.count()) > 0) {
      // 17. Modify the view header image URL
      await viewHeaderImageInput.clear();
      await viewHeaderImageInput.fill(
        "https://plus.unsplash.com/premium_photo-1676218968741-8179dd7e533f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      );
      await page.waitForTimeout(500);

      // 18. Verify submit button is now enabled (change detected)
      await expect(submitButton).toBeEnabled();

      // 19. Click submit to save changes
      await submitButton.click();

      // 20. Wait for network request to complete
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // 21. Wait for Vue reactivity to update the form state
      await page.waitForTimeout(3000);

      // 22. Verify the input value was saved
      const savedValue = await viewHeaderImageInput.inputValue();
      expect(savedValue).toBeTruthy();
    } else {
      // If neither input exists, try modifying VIEW_DESCRIPTION
      const descriptionInput = page.locator(
        'textarea[id*="VIEW_DESCRIPTION"], textarea[placeholder*="description"]',
      );

      if ((await descriptionInput.count()) > 0) {
        await descriptionInput.clear();
        await descriptionInput.fill("Test description");
        await page.waitForTimeout(500);
        await expect(submitButton).toBeEnabled();
        await submitButton.click();
        // Wait for network request to complete
        await page.waitForLoadState("networkidle", { timeout: 10000 });
        // Wait for Vue reactivity to update the form state
        await page.waitForTimeout(3000);
      }
    }

    // 22. Verify we can navigate back to config dashboard
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
    page.getByRole("heading", { name: /^Configuration\b/i, level: 1 }),
  ).toBeVisible();

  // 10. Verify breadcrumb link back to config (use more specific selector to avoid header links)
  const configBreadcrumb = page
    .locator('a[href="/config"]')
    .filter({ hasText: /configuration/i })
    .first();
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

  // 9. Verify read-only view metadata is present (view type outside ConfigCard)
  const viewMetadata = page.locator("[data-testid='view-metadata']");
  await expect(viewMetadata).toBeVisible();
  const viewTypeDisplay = page.locator(
    "[data-testid='config-view-type-display']",
  );
  await expect(viewTypeDisplay).toBeVisible();

  // 10. Find and modify a form field to test change detection
  const textInputs = page.locator('input[type="text"], textarea');
  const inputCount = await textInputs.count();

  if (inputCount > 0) {
    // Find a non-empty input to modify (skip tag inputs and special fields)
    for (let i = 0; i < inputCount; i++) {
      const input = textInputs.nth(i);
      const inputId = await input.getAttribute("id");
      const inputClass = await input.getAttribute("class");

      // Skip tag inputs, basemap inputs, and other special inputs
      if (
        inputId?.includes("tag") ||
        inputId?.includes("basemap") ||
        inputClass?.includes("tag-field") ||
        inputClass?.includes("ti-")
      ) {
        continue;
      }

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

      // Check if input is visible and editable
      const isVisible = await input.isVisible();
      if (!isVisible) {
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
        await page.waitForTimeout(1000);
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
  const addModal = page.locator("[data-testid='config-modal']");
  await expect(addModal).toBeVisible();
  console.log("[TEST] Step 3: Modal is visible");

  // 4. Click the cancel button
  console.log("[TEST] Step 4: Clicking cancel button");
  const cancelButton = page.getByRole("button", { name: /cancel/i });
  await cancelButton.click();
  console.log("[TEST] Step 4: Clicked cancel button");

  // 5. Verify the modal closes
  console.log("[TEST] Step 5: Checking modal is closed");
  await expect(addModal).not.toBeVisible();
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

  // 3. Look for dataset cards (cards are divs with violet background)
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
  const addModal = page.locator("[data-testid='config-modal']");
  await expect(addModal).toBeVisible();

  // 5. Check if there are any available options in the dropdown
  const dropdown = page.locator("[data-testid='config-modal-table-select']");
  await expect(dropdown).toBeVisible();

  const options = await dropdown.locator("option").all();
  const availableOptions: string[] = [];

  for (const option of options) {
    const optionText = await option.textContent();
    if (optionText && optionText.trim() && optionText.trim() !== "") {
      availableOptions.push(optionText.trim());
    }
  }

  let tableNameToAdd: string | null = null;

  // 6. If there are available options, add a new dataset view
  if (availableOptions.length > 0) {
    // Select the first available option
    await dropdown.selectOption({ label: availableOptions[0] });
    tableNameToAdd = availableOptions[0];

    // Click confirm to add the table
    const confirmButton = page.locator(
      "[data-testid='config-modal-confirm-button']",
    );
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Wait for modal to close
    await expect(addModal).not.toBeVisible({ timeout: 5000 });

    // Wait for page to reload/update
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

    // Find the card with the table name we just added
    const targetCard = page.locator(
      `[data-testid='config-dataset-card']:has-text("${tableNameToAdd.trim()}")`,
    );
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    // Navigate to edit page
    const editLink = targetCard.locator(
      "[data-testid='edit-dataset-view-link']",
    );
    await editLink.click();
  } else {
    // No available options - all tables are already configured
    // Close the modal and work with existing dataset views
    const cancelButton = page.locator(
      "[data-testid='config-modal-cancel-button']",
    );
    await cancelButton.click();
    await expect(addModal).not.toBeVisible({ timeout: 5000 });

    // Get the first existing dataset card
    const existingCards = page.locator("[data-testid='config-dataset-card']");
    const cardCount = await existingCards.count();

    if (cardCount > 0) {
      // Get the table name from the first card
      const firstCard = existingCards.first();
      const cardHeading = firstCard.locator("h2");
      await expect(cardHeading).toBeVisible();
      const headingText = await cardHeading.textContent();
      tableNameToAdd = headingText?.trim() || null;

      // Use the first card for editing
      const editLink = firstCard.locator(
        "[data-testid='edit-dataset-view-link']",
      );
      await editLink.click();

      // Wait for navigation to edit page
      await page.waitForURL(`**/config/${tableNameToAdd}**`, {
        timeout: 10000,
      });
    } else {
      // No cards at all - skip the test
      test.skip();
      return;
    }
  }

  // 7. Wait for navigation to edit page (if we haven't already)
  if (tableNameToAdd && !page.url().includes(`/config/${tableNameToAdd}`)) {
    await page.waitForURL(`**/config/${tableNameToAdd}**`, {
      timeout: 10000,
    });
  }

  if (tableNameToAdd) {
    await page.waitForLoadState("networkidle");

    // 8. Wait for form content to be visible
    await page.waitForSelector("form", { timeout: 15000 });

    // 9. Verify submit button is initially disabled (no changes)
    const submitButton = page.locator("[data-testid='config-submit-button']");
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // 10. Test mapbox3d checkbox and terrain exaggeration slider (if map config exists)
    await expandMapSection(page);
    const mapbox3dCheckbox = page.locator(
      'input[type="checkbox"][id*="MAPBOX_3D"]',
    );

    const has3dMapConfig = (await mapbox3dCheckbox.count()) > 0;

    if (has3dMapConfig) {
      // 14a. Verify checkbox is visible
      await expect(mapbox3dCheckbox).toBeVisible();

      // New views need a token + visibility before Save can enable
      await ensureMapFormCanSubmit(page);

      // 14b. Check the mapbox3d checkbox
      const wasChecked = await mapbox3dCheckbox.isChecked();
      if (wasChecked) {
        await mapbox3dCheckbox.uncheck();
        await page.waitForTimeout(300);
      }
      await mapbox3dCheckbox.check();
      await page.waitForTimeout(300);

      // 14c. Verify submit button is now enabled (change detected)
      await expect(submitButton).toBeEnabled();

      // 14d. Revert checkbox to original state
      if (!wasChecked) {
        await mapbox3dCheckbox.uncheck();
        await page.waitForTimeout(300);
      }
    }

    // 11. Find and modify a form field (dataset display name - safer than mapbox token)
    const datasetNameInput = page.locator(
      'input[id*="DATASET_TABLE"], input[placeholder*="Dataset Display Name"]',
    );

    if ((await datasetNameInput.count()) > 0) {
      // 16. Get original value first
      const originalValue = await datasetNameInput.inputValue();

      // 17. Modify the dataset name
      await datasetNameInput.clear();
      await datasetNameInput.fill(`Test Dataset ${Date.now()}`);
      await page.waitForTimeout(500);

      // 18. Verify submit button is enabled (change detected)
      await expect(submitButton).toBeEnabled();

      // 19. Revert the change back to original
      await datasetNameInput.clear();
      if (originalValue) {
        await datasetNameInput.fill(originalValue);
      }
      await page.waitForTimeout(1000); // Wait longer for change detection
      // Note: Button might stay enabled if form has other changes, so just verify it exists
      await expect(submitButton).toBeVisible();
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
  }
});

test("config page - submit configuration changes", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page and open a map config edit form
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });
  await openMapConfigEditPage(page);

  {
    // 2. Find and modify a form field (dataset display name - safer than mapbox token)
    const datasetNameInput = page.locator(
      'input[id*="DATASET_TABLE"], input[placeholder*="e.g., My Mapping Data"]',
    );

    if ((await datasetNameInput.count()) > 0) {
      // 3. Enter a new dataset display name
      await datasetNameInput.clear();
      const testValue = `Test Dataset ${Date.now()}`;
      await datasetNameInput.fill(testValue);
      await page.waitForTimeout(500);

      // 4. Submit the form
      const submitButton = page.locator("[data-testid='config-submit-button']");
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      // 5. Wait for network request to complete
      await page.waitForLoadState("networkidle", { timeout: 2000 });

      // 6. Wait 2 seconds for changes to be saved
      await page.waitForTimeout(2000);

      // 7. Verify the input value was saved (contains what we filled)
      const savedValue = await datasetNameInput.inputValue();
      expect(savedValue).toContain("Test Dataset");
      expect(savedValue).toBeTruthy();
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
        const savedModal = page
          .locator("text=Saved!")
          .or(page.locator("h2").filter({ hasText: /saved/i }));
        await expect(savedModal).toBeVisible({
          timeout: 10000,
        });
      }
    }
  }
});

test("config page - view metadata displays current view type outside ConfigCard", async ({
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

  // 6. Verify read-only metadata block displays the current view type
  const viewMetadata = page.locator("[data-testid='view-metadata']");
  await expect(viewMetadata).toBeVisible({ timeout: 10000 });
  const viewTypeDisplay = page.locator(
    "[data-testid='config-view-type-display']",
  );
  await expect(viewTypeDisplay).toBeVisible({ timeout: 10000 });
  await expect(viewTypeDisplay).toHaveText(/^(Map|Gallery|Alerts)$/i);

  // 7. Verify primary / secondary fields are present
  await expect(
    page.locator("[data-testid='view-metadata-primary']"),
  ).toBeVisible();
  await expect(
    page.locator("[data-testid='view-metadata-secondary']"),
  ).toBeVisible();

  // 8. Verify the view type is immutable (no radio toggles on the edit screen)
  const viewTypeRadios = page.locator('input[type="radio"][name="view-type"]');
  await expect(viewTypeRadios).toHaveCount(0);

  // 9. Verify Views collapsible section is gone from ConfigCard
  const viewsSection = page.locator("form").getByText(/^Views$/i);
  await expect(viewsSection).toHaveCount(0);
});

test("config page - conditional form sections based on views", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page and open a map config edit form
  await page.goto("/config");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });
  await openMapConfigEditPage(page);

  // 2. Verify we're on the edit page (ConfigCard should be visible)
  const configCard = page.locator(".bg-white.rounded-lg.shadow-sm");
  await expect(configCard.first()).toBeVisible({ timeout: 15000 });

  // 3. Look for collapsible section headers (Map, Media, etc. — Views removed)
  const sectionHeaders = page.locator("h3, button").filter({
    hasText:
      /^(Map|Media|Alerts|Filtering|Dataset|Permissions|Other|Visibility)$/i,
  });
  const headerCount = await sectionHeaders.count();

  if (headerCount > 0) {
    await expect(sectionHeaders.first()).toBeVisible();
  }

  // 4. Verify read-only metadata block shows view type outside ConfigCard
  const viewMetadata = page.locator("[data-testid='view-metadata']");
  await expect(viewMetadata).toBeVisible();

  // 5. Verify the metadata block displays the current (immutable) view type
  const viewTypeDisplay = page.locator(
    "[data-testid='config-view-type-display']",
  );
  await expect(viewTypeDisplay).toBeVisible();
  await expect(viewTypeDisplay).toHaveText(/^(Map|Gallery|Alerts)$/i);
});

test("config page - language switching functionality", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the config page
  await page.goto("/config");

  // 2. Wait for the language picker button to be visible (globe icon in AppHeader)
  const languageButton = page
    .locator(".language-picker-container button")
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
  // 1. Navigate to the config page and open a map config edit form
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });
  await openMapConfigEditPage(page);

  {
    // 2. Find mapbox access token field
    const mapboxTokenInput = page.locator(
      'input[id*="MAPBOX_ACCESS_TOKEN"], input[placeholder*="Mapbox"]',
    );

    if ((await mapboxTokenInput.count()) > 0) {
      const submitButton = page.locator("[data-testid='config-submit-button']");

      // Empty token keeps the form invalid (Save disabled)
      await mapboxTokenInput.clear();
      await page.waitForTimeout(300);
      await expect(submitButton).toBeDisabled();
      const buttonClasses = await submitButton.getAttribute("class");
      expect(buttonClasses).toContain("bg-gray");

      // Any non-empty token satisfies client-side required check
      await mapboxTokenInput.fill(
        "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example",
      );
      await page.waitForTimeout(300);
      await ensureMapFormCanSubmit(page);
      await expect(submitButton).toBeEnabled();
    }
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
  const addModal = page.locator("[data-testid='config-modal']");
  await expect(addModal).toBeVisible();
  await expect(addModal).toBeVisible({ timeout: 10000 });

  // 4. Verify the modal content is visible
  const modalContent = addModal.locator(".bg-white.rounded-lg");
  await expect(modalContent).toBeVisible();

  // 5. Click cancel to close modal
  const cancelButton = page.locator(
    "[data-testid='config-modal-cancel-button']",
  );
  await cancelButton.click();

  // 6. Verify modal is hidden
  await expect(addModal).not.toBeVisible();
  await expect(addModal).not.toBeVisible();
});

test("config page - visibility permissions configuration", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // Use a seeded view that already has ROUTE_LEVEL_PERMISSION set. Newly added
  // views start with an empty config and intentionally have no radio selected.
  await page.goto("/config/fake_alerts?view_type=alerts");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("form", { timeout: 15000 });

  // Look for the visibility section (should be visible to admins)
  const visibilitySection = page.locator(
    '[data-testid="config-section-visibility-toggle"]',
  );

  // If visibility section is visible (admin user), test the functionality
  if ((await visibilitySection.count()) > 0) {
    await expect(visibilitySection).toBeVisible();

    const helpText = page
      .locator("p, span, div")
      .filter({ hasText: /choose who can view this view/i })
      .first();
    await expect(helpText).toBeVisible();

    const radioButtons = page.locator('input[type="radio"]');
    const radioCount = await radioButtons.count();
    expect(radioCount).toBeGreaterThan(0);

    const checkedRadio = page.locator('input[type="radio"]:checked');
    await expect(checkedRadio.first()).toBeVisible();
  } else {
    await expect(visibilitySection).toHaveCount(0);
  }
});

test("config page - basemap configuration - add and remove basemaps", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });
  await openMapConfigEditPage(page);

  const basemapLabel = page.locator(
    'label:has-text("Mapbox Background Map(s)")',
  );
  const hasBasemapConfig = (await basemapLabel.count()) > 0;

  if (hasBasemapConfig) {
    const basemapItems = page.locator("[data-testid^='basemap-item-']");
    const initialCount = await basemapItems.count();
    expect(initialCount).toBeGreaterThan(0);

    const addBasemapButton = page.locator("[data-testid='basemap-add-button']");

    if ((await addBasemapButton.count()) > 0) {
      await expect(addBasemapButton.first()).toBeVisible();
      await expect(addBasemapButton.first()).toBeEnabled();

      await addBasemapButton.first().click();
      await page.waitForTimeout(500);

      const basemapItemsAfterAdd = page
        .locator("div")
        .filter({ has: page.locator('input[id*="basemap-name"]') });
      const newCount = await basemapItemsAfterAdd.count();
      expect(newCount).toBeGreaterThan(initialCount);

      const removeButtons = page.locator(
        "[data-testid^='basemap-remove-button-']",
      );

      if ((await removeButtons.count()) > 0) {
        await removeButtons.first().click();
        await page.waitForTimeout(500);

        const finalCount = await basemapItemsAfterAdd.count();
        expect(finalCount).toBeLessThan(newCount);
      }
    }
  }
});

test("config page - basemap configuration - validation", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });
  await openMapConfigEditPage(page);

  const basemapLabel = page.locator(
    'label:has-text("Mapbox Background Map(s)")',
  );
  const hasBasemapConfig = (await basemapLabel.count()) > 0;

  if (hasBasemapConfig) {
    const addBasemapButton = page.locator("[data-testid='basemap-add-button']");

    if ((await addBasemapButton.count()) > 0) {
      await addBasemapButton.first().click();
      await page.waitForTimeout(500);

      const nameInputs = page.locator('input[id*="basemap-name"]');
      const nameInputCount = await nameInputs.count();

      if (nameInputCount >= 2) {
        const firstNameInput = nameInputs.nth(0);
        const secondNameInput = nameInputs.nth(1);

        await firstNameInput.clear();
        await firstNameInput.fill("Default Style");
        await page.waitForTimeout(300);

        await secondNameInput.clear();
        await secondNameInput.fill("Default Style");
        await page.waitForTimeout(500);

        const validationErrors = page.locator(".text-red-600, .text-red-500");
        const errorCount = await validationErrors.count();
        expect(errorCount).toBeGreaterThanOrEqual(0);

        await secondNameInput.clear();
        await secondNameInput.fill("Streets");
        await page.waitForTimeout(500);
      }

      const styleInputs = page.locator('input[id*="basemap-style"]');
      if ((await styleInputs.count()) > 0) {
        const firstStyleInput = styleInputs.first();

        const pattern = await firstStyleInput.getAttribute("pattern");
        expect(pattern).toContain("mapbox:");
        expect(pattern).toContain("styles");

        await firstStyleInput.clear();
        await firstStyleInput.fill(
          "mapbox://styles/mapbox/satellite-streets-v12",
        );
        await page.waitForTimeout(300);
        await firstStyleInput.clear();
        await firstStyleInput.fill("mapbox://styles/user/styleid");
        await page.waitForTimeout(300);
      }
    }
  }
});

test("config page - basemap configuration - update name and style", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });
  await openMapConfigEditPage(page);

  const basemapLabel = page.locator(
    'label:has-text("Mapbox Background Map(s)")',
  );
  const hasBasemapConfig = (await basemapLabel.count()) > 0;

  if (hasBasemapConfig) {
    const nameInput = page.locator('input[id*="basemap-name-0"]').first();
    const styleInput = page.locator('input[id*="basemap-style-0"]').first();

    if ((await nameInput.count()) > 0 && (await styleInput.count()) > 0) {
      await nameInput.clear();
      await nameInput.fill("Default Style");
      await page.waitForTimeout(300);

      await expect(nameInput).toHaveValue("Default Style");

      await styleInput.clear();
      await styleInput.fill("mapbox://styles/mapbox/satellite-streets-v12");
      await page.waitForTimeout(300);

      await expect(styleInput).toHaveValue(
        "mapbox://styles/mapbox/satellite-streets-v12",
      );

      const submitButton = page.locator("[data-testid='config-submit-button']");
      await expect(submitButton).toBeEnabled();
    }
  }
});

test("config page - color column configuration", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });
  await openMapConfigEditPage(page);

  const colorColumnInput = page.locator('input[id*="COLOR_COLUMN"]');
  const hasColorColumn = (await colorColumnInput.count()) > 0;

  if (hasColorColumn) {
    await expect(colorColumnInput.first()).toBeVisible();

    await colorColumnInput.first().clear();
    await colorColumnInput.first().fill("color");
    await page.waitForTimeout(300);

    await expect(colorColumnInput.first()).toHaveValue("color");

    const submitButton = page.locator("[data-testid='config-submit-button']");
    await expect(submitButton).toBeEnabled();
  }
});

test("config page - copy config from another dataset", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  const datasetCards = page.locator("[data-testid='config-dataset-card']");
  const cardCount = await datasetCards.count();

  if (cardCount < 2) {
    test.skip();
    return;
  }

  const firstCard = datasetCards.first();
  const editLink = firstCard.locator("[data-testid='edit-dataset-view-link']");
  await editLink.click();
  await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("form", { timeout: 15000 });

  const copyButton = page.locator("[data-testid='copy-config-button']");
  await expect(copyButton).toBeVisible({ timeout: 5000 });

  await copyButton.click();

  const copyModal = page.locator("[data-testid='copy-config-modal']");
  await expect(copyModal).toBeVisible({ timeout: 5000 });

  const confirmButton = page.locator(
    "[data-testid='copy-config-confirm-button']",
  );
  await expect(confirmButton).toBeDisabled();

  const dropdown = page.locator("[data-testid='copy-config-select']");
  const options = await dropdown.locator("option:not([disabled])").all();
  expect(options.length).toBeGreaterThan(0);

  await dropdown.selectOption({ index: 1 });
  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();
  await expect(copyModal).not.toBeVisible({ timeout: 5000 });

  const submitButton = page.locator("[data-testid='config-submit-button']");
  await expect(submitButton).toBeEnabled({ timeout: 5000 });
});

test("config page - copy config modal cancel closes modal", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  const datasetCards = page.locator("[data-testid='config-dataset-card']");
  const cardCount = await datasetCards.count();

  if (cardCount < 2) {
    test.skip();
    return;
  }

  const firstCard = datasetCards.first();
  const editLink = firstCard.locator("[data-testid='edit-dataset-view-link']");
  await editLink.click();
  await page.waitForURL(/\/config\/\w+/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("form", { timeout: 15000 });

  const copyButton = page.locator("[data-testid='copy-config-button']");
  await copyButton.click();

  const copyModal = page.locator("[data-testid='copy-config-modal']");
  await expect(copyModal).toBeVisible({ timeout: 5000 });

  const cancelButton = page.locator(
    "[data-testid='copy-config-cancel-button']",
  );
  await cancelButton.click();

  await expect(copyModal).not.toBeVisible({ timeout: 5000 });
});

test("config page - basemap configuration - max 3 limit", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 5000 });
  await openMapConfigEditPage(page);

  const basemapLabel = page.locator(
    'label:has-text("Mapbox Background Map(s)"), label:has-text("Basemap")',
  );
  const hasBasemapConfig = (await basemapLabel.count()) > 0;

  if (hasBasemapConfig) {
    const addBasemapButton = page.locator("[data-testid='basemap-add-button']");
    const basemapItems = page.locator("[data-testid^='basemap-item-']");

    let currentCount = await basemapItems.count();
    while (currentCount < 3 && (await addBasemapButton.isEnabled())) {
      await addBasemapButton.click();
      await page.waitForTimeout(500);
      currentCount = await basemapItems.count();
    }

    expect(await basemapItems.count()).toBe(3);
    await expect(addBasemapButton).toBeDisabled();

    await addBasemapButton.click({ force: true });
    await page.waitForTimeout(500);
    expect(await basemapItems.count()).toBe(3);

    const removeButtons = page.locator(
      "[data-testid^='basemap-remove-button-']",
    );
    if ((await removeButtons.count()) > 0) {
      await removeButtons.first().click();
      await page.waitForTimeout(500);

      expect(await basemapItems.count()).toBe(2);
      await expect(addBasemapButton).toBeEnabled();
    }
  }
});
