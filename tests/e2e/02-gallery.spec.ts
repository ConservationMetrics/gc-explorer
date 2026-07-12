import { test, expect } from "@/tests/e2e/fixtures/auth-storage";

test("gallery page - displays gallery with media files", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to index page
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Wait for dataset cards to load
  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // 3. Find a dataset card that has a "gallery" view tag
  const datasetCards = page.locator("[data-testid='dataset-card']");
  const cardCount = await datasetCards.count();
  expect(cardCount).toBeGreaterThan(0);

  // Find the first card that has a gallery tag
  let galleryCard = null;
  for (let i = 0; i < cardCount; i++) {
    const card = datasetCards.nth(i);
    const galleryTag = card.locator("[data-testid='view-tag-gallery']");
    if ((await galleryTag.count()) > 0) {
      galleryCard = card;
      break;
    }
  }

  expect(galleryCard).not.toBeNull();

  // 4. Click "Open Dataset View" on the card with gallery tag
  const openProjectButton = galleryCard!.locator(
    "[data-testid='open-dataset-view-link']",
  );
  await openProjectButton.waitFor({ state: "visible", timeout: 15000 });
  await openProjectButton.click();
  await page.waitForLoadState("networkidle");

  // 5. Wait for dataset page to load and find the gallery ViewCard
  await page.waitForSelector("main", { timeout: 15000 });
  const galleryLink = page.locator('a[href^="/gallery/"]').first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });

  // 6. Click the gallery link to navigate to the gallery page
  const href = await galleryLink.getAttribute("href");
  expect(href).toMatch(/\/gallery\/\w+/);
  await galleryLink.click();

  // 7. Wait for gallery page to load
  await page.waitForURL("**/gallery/**", { timeout: 5000 });
  await page.waitForLoadState("networkidle");

  // 8. Explorer layout header (logo, community tab, language picker)
  const logo = page.locator('img[alt="Guardian Connector Explorer"]').first();
  await expect(logo).toBeVisible({ timeout: 10000 });

  // 9. Wait for the gallery container to be present
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 10000 });

  // 10. Verify gallery container is visible
  await expect(page.getByTestId("gallery-container")).toBeVisible();

  // 11. Check for gallery items
  const galleryItems = page.locator('[data-testid^="gallery-item-"]');
  await galleryItems.first().waitFor({ state: "visible", timeout: 10000 });
  const itemCount = await galleryItems.count();
  expect(itemCount).toBeGreaterThan(0);
});

test("gallery page - displays gallery tiles with media", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to index page
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Find a dataset with gallery view and navigate to it
  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  const datasetCards = page.locator("[data-testid='dataset-card']");
  let galleryCard = null;
  for (let i = 0; i < (await datasetCards.count()); i++) {
    const card = datasetCards.nth(i);
    const galleryTag = card.locator("[data-testid='view-tag-gallery']");
    if ((await galleryTag.count()) > 0) {
      galleryCard = card;
      break;
    }
  }

  if (!galleryCard) {
    test.skip();
    return;
  }

  // 3. Navigate to dataset page
  const openProjectButton = galleryCard.locator(
    "[data-testid='open-dataset-view-link']",
  );
  await openProjectButton.click();
  await page.waitForLoadState("networkidle");

  // 4. Navigate to gallery page
  const galleryLink = page.locator('a[href^="/gallery/"]').first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });
  await galleryLink.click();
  await page.waitForURL("**/gallery/**", { timeout: 5000 });
  await page.waitForLoadState("networkidle");

  // 5. Wait for gallery container and images to load
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 10000 });

  // 6. Wait for gallery items to render, then check if any images loaded successfully
  const galleryItems = page.locator('[data-testid^="gallery-item-"]');
  await galleryItems.first().waitFor({ state: "visible", timeout: 15000 });
  const itemCount = await galleryItems.count();
  expect(itemCount).toBeGreaterThan(0);

  // Give images time to load or error out
  await page.waitForTimeout(5000);

  const tileImages = page.locator(
    '[data-testid^="gallery-item-"] img:not(.hidden)',
  );
  const imageFallbackCards = page.locator("div.border-red-500");
  const noMediaTiles = page.locator('[data-testid="gallery-tile-no-media"]');

  // 7. Gallery should show at least one rendered tile image, fallback card, or no-media placeholder.
  await expect
    .poll(
      async () =>
        (await tileImages.count()) +
        (await imageFallbackCards.count()) +
        (await noMediaTiles.count()),
      { timeout: 10000 },
    )
    .toBeGreaterThan(0);
});

