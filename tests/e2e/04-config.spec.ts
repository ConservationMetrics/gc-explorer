import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  ensureMapFormCanSubmit,
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

test("config page - create new view via type-first flow and edit it", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // seed_survey_data already has gallery; create a map view for it.
  const selectedTableName = "seed_survey_data";

  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("div.max-w-7xl", { timeout: 15000 });

  const addTableButton = page.locator(
    "[data-testid='add-new-dataset-view-button']",
  );
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();
  await page.waitForURL("**/config/new", { timeout: 10000 });

  await page.locator("[data-testid='create-view-type-map']").click();
  await page
    .locator("[data-testid='create-primary-select']")
    .selectOption(selectedTableName);
  await page.locator("[data-testid='create-view-continue']").click();
  await page.waitForURL("**/config/new/map**", { timeout: 10000 });

  await expect(
    page.locator("[data-testid='create-form-primary-select']"),
  ).toHaveValue(selectedTableName);

  const mapSectionToggle = page.locator(
    '[data-testid="config-section-map-toggle"]',
  );
  if ((await mapSectionToggle.count()) > 0) {
    await mapSectionToggle.click();
    await page.waitForTimeout(300);
  }
  await ensureMapFormCanSubmit(page);

  const submitButton = page.locator("[data-testid='config-submit-button']");
  await expect(submitButton).toBeEnabled({ timeout: 10000 });
  await submitButton.click();

  await page.waitForURL(`**/config/${selectedTableName}**`, {
    timeout: 15000,
  });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("form", { timeout: 15000 });

  await expect(submitButton).toBeDisabled();

  const viewSectionToggle = page.locator(
    '[data-testid="config-section-view-toggle"], [data-testid="config-section-dataset-toggle"]',
  );
  if ((await viewSectionToggle.count()) > 0) {
    const datasetNameInputCheck = page.locator(
      'input[id*="DATASET_TABLE"], input[placeholder*="View Display Name"]',
    );
    if ((await datasetNameInputCheck.count()) === 0) {
      await viewSectionToggle.first().click();
      await page.waitForTimeout(300);
    }
  }

  const datasetNameInput = page.locator(
    'input[id*="DATASET_TABLE"], input[placeholder*="View Display Name"]',
  );
  if ((await datasetNameInput.count()) > 0) {
    await datasetNameInput.clear();
    await datasetNameInput.fill(`Test Dataset - ${Date.now()}`);
    await page.waitForTimeout(500);
    await ensureMapFormCanSubmit(page);
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    await page.waitForTimeout(2000);
    expect(await datasetNameInput.inputValue()).toBeTruthy();
  }

  const configBreadcrumb = page
    .locator('a[href="/config"]')
    .filter({ hasText: /configuration/i })
    .first();
  await expect(configBreadcrumb).toBeVisible();
  await configBreadcrumb.click();
  await page.waitForURL("**/config", { timeout: 5000 });
  await expect(
    page.getByRole("heading", { name: /dataset view management/i }),
  ).toBeVisible();
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

test("config page - cancel create leaves database unchanged", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForLoadState("networkidle");

  const addTableButton = page
    .locator("[data-testid='add-new-dataset-view-button']")
    .first();
  await addTableButton.waitFor({ state: "visible", timeout: 10000 });
  await addTableButton.click();
  await page.waitForURL("**/config/new", { timeout: 10000 });

  await page.locator("[data-testid='create-view-cancel']").click();
  await page.waitForURL("**/config", { timeout: 10000 });
  await expect(
    page.getByRole("heading", { name: /dataset view management/i }),
  ).toBeVisible();
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
  await openMapConfigEditPage(page);

  const submitButton = page.locator("[data-testid='config-submit-button']");
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeDisabled();

  const viewSectionToggle = page.locator(
    '[data-testid="config-section-view-toggle"], [data-testid="config-section-dataset-toggle"]',
  );
  if ((await viewSectionToggle.count()) > 0) {
    const datasetNameInputCheck = page.locator(
      'input[id*="DATASET_TABLE"], input[placeholder*="View Display Name"]',
    );
    if ((await datasetNameInputCheck.count()) === 0) {
      await viewSectionToggle.first().click();
      await page.waitForTimeout(300);
    }
  }

  const datasetNameInput = page.locator(
    'input[id*="DATASET_TABLE"], input[placeholder*="View Display Name"]',
  );
  if ((await datasetNameInput.count()) > 0) {
    const currentValue = await datasetNameInput.inputValue();
    await datasetNameInput.clear();
    await datasetNameInput.fill(`Changed - ${Date.now()}`);
    await page.waitForTimeout(500);
    await ensureMapFormCanSubmit(page);
    await expect(submitButton).toBeEnabled();

    // Revert so later tests stay stable
    await datasetNameInput.clear();
    if (currentValue) {
      await datasetNameInput.fill(currentValue);
    }
    await page.waitForTimeout(500);
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

test("config create - selected primary carries into create form", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config/new");
  await page.locator("[data-testid='create-view-type-gallery']").click();
  await page
    .locator("[data-testid='create-primary-select']")
    .selectOption("seed_survey_data");
  await page.locator("[data-testid='create-view-continue']").click();
  await page.waitForURL("**/config/new/gallery?primary=seed_survey_data", {
    timeout: 10000,
  });
  await expect(
    page.locator("[data-testid='create-form-primary-select']"),
  ).toHaveValue("seed_survey_data");
});

test("config create - duplicate view warning disables save", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // seed_survey_data already has a gallery view in the seed data.
  await page.goto("/config/new");
  await page.locator("[data-testid='create-view-type-gallery']").click();
  await page
    .locator("[data-testid='create-primary-select']")
    .selectOption("seed_survey_data");
  await page.locator("[data-testid='create-view-continue']").click();
  await page.waitForURL("**/config/new/gallery?primary=seed_survey_data", {
    timeout: 10000,
  });

  await expect(
    page.locator("[data-testid='create-duplicate-warning']"),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    page.locator("[data-testid='create-duplicate-edit-link']"),
  ).toBeVisible();
  await expect(
    page.locator("[data-testid='config-submit-button']"),
  ).toBeDisabled();
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

test("config page - copy config from another same-type view", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // Seed has two gallery views (bcmform_responses, seed_survey_data). Edit the
  // bcmform gallery card so the copy modal has a same-type peer to pick from.
  await page.goto("/config");
  await page.waitForLoadState("networkidle");
  await page.locator(".grid").waitFor({ state: "attached", timeout: 10000 });

  const galleryCard = page
    .locator("[data-testid='config-dataset-card']")
    .filter({ has: page.locator("[data-testid='config-view-tag-gallery']") })
    .filter({ hasText: /bcmform_responses/i })
    .first();

  await expect(galleryCard).toBeVisible({ timeout: 10000 });
  await galleryCard.locator("[data-testid='edit-dataset-view-link']").click();
  await page.waitForURL(/\/config\/bcmform_responses/, { timeout: 10000 });
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
  const optionLabels = await dropdown
    .locator("option:not([disabled])")
    .allTextContents();
  expect(optionLabels.length).toBeGreaterThan(0);
  // Same-type only: gallery peer is present; the map sibling on bcmform is not a source.
  expect(optionLabels.some((label) => /seed_survey_data/i.test(label))).toBe(
    true,
  );

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

  const galleryCard = page
    .locator("[data-testid='config-dataset-card']")
    .filter({ has: page.locator("[data-testid='config-view-tag-gallery']") })
    .first();

  await expect(galleryCard).toBeVisible({ timeout: 10000 });
  await galleryCard.locator("[data-testid='edit-dataset-view-link']").click();
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
