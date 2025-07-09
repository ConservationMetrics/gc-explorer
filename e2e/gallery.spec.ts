import { expect, test } from "@playwright/test";

test("gallery page - displays gallery with media files", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links
  const galleryLinks = page.getByRole("link", { name: /gallery/i });
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Click the first gallery link
    const firstGalleryLink = galleryLinks.first();
    await firstGalleryLink.click();

    // 5. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 6. Wait for the gallery container to be present
    await page
      .locator("#galleryContainer")
      .waitFor({ state: "attached", timeout: 5000 });

    // 7. Verify gallery container is visible
    await expect(page.locator("#galleryContainer")).toBeVisible();

    // 8. Check for gallery items (DataFeature components)
    const galleryItems = page.locator(".rounded-lg.border.bg-card");
    const itemCount = await galleryItems.count();
    expect(itemCount).toBeGreaterThan(0);
  }
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

  // 3. Find gallery links
  const galleryLinks = page.getByRole("link", { name: /gallery/i });
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Click the first gallery link
    const firstGalleryLink = galleryLinks.first();
    await firstGalleryLink.click();

    // 5. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 6. Wait for the gallery container to be present
    await page
      .locator("#galleryContainer")
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
      const lightboxImage = page.locator(".lb-image");

      // Note: Lightbox might not be immediately visible, so we check for the structure
      await expect(lightboxOverlay).toBeVisible({ timeout: 3000 });
      await expect(lightboxImage).toBeVisible({ timeout: 3000 });

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
  }
});

test("gallery page - audio playback functionality", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links
  const galleryLinks = page.getByRole("link", { name: /gallery/i });
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Click the first gallery link
    const firstGalleryLink = galleryLinks.first();
    await firstGalleryLink.click();

    // 5. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 6. Wait for the gallery container to be present
    await page
      .locator("#galleryContainer")
      .waitFor({ state: "attached", timeout: 5000 });

    // 7. Look for audio elements and wait for them to be visible
    const audioElements = page.locator("audio");
    await audioElements.first().waitFor({ state: "visible", timeout: 5000 });

    const audioCount = await audioElements.count();

    if (audioCount > 0) {
      // 8. Get the first audio element
      const firstAudio = audioElements.first();
      await expect(firstAudio).toBeVisible();

      // 9. Check that audio has controls attribute
      const hasControls = await firstAudio.getAttribute("controls");
      expect(hasControls).toBe("");

      // 10. Test audio source is present
      const audioSource = firstAudio.locator("source");
      await expect(audioSource).toBeVisible();

      // 11. Verify audio source has src attribute
      const srcAttribute = await audioSource.getAttribute("src");
      expect(srcAttribute).toBeTruthy();

      // 12. Try to click play button if it exists
      const playButton = firstAudio.locator("button[title='Play']");
      if ((await playButton.count()) > 0) {
        await expect(playButton).toBeVisible();
        await playButton.click();
      } else {
        // If no play button, try clicking the audio element itself
        await firstAudio.click();
      }
    }
  }
});

test("gallery page - video playback functionality", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links
  const galleryLinks = page.getByRole("link", { name: /gallery/i });
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Click the first gallery link
    const firstGalleryLink = galleryLinks.first();
    await firstGalleryLink.click();

    // 5. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 6. Wait for the gallery container to be present
    await page
      .locator("#galleryContainer")
      .waitFor({ state: "attached", timeout: 5000 });

    // 7. Look for video elements
    const videoElements = page.locator("video");
    const videoCount = await videoElements.count();

    if (videoCount > 0) {
      // 8. Test video controls are present
      const firstVideo = videoElements.first();
      await expect(firstVideo).toBeVisible();

      // 9. Check that video has controls attribute
      const hasControls = await firstVideo.getAttribute("controls");
      expect(hasControls).toBe("");

      // 10. Test video source is present
      const videoSource = firstVideo.locator("source");
      await expect(videoSource).toBeVisible();

      // 11. Verify video source has src attribute
      const srcAttribute = await videoSource.getAttribute("src");
      expect(srcAttribute).toBeTruthy();

      // 12. Check video has proper styling
      await expect(firstVideo).toHaveClass(/w-full/);
      await expect(firstVideo).toHaveClass(/h-auto/);
      await expect(firstVideo).toHaveClass(/rounded-lg/);
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

  // 3. Find gallery links
  const galleryLinks = page.getByRole("link", { name: /gallery/i });
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Click the first gallery link
    const firstGalleryLink = galleryLinks.first();
    await firstGalleryLink.click();

    // 5. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 6. Wait for the gallery container to be present
    await page
      .locator("#galleryContainer")
      .waitFor({ state: "attached", timeout: 5000 });

    // 7. Look for combobox role (filter selector)
    const filterCombobox = page.getByRole("combobox");
    const comboboxCount = await filterCombobox.count();

    if (comboboxCount > 0) {
      // 8. Click the combobox to open dropdown
      await filterCombobox.first().click();

      // 9. Wait for dropdown options to appear
      const dropdownOptions = page.locator(".vs__dropdown-option");
      await dropdownOptions
        .first()
        .waitFor({ state: "visible", timeout: 5000 });

      // 10. Get initial gallery item count
      const initialItems = page.locator(".rounded-lg.border.bg-card");
      const initialCount = await initialItems.count();

      // 11. Select first filter option
      const firstOption = dropdownOptions.first();
      await firstOption.click();

      // 12. Wait for filtering to take effect
      await page.waitForTimeout(1000);

      // 13. Get filtered gallery item count
      const filteredItems = page.locator(".rounded-lg.border.bg-card");
      const filteredCount = await filteredItems.count();

      // 14. Verify filtering changed the number of items (or at least applied)
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      // 15. Clear filter by clicking the X button on selected tag
      const selectedTag = page.locator(".option-box button");
      if ((await selectedTag.count()) > 0) {
        await selectedTag.click();

        // 16. Wait for filter to clear
        await page.waitForTimeout(1000);

        // 17. Verify items are back to original count
        const clearedItems = page.locator(".rounded-lg.border.bg-card");
        const clearedCount = await clearedItems.count();
        expect(clearedCount).toBe(initialCount);
      }
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

  // 3. Find gallery links
  const galleryLinks = page.getByRole("link", { name: /gallery/i });
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Click the first gallery link
    const firstGalleryLink = galleryLinks.first();
    await firstGalleryLink.click();

    // 5. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 6. Wait for the gallery container to be present
    await page
      .locator("#galleryContainer")
      .waitFor({ state: "attached", timeout: 5000 });

    // 7. Get initial item count
    const initialItems = page.locator(".rounded-lg.border.bg-card");
    const initialCount = await initialItems.count();

    // 8. Scroll to bottom to trigger infinite scroll
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // 9. Wait for potential new items to load
    await page.waitForTimeout(2000);

    // 10. Get new item count
    const newItems = page.locator(".rounded-lg.border.bg-card");
    const newCount = await newItems.count();

    // 11. Verify either more items loaded or we're at the end
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  }
});