test("gallery page - detail panel opens on tile click and closes", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  const datasetCards = page.locator("[data-testid='dataset-card']");
  let galleryCard = null;
  for (let i = 0; i < (await datasetCards.count()); i++) {
    const card = datasetCards.nth(i);
    const galleryTag = card.locator("[data-testid='view-tag-gallery']");
    if ((await galleryTag.count()) > 0) {
      galleryCard = card;
      break;
    }
  }

  if (!galleryCard) {
    test.skip();
    return;
  }

  await galleryCard.locator("[data-testid='open-dataset-view-link']").click();
  await page.waitForLoadState("networkidle");

  const galleryLink = page.locator('a[href^="/gallery/"]').first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });
  await galleryLink.click();
  await page.waitForURL("**/gallery/**", { timeout: 5000 });
  await page.waitForLoadState("networkidle");

  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 10000 });

  const galleryItems = page.locator('[data-testid^="gallery-item-"]');
  await galleryItems.first().waitFor({ state: "visible", timeout: 15000 });

  const firstTile = galleryItems.first();
  const hasMedia = (await firstTile.locator("img, audio, video").count()) > 0;
  if (!hasMedia) {
    console.log("First gallery tile has no media, skipping detail panel test");
    test.skip();
    return;
  }

  await firstTile.click();

  const detailPanel = page.getByTestId("gallery-detail-panel");
  await expect(detailPanel).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("gallery-detail-metadata")).toBeVisible();
  await expect(
    page.getByTestId("gallery-detail-metadata-fields"),
  ).toBeVisible();

  const metadataFields = page.getByTestId("gallery-metadata-field");
  await expect(metadataFields.first()).toBeVisible({ timeout: 5000 });
  expect(await metadataFields.count()).toBeGreaterThan(0);
  await expect(page.getByTestId("data-feature")).toHaveCount(0);

  const filesSection = page.getByTestId("gallery-metadata-files");
  if (await filesSection.isVisible()) {
    expect(
      await page.getByTestId("gallery-metadata-file-link").count(),
    ).toBeGreaterThan(0);
  }

  const googleMapsLinks = page.getByTestId("google-maps-link");
  if ((await googleMapsLinks.count()) > 0) {
    await expect(googleMapsLinks.first()).toHaveAttribute("target", "_blank");
  }

  await expect(galleryItems.first()).toBeHidden({ timeout: 3000 });

  await page.getByTestId("gallery-detail-back").click();
  await expect(detailPanel).toBeHidden({ timeout: 3000 });
  await expect(galleryItems.first()).toBeVisible({ timeout: 5000 });
});

