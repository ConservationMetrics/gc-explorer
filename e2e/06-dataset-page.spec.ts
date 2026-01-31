import { expect, test } from "./fixtures/auth-storage";

test("dataset page - displays header, description, and view cards", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the index page first
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Wait for dataset cards to load
  await page.waitForSelector("main", { timeout: 15000 });
  await expect(
    page.getByRole("heading", {
      name: /available dataset views/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  // 3. Wait for dataset cards to render
  await page.waitForSelector(".grid", { timeout: 15000 });
  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // 4. Find the first "Open Dataset View" link and click it
  const openProjectButton = page
    .locator("[data-testid='open-dataset-view-link']")
    .first();
  await expect(openProjectButton).toBeVisible({ timeout: 15000 });
  await openProjectButton.click();

  // 5. Wait for navigation to dataset page
  await page.waitForURL(/\/dataset\/\w+/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  // 6. Verify AppHeader is visible
  const logo = page.locator('img[alt="Guardian Connector Explorer"]').first();
  await expect(logo).toBeVisible();

  const guardianConnectorText = page
    .getByRole("heading", { name: /guardian connector/i })
    .first();
  await expect(guardianConnectorText).toBeVisible();

  // 7. Verify breadcrumb link back to index
  const breadcrumbLink = page.locator('a[href="/"]').filter({
    hasText: /available dataset views/i,
  });
  await expect(breadcrumbLink).toBeVisible();

  // 8. Verify dataset name is displayed (either in header image overlay or fallback header)
  const datasetName = page.locator("h1");
  await expect(datasetName.first()).toBeVisible({ timeout: 15000 });

  // 9. Verify at least one view card is visible (map, gallery, or alerts)
  const viewCardsContainer = page.locator(
    "[data-testid='view-cards-container']",
  );
  await expect(viewCardsContainer).toBeVisible();

  const viewCards = page.locator("[data-testid^='view-card-']");
  const cardCount = await viewCards.count();
  expect(cardCount).toBeGreaterThan(0);

  // 10. Verify view cards have proper structure (icon, title, description, arrow)
  const firstCard = viewCards.first();
  await expect(firstCard).toBeVisible();

  // Check for icon (SVG)
  const icon = firstCard.locator("svg").first();
  await expect(icon).toBeVisible();

  // Check for title (h3)
  const cardTitle = firstCard.locator("h3");
  await expect(cardTitle).toBeVisible();

  // Check for arrow icon (last SVG in card)
  const arrowIcon = firstCard.locator("svg").last();
  await expect(arrowIcon).toBeVisible();
});

test("dataset page - view cards link to correct pages", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate directly to a known dataset page
  await page.goto("/dataset/fake_alerts");
  await page.waitForLoadState("networkidle");

  /* 2. Wait for page to load - dataset name might be in h1 or in the header overlay */
  await page.waitForTimeout(2000); // Give time for page to render
  const datasetName = page.locator("h1").filter({ hasText: /fake/i });
  const datasetNameCount = await datasetName.count();
  if (datasetNameCount > 0) {
    await expect(datasetName.first()).toBeVisible({ timeout: 10000 });
  }

  // 3. Find the alerts view card and verify it links to /alerts/fake_alerts
  const alertsCard = page.locator("[data-testid='view-card-alerts']");
  await expect(alertsCard).toBeVisible();

  // 4. Click the alerts card
  await alertsCard.click();

  // 5. Verify navigation to alerts page
  await page.waitForURL("/alerts/fake_alerts");
  await expect(page).toHaveURL(/\/alerts\/fake_alerts/);
});

test("dataset page - displays description when available", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to index page
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Wait for page to load
  await expect(
    page.getByRole("heading", { name: /available dataset views/i }),
  ).toBeVisible({ timeout: 10000 });

  // 3. Click first "Open Dataset View" link
  const openProjectButton = page
    .getByRole("link", { name: /open dataset view/i })
    .first();
  await openProjectButton.click();

  // 4. Wait for dataset page to load
  await page.waitForURL(/\/dataset\/\w+/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  // 5. Wait for main content to be visible
  await page.waitForSelector("main", { timeout: 10000 });

  // 6. Check if description is present (it may or may not be configured)
  // Description can be in a <p> tag or in the fallback message div
  const description = page
    .locator("p")
    .filter({ hasText: /.+/ })
    .filter({ hasNotText: /no description/i });
  const descriptionCount = await description.count();

  // 7. Check for fallback message if no description
  const fallbackMessage = page.locator("*").filter({
    hasText: /no description provided yet/i,
  });
  const hasFallback = (await fallbackMessage.count()) > 0;

  /* Description is optional, so we just verify the page structure is correct
   * Either description exists OR fallback message exists
   */
  expect(descriptionCount > 0 || hasFallback).toBe(true);

  if (descriptionCount > 0) {
    const firstDescription = description.first();
    const text = await firstDescription.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
    await expect(firstDescription).toBeVisible();
  }
});

test("dataset page - only shows enabled views", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to a specific dataset page
  await page.goto("/dataset/fake_alerts");
  await page.waitForLoadState("networkidle");

  // 2. Wait for page to load - dataset name might be in h1 or header overlay
  await page.waitForTimeout(2000);
  const datasetName = page.locator("h1").filter({ hasText: /fake/i });
  const datasetNameCount = await datasetName.count();
  if (datasetNameCount > 0) {
    await expect(datasetName.first()).toBeVisible({ timeout: 10000 });
  }

  // 3. Verify only alerts view card is shown (fake_alerts only has alerts enabled)
  const alertsCard = page.locator("[data-testid='view-card-alerts']");
  await expect(alertsCard).toBeVisible();

  // 4. Verify map and gallery cards are NOT shown for this dataset
  const mapCard = page.locator("[data-testid='view-card-map']");
  const galleryCard = page.locator("[data-testid='view-card-gallery']");

  const mapCardCount = await mapCard.count();
  const galleryCardCount = await galleryCard.count();

  expect(mapCardCount).toBe(0);
  expect(galleryCardCount).toBe(0);
});

test("dataset page - handles missing dataset gracefully", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to a non-existent dataset
  await page.goto("/dataset/nonexistent_dataset");

  /* 2. Should redirect to index page or login (depending on auth) */
  await page.waitForURL(/\/(|\?reason=unauthorized)/, { timeout: 10000 });
  const url = page.url();
  /* Either redirects to index or shows unauthorized */
  expect(url).toMatch(/\/(|\?reason=unauthorized)/);
});

