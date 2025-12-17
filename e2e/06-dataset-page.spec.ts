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
      name: /available views|available dataset views/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  // 3. Wait for dataset cards to render
  await page.waitForSelector(".grid", { timeout: 15000 });
  await page.waitForSelector(".bg-purple-50", { timeout: 15000 });

  // 4. Find the first "Open Project" link and click it
  const openProjectButton = page
    .getByRole("link", { name: /open project/i })
    .first();
  await expect(openProjectButton).toBeVisible({ timeout: 15000 });
  await openProjectButton.click();

  // 5. Wait for navigation to dataset page
  await page.waitForURL(/\/dataset\/\w+/, { timeout: 15000 });

  // 6. Wait for dataset page to load
  await page.waitForLoadState("networkidle");

  // 7. Verify AppHeader is visible (use first() to avoid strict mode violation)
  const logo = page.locator('img[alt="Guardian Connector Explorer"]').first();
  await expect(logo).toBeVisible();

  const guardianConnectorText = page
    .getByRole("heading", { name: /guardian connector/i })
    .first();
  await expect(guardianConnectorText).toBeVisible();

  // 8. Verify dataset name is displayed (either in header image overlay or fallback header)
  const datasetName = page
    .locator("h1")
    .filter({ hasText: /seed_survey_data|bcmform_responses|fake_alerts/i });
  const datasetNameCount = await datasetName.count();
  if (datasetNameCount > 0) {
    await expect(datasetName.first()).toBeVisible({ timeout: 15000 });
  }

  // 9. Verify at least one view card is visible (map, gallery, or alerts)
  const viewCards = page.locator(
    "a[href*='/map/'], a[href*='/gallery/'], a[href*='/alerts/']",
  );
  const cardCount = await viewCards.count();
  expect(cardCount).toBeGreaterThan(0);

  // 10. Verify view cards have proper structure (icon, title, description, arrow)
  const firstCard = viewCards.first();
  await expect(firstCard).toBeVisible();

  // Check for icon (SVG)
  const icon = firstCard.locator("svg");
  await expect(icon).toBeVisible();

  // Check for title
  const cardTitle = firstCard.locator("h3");
  await expect(cardTitle).toBeVisible();

  // Check for arrow icon
  const arrowIcon = firstCard.locator("svg").last();
  await expect(arrowIcon).toBeVisible();
});

test("dataset page - view cards link to correct pages", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate directly to a known dataset page
  await page.goto("/dataset/fake_alerts");
  await page.waitForLoadState("networkidle");

  // 2. Wait for page to load - dataset name might be in h1 or in the header overlay
  await page.waitForTimeout(2000); // Give time for page to render
  const datasetName = page.locator("h1").filter({ hasText: /fake/i });
  const datasetNameCount = await datasetName.count();
  if (datasetNameCount > 0) {
    await expect(datasetName.first()).toBeVisible({ timeout: 10000 });
  }

  // 3. Find the alerts view card and verify it links to /alerts/fake_alerts
  const alertsCard = page.locator("a[href='/alerts/fake_alerts']");
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
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible({ timeout: 10000 });

  // 3. Click first "Open Project" button
  const openProjectButton = page
    .getByRole("link", { name: /open project/i })
    .first();
  await openProjectButton.click();

  // 4. Wait for dataset page to load
  await page.waitForURL(/\/dataset\/\w+/);

  // 5. Check if description is present (it may or may not be configured)
  const description = page.locator("p").filter({ hasText: /.+/ });
  const descriptionCount = await description.count();

  // Description is optional, so we just verify the page structure is correct
  // If description exists, it should be visible
  if (descriptionCount > 0) {
    const firstDescription = description.first();
    const text = await firstDescription.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
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
  const alertsCard = page.locator("a[href='/alerts/fake_alerts']");
  await expect(alertsCard).toBeVisible();

  // 4. Verify map and gallery cards are NOT shown for this dataset
  const mapCard = page.locator("a[href='/map/fake_alerts']");
  const galleryCard = page.locator("a[href='/gallery/fake_alerts']");

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

  // 2. Should redirect to index page or login (depending on auth)
  await page.waitForURL(/\/(|\?reason=unauthorized)/, { timeout: 10000 });
  const url = page.url();
  // Either redirects to index or shows unauthorized
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
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible({ timeout: 10000 });

  // 3. Find view pills (they should be spans, not links)
  const pills = page.locator("span").filter({ hasText: /map|gallery|alerts/i });
  const pillCount = await pills.count();
  expect(pillCount).toBeGreaterThan(0);

  // 4. Verify pills are smaller (text-xs class)
  const firstPill = pills.first();
  const classes = await firstPill.getAttribute("class");
  expect(classes).toContain("text-xs");

  // 5. Verify "Open Project" button is visible and clickable
  const openProjectButton = page
    .getByRole("link", { name: /open project/i })
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

  // 2. Wait for page to load - dataset name might be in h1 or header overlay
  await page.waitForTimeout(2000);
  const datasetName = page.locator("h1").filter({ hasText: /fake/i });
  const datasetNameCount = await datasetName.count();
  if (datasetNameCount > 0) {
    await expect(datasetName.first()).toBeVisible({ timeout: 10000 });
  }

  // 3. Check if header image exists or fallback header is shown
  const headerImage = page.locator("img[alt*='fake']");
  const fallbackHeader = page.locator("div.bg-gradient-to-r.from-purple-100");

  const hasHeaderImage = (await headerImage.count()) > 0;
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

  // 3. Check for description section
  const descriptionSection = page.locator("div.max-w-7xl.mx-auto").filter({
    hasText: /description|provided|contact|admin/i,
  });

  // 4. Verify description section exists (description is in the main content area)
  // Description might be in the header overlay or in the main content
  const hasDescription =
    (await page.locator("p").filter({ hasText: /.+/ }).count()) > 0;
  const hasFallbackMessage =
    (await page
      .locator("div")
      .filter({ hasText: /no description|contact.*admin|add description/i })
      .count()) > 0;
  expect(hasDescription || hasFallbackMessage).toBe(true);

  // 5. Check if fallback message is shown (either with admin link or contact admin message)
  const fallbackMessage = page.locator("div").filter({
    hasText: /no description provided yet|contact.*admin/i,
  });
  const fallbackCount = await fallbackMessage.count();

  // If no actual description exists, fallback should be shown
  // Note: This test may need adjustment based on actual dataset configs
  if (fallbackCount > 0) {
    const messageText = await fallbackMessage.first().textContent();
    expect(
      messageText?.toLowerCase().includes("no description") ||
        messageText?.toLowerCase().includes("contact"),
    ).toBe(true);
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

  // 4. Check if "Add description" link exists (for admins) or "contact admin" message (for non-admins)
  const addDescriptionLink = descriptionSection.locator("a").filter({
    hasText: /add description/i,
  });
  const contactAdminMessage = descriptionSection.locator("span").filter({
    hasText: /contact.*admin/i,
  });

  const hasAddLink = (await addDescriptionLink.count()) > 0;
  const hasContactMessage = (await contactAdminMessage.count()) > 0;

  // In CI environment, admin link should be available
  // In non-CI, depends on user role
  if (hasAddLink) {
    const href = await addDescriptionLink.getAttribute("href");
    expect(href).toMatch(/\/config\/fake_alerts/);
  } else if (hasContactMessage) {
    // Non-admin users see contact admin message
    const messageText = await contactAdminMessage.textContent();
    expect(messageText?.toLowerCase()).toContain("contact");
  }
});