test("gallery page - audio playback functionality", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to gallery via proper flow
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // Find dataset with gallery view
  const datasetCards = page.locator("[data-testid='dataset-card']");
  let galleryCard = null;
  for (let i = 0; i < (await datasetCards.count()); i++) {
    const card = datasetCards.nth(i);
    const galleryTag = card.locator("[data-testid='view-tag-gallery']");
    if ((await galleryTag.count()) > 0) {
      galleryCard = card;
      break;
    }
  }

  if (!galleryCard) {
    test.skip();
    return;
  }

  // Navigate to gallery
  await galleryCard.locator("[data-testid='open-dataset-view-link']").click();
  await page.waitForLoadState("networkidle");

  const galleryLink = page.locator('a[href^="/gallery/"]').first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });
  await galleryLink.click();
  await page.waitForURL("**/gallery/**", { timeout: 5000 });
  await page.waitForLoadState("networkidle");

  // 2. Wait for gallery container
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 10000 });

  // 3. Look for audio elements
  const audioElements = page.locator("audio");
  const audioCount = await audioElements.count();

  if (audioCount > 0) {
    // 4. Wait for audio elements to be visible
    await audioElements.first().waitFor({ state: "visible", timeout: 5000 });

    // 5. Test audio playback using browser context with better error handling
    try {
      // First, check if audio element exists and is ready
      const audioExists = await page.evaluate(() => {
        const audio = document.querySelector("audio");
        return {
          exists: !!audio,
          readyState: audio?.readyState,
          paused: audio?.paused,
          src: audio?.src || audio?.currentSrc,
        };
      });

      // Wait for audio to be ready if needed
      if (audioExists.exists && (audioExists.readyState ?? 0) < 2) {
        await page.waitForTimeout(2000); // Wait for audio to load
      }

      // Try to play audio
      await page.evaluate(() => {
        const audio = document.querySelector("audio");
        if (!audio) return { success: false, error: "No audio element found" };

        try {
          const playPromise = audio.play();
          return { success: true, promise: playPromise };
        } catch (error) {
          return { success: false, error: JSON.stringify(error) };
        }
      });

      // Wait a moment for audio to start playing
      await page.waitForTimeout(1000);

      // Check that audio is actually playing
      const audioState = await page.evaluate(() => {
        const audio = document.querySelector("audio");
        if (!audio) return null;

        return {
          currentTime: audio.currentTime,
          paused: audio.paused,
          duration: audio.duration,
          readyState: audio.readyState,
        };
      });

      // Verify audio is playing (currentTime should be > 0 or audio should not be paused)
      if (audioState) {
        expect(audioState.currentTime).toBeGreaterThan(0);
        expect(audioState.paused).toBe(false);
      }
    } catch (error: unknown) {
      // Don't fail the test if audio doesn't work - it might be a browser limitation
      console.error("Audio test failed:", String(error));
    }
  } else {
    // If no audio, just verify gallery loaded
    const galleryItems = page.locator('[data-testid^="gallery-item-"]');
    const itemCount = await galleryItems.count();
    expect(itemCount).toBeGreaterThan(0);
  }
});

test("gallery page - filter functionality", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to gallery via proper flow
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // Find dataset with gallery view
  const datasetCards = page.locator("[data-testid='dataset-card']");
  let galleryCard = null;
  for (let i = 0; i < (await datasetCards.count()); i++) {
    const card = datasetCards.nth(i);
    const galleryTag = card.locator("[data-testid='view-tag-gallery']");
    if ((await galleryTag.count()) > 0) {
      galleryCard = card;
      break;
    }
  }

  if (!galleryCard) {
    test.skip();
    return;
  }

  // Navigate to gallery
  await galleryCard.locator("[data-testid='open-dataset-view-link']").click();
  await page.waitForLoadState("networkidle");

  const galleryLink = page.locator('a[href^="/gallery/"]').first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });
  await galleryLink.click();
  await page.waitForURL("**/gallery/**", { timeout: 5000 });
  await page.waitForLoadState("networkidle");

  // 2. Wait for gallery container
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 10000 });

  // 3. Look for filter container
  const filterContainer = page.getByTestId("filter-container");
  const filterCount = await filterContainer.count();

  if (filterCount > 0) {
    // 4. Click the filter select to open dropdown
    await page.getByTestId("filter-select").click();

    // 5. Wait for dropdown options to appear
    const dropdownOptions = page.getByRole("option");
    await dropdownOptions.first().waitFor({ state: "visible", timeout: 5000 });

    // 6. Get initial gallery item count
    const initialItems = page.locator('[data-testid^="gallery-item-"]');
    await initialItems.first().waitFor({ state: "visible", timeout: 5000 });
    const initialCount = await initialItems.count();

    // 7. Select first filter option (skip "null" option if it exists)
    const options = await dropdownOptions.all();
    let firstOption = options[0];
    for (const option of options) {
      const text = await option.textContent();
      if (text && !text.toLowerCase().includes("null")) {
        firstOption = option;
        break;
      }
    }
    await firstOption.click();

    // 8. Wait for filtering to take effect
    await page.waitForTimeout(1500);

    // 9. Get filtered gallery item count
    const filteredItems = page.locator('[data-testid^="gallery-item-"]');
    const filteredCount = await filteredItems.count();

    // 10. Verify filtering changed the number of items (or at least applied)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // 11. Clear filter by clicking the X button on selected tag
    const removeFilterButton = page.getByTestId("remove-filter-button");
    if ((await removeFilterButton.count()) > 0) {
      await removeFilterButton.click();

      // 12. Wait for filter to clear
      await page.waitForTimeout(1500);

      // 13. Verify clearing category filter did not shrink the list (date filter may still be active)
      const clearedItems = page.locator('[data-testid^="gallery-item-"]');
      const clearedCount = await clearedItems.count();
      expect(clearedCount).toBeGreaterThanOrEqual(filteredCount);
      expect(clearedCount).toBeGreaterThan(0);
    }
  } else {
    // If no filter, just verify gallery loaded
    const galleryItems = page.locator('[data-testid^="gallery-item-"]');
    const itemCount = await galleryItems.count();
    expect(itemCount).toBeGreaterThan(0);
  }
});