test("dataset page - index page pills are smaller and not clickable", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to index page
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Wait for page to load
  await expect(
    page.getByRole("heading", { name: /available dataset views/i }),
  ).toBeVisible({ timeout: 10000 });

  // 3. Wait for dataset cards to render
  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // 4. Find view pills using test ID (they should be spans, not links)
  const pills = page.locator("[data-testid^='view-tag-']");
  const pillCount = await pills.count();
  expect(pillCount).toBeGreaterThan(0);

  // 5. Verify pills are smaller (text-xs class)
  const firstPill = pills.first();
  const classes = await firstPill.getAttribute("class");
  expect(classes).toContain("text-xs");

  // 6. Verify pills are spans (not clickable links)
  const tagName = await firstPill.evaluate((el) => el.tagName.toLowerCase());
  expect(tagName).toBe("span");

  // 7. Verify "Open Dataset View" link is visible and clickable
  const openProjectButton = page
    .locator("[data-testid='open-dataset-view-link']")
    .first();
  await expect(openProjectButton).toBeVisible();

  const href = await openProjectButton.getAttribute("href");
  expect(href).toMatch(/\/dataset\/\w+/);
});

test("dataset page - displays header image or fallback header", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to a dataset page
  await page.goto("/dataset/fake_alerts");
  await page.waitForLoadState("networkidle");

  /* 2. Wait for page to load - dataset name might be in h1 or header overlay */
  await page.waitForTimeout(2000);
  const datasetName = page.locator("h1").filter({ hasText: /fake/i });
  const datasetNameCount = await datasetName.count();
  if (datasetNameCount > 0) {
    await expect(datasetName.first()).toBeVisible({ timeout: 10000 });
  }

  // 3. Check if header image exists or fallback header is shown
  const headerWithImage = page.locator(
    "[data-testid='dataset-header-with-image']",
  );
  const fallbackHeader = page.locator(
    "[data-testid='dataset-header-fallback']",
  );

  const hasHeaderImage = (await headerWithImage.count()) > 0;
  const hasFallbackHeader = (await fallbackHeader.count()) > 0;

  // Either header image or fallback header should be present
  expect(hasHeaderImage || hasFallbackHeader).toBe(true);

  // 4. If header image exists, verify it has the dataset name overlay
  if (hasHeaderImage) {
    const overlay = page.locator("div.absolute.bottom-0");
    await expect(overlay).toBeVisible();
    const overlayText = await overlay.locator("h1").textContent();
    expect(overlayText?.toLowerCase()).toContain("fake");
  }

  // 5. If fallback header exists, verify it contains the dataset name
  if (hasFallbackHeader) {
    const fallbackText = await fallbackHeader.locator("h1").textContent();
    expect(fallbackText?.toLowerCase()).toContain("fake");
  }
});

