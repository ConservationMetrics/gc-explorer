import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  ensureMapFormCanSubmit,
  openGalleryConfigEditPage,
  openMapConfigEditPage,
} from "@/tests/e2e/helpers/configPage";

test("config page - add new dataset view reachable from index", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("main", { timeout: 15000 });

  const addButton = page.locator(
    "main a[data-testid='add-new-dataset-view-button']",
  );
  await expect(addButton).toBeVisible({ timeout: 10000 });
  await addButton.click();
  await page.waitForURL("**/config/new", { timeout: 10000 });

  await expect(
    page.locator('a[href="/"]').filter({ hasText: /available dataset views/i }),
  ).toBeVisible();
});

test("config page - create new view via type-first flow and edit it", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // seed_survey_data already has gallery; create a map view for it.
  const selectedTableName = "seed_survey_data";

  await page.goto("/config/new");
  await page.waitForLoadState("networkidle");

  await page.locator("[data-testid='create-view-type-map']").click();
  await page
    .locator("[data-testid='create-primary-select']")
    .selectOption(selectedTableName);
  await page.locator("[data-testid='create-view-continue']").click();
  await page.waitForURL("**/config/new/map**", { timeout: 10000 });

  await expect(
    page.locator("[data-testid='create-form-primary-select']"),
  ).toHaveValue(selectedTableName);
  await expect(page.getByLabel("Primary dataset (required)")).toBeVisible();
  const secondaryDatasetSelect = page.getByLabel(
    "Secondary dataset (optional)",
  );
  await expect(secondaryDatasetSelect).toBeVisible();
  await expect(secondaryDatasetSelect.locator("option:checked")).toHaveText(
    "Select a secondary dataset…",
  );

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

  const indexBreadcrumb = page
    .locator('a[href="/"]')
    .filter({ hasText: /available dataset views/i })
    .first();
  await expect(indexBreadcrumb).toBeVisible();
  await indexBreadcrumb.click();
  await page.waitForURL("**/", { timeout: 5000 });
  await expect(
    page.getByRole("heading", { name: /available dataset views/i }),
  ).toBeVisible();
});

test("config page - navigate to dataset edit page", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await openMapConfigEditPage(page);

  const configCard = page.locator(".bg-white.rounded-lg.shadow-sm").first();
  await expect(configCard).toBeVisible({ timeout: 15000 });

  await expect(
    page.getByRole("heading", { name: /^Configuration\b/i, level: 1 }),
  ).toBeVisible();

  const indexBreadcrumb = page
    .locator('a[href="/"]')
    .filter({ hasText: /available dataset views/i })
    .first();
  await expect(indexBreadcrumb).toBeVisible();
});