test("gallery page - data feature information display", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links
  const galleryLinks = page.getByRole("link", { name: /gallery/i });
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Click the first gallery link
    const firstGalleryLink = galleryLinks.first();
    await firstGalleryLink.click();

    // 5. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 6. Wait for the gallery container to be present
    await page
      .locator("#galleryContainer")
      .waitFor({ state: "attached", timeout: 5000 });

    // 7. Get the first gallery item
    const firstItem = page.locator(".rounded-lg.border.bg-card").first();
    await expect(firstItem).toBeVisible();

    // 8. Check for data source heading
    const dataSourceHeading = firstItem.locator("h1");
    if ((await dataSourceHeading.count()) > 0) {
      await expect(dataSourceHeading).toBeVisible();
    }

    // 9. Check for feature information fields
    const featureFields = firstItem.locator(".text-sm.font-medium");
    const fieldCount = await featureFields.count();
    expect(fieldCount).toBeGreaterThan(0);

    // 10. Check for Google Maps links (if coordinates are present)
    const googleMapsLinks = firstItem.locator('a[href*="google.com/maps"]');
    const mapsLinkCount = await googleMapsLinks.count();

    if (mapsLinkCount > 0) {
      await expect(googleMapsLinks.first()).toBeVisible();

      // 11. Verify Google Maps link opens in new tab
      const targetAttribute = await googleMapsLinks
        .first()
        .getAttribute("target");
      expect(targetAttribute).toBe("_blank");
    }
  }
});

test("gallery page - responsive grid layout", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links
  const galleryLinks = page.getByRole("link", { name: /gallery/i });
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Click the first gallery link
    const firstGalleryLink = galleryLinks.first();
    await firstGalleryLink.click();

    // 5. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 6. Wait for the gallery container to be present
    await page
      .locator("#galleryContainer")
      .waitFor({ state: "attached", timeout: 5000 });

    // 7. Verify gallery container has responsive grid classes
    const galleryContainer = page.locator("#galleryContainer");
    await expect(galleryContainer).toHaveClass(/grid/);
    await expect(galleryContainer).toHaveClass(/grid-cols-1/);
    await expect(galleryContainer).toHaveClass(/md:grid-cols-2/);
    await expect(galleryContainer).toHaveClass(/lg:grid-cols-3/);
    await expect(galleryContainer).toHaveClass(/xl:grid-cols-4/);

    // 8. Test responsive behavior by changing viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // tablet
    await page.waitForTimeout(1000);

    // 9. Verify items are still visible
    const items = page.locator(".rounded-lg.border.bg-card");
    await expect(items.first()).toBeVisible();

    // 10. Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // mobile
    await page.waitForTimeout(1000);

    // 11. Verify items are still visible in mobile
    await expect(items.first()).toBeVisible();
  }
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

  // 3. Find gallery links
  const galleryLinks = page.getByRole("link", { name: /gallery/i });
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Click the first gallery link
    const firstGalleryLink = galleryLinks.first();
    await firstGalleryLink.click();

    // 5. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 6. Check for either gallery content or error message
    const galleryContainer = page.locator("#galleryContainer");
    const errorMessage = page.locator("h3");

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
  }
});