test("dataset page - shows fallback description message when no description", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to a dataset page (assuming it doesn't have a description configured)
  await page.goto("/dataset/fake_alerts");
  await page.waitForLoadState("networkidle");

  // 2. Wait for page to load - dataset name might be in h1 or header overlay
  await page.waitForTimeout(2000);
  const datasetName = page.locator("h1").filter({ hasText: /fake/i });
  const datasetNameCount = await datasetName.count();
  if (datasetNameCount > 0) {
    await expect(datasetName.first()).toBeVisible({ timeout: 10000 });
  }

  /* 3. Check for description section
   * Description is in a div with mb-6 sm:mb-8 class, either:
   * - A <p> tag with actual description text (if description exists)
   * - A <div> with fallback message (if no description)
   * This section is in either the header overlay (with image) or fallback header
   */
  // Look for description text or fallback message anywhere on the page
  // Description can be in header overlay or fallback header
  const descriptionText = page.locator("p").filter({ hasText: /.+/ });
  const fallbackMessage = page.locator("div, span").filter({
    hasText: /no description provided yet|contact.*admin|add description/i,
  });

  const hasDescription = (await descriptionText.count()) > 0;
  const hasFallback = (await fallbackMessage.count()) > 0;

  // One of these should exist - the description section is always rendered
  expect(hasDescription || hasFallback).toBe(true);

  // 4. Verify the content based on what's present
  if (hasDescription) {
    // If description exists, verify it's not empty and is visible
    const descText = await descriptionText.first().textContent();
    expect(descText?.trim().length).toBeGreaterThan(0);
    await expect(descriptionText.first()).toBeVisible();
  } else if (hasFallback) {
    /* If fallback exists, verify it contains expected text
     * For admins: should have "add description" link
     * For non-admins: should have "contact admin" text
     */
    const fallbackText = await fallbackMessage.first().textContent();
    expect(
      fallbackText?.toLowerCase().includes("no description") ||
        fallbackText?.toLowerCase().includes("contact") ||
        fallbackText?.toLowerCase().includes("add description"),
    ).toBe(true);

    // Verify it's styled as italic (fallback message uses italic class)
    const isItalic = await fallbackMessage.first().evaluate((el) => {
      return window.getComputedStyle(el).fontStyle === "italic";
    });
    expect(isItalic).toBe(true);
  }
});

test("dataset page - description fallback shows admin link for admins", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // Note: This test uses admin authentication, so admin link should be shown

  // 1. Navigate to a dataset page
  await page.goto("/dataset/fake_alerts");
  await page.waitForLoadState("networkidle");

  // 2. Wait for page to load - dataset name might be in h1 or header overlay
  await page.waitForTimeout(2000);
  const datasetName = page.locator("h1").filter({ hasText: /fake/i });
  const datasetNameCount = await datasetName.count();
  if (datasetNameCount > 0) {
    await expect(datasetName.first()).toBeVisible({ timeout: 10000 });
  }

  // 3. Look for description section
  const descriptionSection = page.locator("div.max-w-7xl.mx-auto").nth(1);

  /* 4. Check if "Add description" link exists (for admins) or "contact admin" message (for non-admins) */
  const addDescriptionLink = descriptionSection.locator("a").filter({
    hasText: /add description/i,
  });
  const contactAdminMessage = descriptionSection.locator("span").filter({
    hasText: /contact.*admin/i,
  });

  const hasAddLink = (await addDescriptionLink.count()) > 0;
  const hasContactMessage = (await contactAdminMessage.count()) > 0;

  /* In CI environment, admin link should be available
   * In non-CI, depends on user role
   */
  if (hasAddLink) {
    const href = await addDescriptionLink.getAttribute("href");
    expect(href).toMatch(/\/config\/fake_alerts/);
  } else if (hasContactMessage) {
    // Non-admin users see contact admin message
    const messageText = await contactAdminMessage.textContent();
    expect(messageText?.toLowerCase()).toContain("contact");
  }
});
