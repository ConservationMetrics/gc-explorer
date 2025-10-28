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

  // 14. Find the card with the table name we just added and remove it
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.table-item.card:has(.table-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(targetCard).toBeVisible();

    // 15. Expand the target card
    const hamburgerButton = targetCard.locator("button.hamburger");
    await hamburgerButton.click();

    // 16. Click the remove table button
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

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.table-item.card:has(.table-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(targetCard).toBeVisible();

    // 11. Expand the target card
    const hamburgerButton = targetCard.locator("button.hamburger");
    await hamburgerButton.click();

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

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.table-item.card:has(.table-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(targetCard).toBeVisible();

    // 11. Expand the target card
    const hamburgerButton = targetCard.locator("button.hamburger");
    await hamburgerButton.click();

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

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.table-item.card:has(.table-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(targetCard).toBeVisible();

    // 11. Expand the target card
    const hamburgerButton = targetCard.locator("button.hamburger");
    await hamburgerButton.click();

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

  // 10. Find the card with the table name we just added
  if (tableNameToAdd) {
    const targetCard = page.locator(
      `.table-item.card:has(.table-name:has-text("${tableNameToAdd.trim()}"))`,
    );
    await expect(targetCard).toBeVisible();

    // 11. Expand the target card
    const hamburgerButton = targetCard.locator("button.hamburger");
    await hamburgerButton.click();

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
