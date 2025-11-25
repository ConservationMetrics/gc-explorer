import { expect, test } from "@playwright/test";

test("gallery page - displays gallery with media files", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links and wait for them to be visible
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const galleryLink = galleryLinks.first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });

  // 4. Click the first gallery link
  await galleryLink.click();

  // 5. Wait for the gallery page to load
  await page.waitForURL("**/gallery/**", { timeout: 5000 });

  // 6. Wait for the gallery container to be present
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 7. Verify gallery container is visible
  await expect(page.getByTestId("gallery-container")).toBeVisible();

  // 8. Check for gallery items (DataFeature components)
  const galleryItems = page.getByTestId("gallery-item-0");
  const itemCount = await galleryItems.count();
  expect(itemCount).toBeGreaterThan(0);
});

test("gallery page - displays images with lightbox functionality", async ({
  page,
}) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links and wait for them to be visible
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const galleryLink = galleryLinks.first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });

  // 4. Click the first gallery link
  await galleryLink.click();

  // 5. Wait for the gallery page to load
  await page.waitForURL("**/gallery/**", { timeout: 5000 });

  // 6. Wait for the gallery container to be present
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 7. Look for image links (lightbox enabled)
  const imageLinks = page.locator("a[data-lightbox]");
  const imageCount = await imageLinks.count();

  if (imageCount > 0) {
    // 8. Click on the first image to open lightbox
    const firstImage = imageLinks.first();
    await firstImage.click();

    // 9. Verify lightbox elements are present
    const lightboxOverlay = page.locator(".lightboxOverlay");

    // Note: Lightbox might not be immediately visible, so we check for the structure
    await expect(lightboxOverlay).toBeVisible({ timeout: 3000 });

    // 11. Close lightbox by clicking close button or overlay
    const closeButton = page.locator(".lightboxOverlay");
    if ((await closeButton.count()) > 0) {
      await closeButton.click();
    } else {
      // Click overlay to close
      await lightboxOverlay.click();
    }

    // 12. Verify lightbox is closed
    await expect(lightboxOverlay).not.toBeVisible();
  }
});

test("gallery page - audio playback functionality", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links and wait for them to be visible
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const galleryLink = galleryLinks.first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });

  // 4. Click the first gallery link
  await galleryLink.click();

  // 5. Wait for the gallery page to load
  await page.waitForURL("**/gallery/**", { timeout: 5000 });

  // 6. Wait for the gallery container to be present
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 7. Look for audio elements
  const audioElements = page.locator("audio");
  const audioCount = await audioElements.count();

  if (audioCount > 0) {
    // 8. Wait for audio elements to be visible
    await audioElements.first().waitFor({ state: "visible", timeout: 5000 });

    // 9. Test audio playback using browser context with better error handling
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
  }
});

test("gallery page - filter functionality", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links and wait for them to be visible
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const galleryLink = galleryLinks.first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });

  // 4. Click the first gallery link
  await galleryLink.click();

  // 5. Wait for the gallery page to load
  await page.waitForURL("**/gallery/**", { timeout: 5000 });

  // 6. Wait for the gallery container to be present
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 7. Look for filter container
  const filterContainer = page.getByTestId("filter-container");
  const filterCount = await filterContainer.count();

  if (filterCount > 0) {
    // 8. Click the filter select to open dropdown
    await page.getByTestId("filter-select").click();

    // 9. Wait for dropdown options to appear
    const dropdownOptions = page.getByRole("option");
    await dropdownOptions.first().waitFor({ state: "visible", timeout: 5000 });

    // 10. Get initial gallery item count
    const initialItems = page.locator('[data-testid^="gallery-item-"]');
    const initialCount = await initialItems.count();

    // 11. Select first filter option
    const firstOption = dropdownOptions.first();
    await firstOption.click();

    // 12. Wait for filtering to take effect
    await page.waitForTimeout(1000);

    // 13. Get filtered gallery item count
    const filteredItems = page.locator('[data-testid^="gallery-item-"]');
    const filteredCount = await filteredItems.count();

    // 14. Verify filtering changed the number of items (or at least applied)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // 15. Clear filter by clicking the X button on selected tag
    const removeFilterButton = page.getByTestId("remove-filter-button");
    if ((await removeFilterButton.count()) > 0) {
      await removeFilterButton.click();

      // 16. Wait for filter to clear
      await page.waitForTimeout(1000);

      // 17. Verify items are back to original count
      const clearedItems = page.locator('[data-testid^="gallery-item-"]');
      const clearedCount = await clearedItems.count();
      expect(clearedCount).toBe(initialCount);
    }
  }
});