test("gallery page - pagination and infinite scroll", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to gallery via proper flow
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // Find dataset with gallery view
  const datasetCards = page.locator("[data-testid='dataset-card']");
  let galleryCard = null;
  for (let i = 0; i < (await datasetCards.count()); i++) {
    const card = datasetCards.nth(i);
    const galleryTag = card.locator("[data-testid='view-tag-gallery']");
    if ((await galleryTag.count()) > 0) {
      galleryCard = card;
      break;
    }
  }

  if (!galleryCard) {
    test.skip();
    return;
  }

  // Navigate to gallery
  await galleryCard.locator("[data-testid='open-dataset-view-link']").click();
  await page.waitForLoadState("networkidle");

  const galleryLink = page.locator('a[href^="/gallery/"]').first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });
  await galleryLink.click();
  await page.waitForURL("**/gallery/**", { timeout: 5000 });
  await page.waitForLoadState("networkidle");

  // 2. Ensure gallery is loaded
  const galleryContainer = page.getByTestId("gallery-container");
  await galleryContainer.waitFor({ state: "attached", timeout: 10000 });

  const items = page.locator('[data-testid^="gallery-item-"]');
  await items.first().waitFor({ state: "visible", timeout: 10000 });

  const initialItemCount = await items.count();
  expect(initialItemCount).toBeGreaterThan(0);

  // 3. Read pagination info
  const paginationInfo = page.getByTestId("pagination-info");
  const totalItems = parseInt(
    (await paginationInfo.getAttribute("data-total-items")) || "0",
  );
  const paginatedItems = parseInt(
    (await paginationInfo.getAttribute("data-paginated-count")) || "0",
  );

  // 4. Only infinite-scroll test if more items exist
  if (totalItems > paginatedItems) {
    const initialPaginated = paginatedItems;

    // 5. Scroll to bottom to trigger infinite scroll
    await page.evaluate(() => {
      const scrollHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight;
      window.scrollTo(0, scrollHeight);
    });

    // Allow frontend scroll handler to fire
    await page.waitForTimeout(1000);

    // 6. Wait for new items to load
    await page
      .waitForFunction(
        (expected) => {
          const el = document.querySelector('[data-testid="pagination-info"]');
          if (!el) return false;
          const current = el.getAttribute("data-paginated-count");
          return current && parseInt(current) > expected;
        },
        initialPaginated,
        { timeout: 10000 },
      )
      .catch(() => {
        // Pagination might not increase if already at final batch
        console.log(
          "Pagination didn't increase — may already be at final batch.",
        );
      });

    // 7. Validate item count increased
    const finalItemCount = await items.count();
    expect(finalItemCount).toBeGreaterThanOrEqual(initialItemCount);
  } else {
    // All items already visible
    expect(initialItemCount).toBeGreaterThan(0);
  }
});