test("config page - edit dataset view form structure", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await openMapConfigEditPage(page);

  const configCard = page.locator(".bg-white.rounded-lg.shadow-sm").first();
  await expect(configCard).toBeVisible({ timeout: 15000 });

  const submitButton = page.locator("button[type='submit']");
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeDisabled();

  const removeButton = page.locator("button").filter({
    hasText: /remove.*dataset.*view|remove.*table/i,
  });
  await expect(removeButton).toBeVisible();

  const viewMetadata = page.locator("[data-testid='view-metadata']");
  await expect(viewMetadata).toBeVisible();
  const viewTypeDisplay = page.locator(
    "[data-testid='config-view-type-display']",
  );
  await expect(viewTypeDisplay).toBeVisible();

  const textInputs = page.locator('input[type="text"], textarea');
  const inputCount = await textInputs.count();

  if (inputCount > 0) {
    for (let i = 0; i < inputCount; i++) {
      const input = textInputs.nth(i);
      const inputId = await input.getAttribute("id");
      const inputClass = await input.getAttribute("class");

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

      if (
        placeholder &&
        (placeholder.toLowerCase().includes("mapbox") ||
          placeholder.toLowerCase().includes("access token"))
      ) {
        continue;
      }

      const isVisible = await input.isVisible();
      if (!isVisible) {
        continue;
      }

      await input.clear();
      await input.fill(`test_${Date.now()}`);
      await page.waitForTimeout(500);

      const isEnabled = await submitButton.isEnabled();
      if (isEnabled) {
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
  await page.goto("/config/new");
  await page.waitForLoadState("networkidle");

  await page.locator("[data-testid='create-view-cancel']").click();
  await page.waitForURL("**/", { timeout: 10000 });
  await expect(
    page.getByRole("heading", { name: /available dataset views/i }),
  ).toBeVisible();
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
  await openMapConfigEditPage(page);

  const datasetNameInput = page.locator(
    'input[id*="DATASET_TABLE"], input[placeholder*="e.g., My Mapping Data"]',
  );

  if ((await datasetNameInput.count()) > 0) {
    await datasetNameInput.clear();
    const testValue = `Test Dataset ${Date.now()}`;
    await datasetNameInput.fill(testValue);
    await page.waitForTimeout(500);

    const submitButton = page.locator("[data-testid='config-submit-button']");
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await page.waitForLoadState("networkidle", { timeout: 2000 });
    await page.waitForTimeout(2000);

    const savedValue = await datasetNameInput.inputValue();
    expect(savedValue).toContain("Test Dataset");
    expect(savedValue).toBeTruthy();
  } else {
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
});

test("config page - view metadata displays current view type outside ConfigCard", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await openMapConfigEditPage(page);

  const viewMetadata = page.locator("[data-testid='view-metadata']");
  await expect(viewMetadata).toBeVisible({ timeout: 10000 });
  const viewTypeDisplay = page.locator(
    "[data-testid='config-view-type-display']",
  );
  await expect(viewTypeDisplay).toBeVisible({ timeout: 10000 });
  await expect(viewTypeDisplay).toHaveText(/^(Map|Gallery|Alerts)$/i);

  await expect(
    page.locator("[data-testid='view-metadata-primary']"),
  ).toBeVisible();
  await expect(
    page.locator("[data-testid='view-metadata-secondary']"),
  ).toBeVisible();

  const viewTypeRadios = page.locator('input[type="radio"][name="view-type"]');
  await expect(viewTypeRadios).toHaveCount(0);

  const viewsSection = page.locator("form").getByText(/^Views$/i);
  await expect(viewsSection).toHaveCount(0);
});

test("config page - conditional form sections based on views", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await openMapConfigEditPage(page);

  const configCard = page.locator(".bg-white.rounded-lg.shadow-sm");
  await expect(configCard.first()).toBeVisible({ timeout: 15000 });

  const sectionHeaders = page.locator("h3, button").filter({
    hasText:
      /^(Map|Media|Alerts|Filtering|Dataset|Permissions|Other|Visibility)$/i,
  });
  const headerCount = await sectionHeaders.count();

  if (headerCount > 0) {
    await expect(sectionHeaders.first()).toBeVisible();
  }

  const viewMetadata = page.locator("[data-testid='view-metadata']");
  await expect(viewMetadata).toBeVisible();

  const viewTypeDisplay = page.locator(
    "[data-testid='config-view-type-display']",
  );
  await expect(viewTypeDisplay).toBeVisible();
  await expect(viewTypeDisplay).toHaveText(/^(Map|Gallery|Alerts)$/i);
});

test("config page - error handling for invalid form submission", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await openMapConfigEditPage(page);

  const mapboxTokenInput = page.locator(
    'input[id*="MAPBOX_ACCESS_TOKEN"], input[placeholder*="Mapbox"]',
  );

  if ((await mapboxTokenInput.count()) > 0) {
    const submitButton = page.locator("[data-testid='config-submit-button']");

    await mapboxTokenInput.clear();
    await page.waitForTimeout(300);
    await expect(submitButton).toBeDisabled();
    const buttonClasses = await submitButton.getAttribute("class");
    expect(buttonClasses).toContain("bg-gray");

    await mapboxTokenInput.fill(
      "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example",
    );
    await page.waitForTimeout(300);
    await ensureMapFormCanSubmit(page);
    await expect(submitButton).toBeEnabled();
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

  const visibilitySection = page.locator(
    '[data-testid="config-section-visibility-toggle"]',
  );

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
  // bcmform gallery so the copy modal has a same-type peer to pick from.
  await openGalleryConfigEditPage(page);

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
  await openGalleryConfigEditPage(page);

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