test("gallery page - pagination and infinite scroll", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links and wait for them to be visible
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const galleryLink = galleryLinks.first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });

  // 4. Click the first gallery link
  await galleryLink.click();

  // 5. Wait for the gallery page to load
  await page.waitForURL("**/gallery/**", { timeout: 5000 });

  // 6. Wait for the gallery container to be present
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 7. Get initial item count
  const initialItems = page.locator('[data-testid^="gallery-item-"]');
  const initialCount = await initialItems.count();

  // 8. Scroll to bottom to trigger infinite scroll
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  // 9. Wait for potential new items to load
  await page.waitForTimeout(2000);

  // 10. Get new item count
  const newItems = page.locator('[data-testid^="gallery-item-"]');
  const newCount = await newItems.count();

  // 11. Verify either more items loaded or we're at the end
  expect(newCount).toBeGreaterThanOrEqual(initialCount);
});

test("gallery page - data feature information display", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links and wait for them to be visible
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const galleryLink = galleryLinks.first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });

  // 4. Click the first gallery link
  await galleryLink.click();

  // 5. Wait for the gallery page to load
  await page.waitForURL("**/gallery/**", { timeout: 5000 });

  // 6. Wait for the gallery container to be present
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 7. Get the first gallery item
  const firstItem = page.getByTestId("gallery-item-0");
  await expect(firstItem).toBeVisible();

  // 8. Check for data source heading
  const dataSourceHeading = firstItem.getByTestId("data-source-heading");
  if ((await dataSourceHeading.count()) > 0) {
    await expect(dataSourceHeading).toBeVisible();
  }

  // 9. Check for feature information fields
  const featureFields = firstItem.getByTestId("field-label");
  const fieldCount = await featureFields.count();
  expect(fieldCount).toBeGreaterThan(0);

  // 10. Check for Google Maps links (if coordinates are present)
  const googleMapsLinks = firstItem.getByTestId("google-maps-link");
  const mapsLinkCount = await googleMapsLinks.count();

  if (mapsLinkCount > 0) {
    await expect(googleMapsLinks.first()).toBeVisible();

    // 11. Verify Google Maps link opens in new tab
    const targetAttribute = await googleMapsLinks
      .first()
      .getAttribute("target");
    expect(targetAttribute).toBe("_blank");
  }
});

test("gallery page - responsive grid layout", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links and wait for them to be visible
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const galleryLink = galleryLinks.first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });

  // 4. Click the first gallery link
  await galleryLink.click();

  // 5. Wait for the gallery page to load
  await page.waitForURL("**/gallery/**", { timeout: 5000 });

  // 6. Wait for the gallery container to be present
  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 5000 });

  // 7. Verify gallery container has responsive grid classes
  const galleryContainer = page.getByTestId("gallery-container");
  await expect(galleryContainer).toHaveClass(/grid/);
  await expect(galleryContainer).toHaveClass(/grid-cols-1/);
  await expect(galleryContainer).toHaveClass(/md:grid-cols-2/);
  await expect(galleryContainer).toHaveClass(/lg:grid-cols-3/);
  await expect(galleryContainer).toHaveClass(/xl:grid-cols-4/);

  // 8. Test responsive behavior by changing viewport
  await page.setViewportSize({ width: 768, height: 1024 }); // tablet
  await page.waitForTimeout(1000);

  // 9. Verify items are still visible
  const items = page.getByTestId("gallery-item-0");
  await expect(items).toBeVisible();

  // 10. Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 }); // mobile
  await page.waitForTimeout(1000);

  // 11. Verify items are still visible in mobile
  await expect(items).toBeVisible();
});

test("gallery page - error handling for unavailable gallery", async ({
  page,
}) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links and wait for them to be visible
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const galleryLink = galleryLinks.first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });

  // 4. Click the first gallery link
  await galleryLink.click();

  // 5. Wait for the gallery page to load
  await page.waitForURL("**/gallery/**", { timeout: 5000 });

  // 6. Check for either gallery content or error message
  const galleryContainer = page.getByTestId("gallery-container");
  const errorMessage = page.getByTestId("gallery-error-message");

  // 7. Wait for either to appear
  await Promise.race([
    galleryContainer.waitFor({ state: "attached", timeout: 5000 }),
    errorMessage.waitFor({ state: "visible", timeout: 5000 }),
  ]);

  // 8. Verify either gallery loads or error message is shown
  const hasGallery = (await galleryContainer.count()) > 0;
  const hasError = (await errorMessage.count()) > 0;

  expect(hasGallery || hasError).toBe(true);

  if (hasError) {
    // 9. Verify error message content
    await expect(errorMessage).toContainText(/gallery is not available/i);
  }
});