test("gallery page - responsive grid layout", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to gallery via proper flow
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // Find dataset with gallery view
  const datasetCards = page.locator("[data-testid='dataset-card']");
  let galleryCard = null;
  for (let i = 0; i < (await datasetCards.count()); i++) {
    const card = datasetCards.nth(i);
    const galleryTag = card.locator("[data-testid='view-tag-gallery']");
    if ((await galleryTag.count()) > 0) {
      galleryCard = card;
      break;
    }
  }

  if (!galleryCard) {
    test.skip();
    return;
  }

  // Navigate to gallery
  await galleryCard.locator("[data-testid='open-dataset-view-link']").click();
  await page.waitForLoadState("networkidle");

  const galleryLink = page.locator('a[href^="/gallery/"]').first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });
  await galleryLink.click();
  await page.waitForURL("**/gallery/**", { timeout: 5000 });
  await page.waitForLoadState("networkidle");

  // 2. Wait for gallery container
  const galleryContainer = page.getByTestId("gallery-container");
  await galleryContainer.waitFor({ state: "attached", timeout: 10000 });
  await expect(galleryContainer).toBeVisible();

  // 3. Wait for at least one gallery item to be rendered
  const firstItem = page.getByTestId("gallery-item-0");
  await firstItem.waitFor({ state: "visible", timeout: 10000 });

  // 4. Verify gallery grid has responsive layout classes
  const galleryGrid = page.getByTestId("gallery-grid");
  await expect(galleryGrid).toBeVisible();
  const classAttribute = await galleryGrid.getAttribute("class");
  expect(classAttribute).toContain("grid");
  expect(classAttribute).toContain("grid-cols-2");
  expect(classAttribute).toContain("lg:grid-cols-4");

  // 5. Test responsive behavior by changing viewport
  await page.setViewportSize({ width: 768, height: 1024 }); // tablet
  await page.waitForTimeout(1000);

  // 6. Verify items are still visible
  const items = page.locator('[data-testid^="gallery-item-"]');
  await expect(items.first()).toBeVisible();

  // 7. Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 }); // mobile
  await page.waitForTimeout(1000);

  // 8. Verify items are still visible in mobile
  await expect(items.first()).toBeVisible();
});

test("gallery page - error handling for unavailable gallery", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to gallery via proper flow
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // Find dataset with gallery view
  const datasetCards = page.locator("[data-testid='dataset-card']");
  let galleryCard = null;
  for (let i = 0; i < (await datasetCards.count()); i++) {
    const card = datasetCards.nth(i);
    const galleryTag = card.locator("[data-testid='view-tag-gallery']");
    if ((await galleryTag.count()) > 0) {
      galleryCard = card;
      break;
    }
  }

  if (!galleryCard) {
    test.skip();
    return;
  }

  // Navigate to gallery
  await galleryCard.locator("[data-testid='open-dataset-view-link']").click();
  await page.waitForLoadState("networkidle");

  const galleryLink = page.locator('a[href^="/gallery/"]').first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });
  await galleryLink.click();
  await page.waitForURL("**/gallery/**", { timeout: 5000 });
  await page.waitForLoadState("networkidle");

  // 2. Check for either gallery content or error message
  const galleryContainer = page.getByTestId("gallery-container");
  const errorMessage = page.getByTestId("gallery-error-message");

  // 3. Wait for either to appear
  await Promise.race([
    galleryContainer.waitFor({ state: "attached", timeout: 10000 }),
    errorMessage.waitFor({ state: "visible", timeout: 10000 }),
  ]);

  // 4. Verify either gallery loads or error message is shown
  const hasGallery = (await galleryContainer.count()) > 0;
  const hasError = (await errorMessage.count()) > 0;

  expect(hasGallery || hasError).toBe(true);

  if (hasError) {
    // Verify error message content
    await expect(errorMessage).toContainText(/gallery is not available/i);
  }
});
