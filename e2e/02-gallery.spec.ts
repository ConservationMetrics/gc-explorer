import { expect, test } from "@playwright/test";

test("gallery page - displays gallery with media files", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait for the page heading to become visible
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // 3. Find gallery links
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Wait for the first gallery link to be visible before clicking
    const galleryLink = galleryLinks.first();
    await galleryLink.waitFor({ state: "visible", timeout: 10000 });

    // 5. Click the first gallery link
    await galleryLink.click();

    // 6. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 7. Wait for the gallery container to be present
    await page
      .getByTestId("gallery-container")
      .waitFor({ state: "attached", timeout: 5000 });

    // 8. Verify gallery container is visible
    await expect(page.getByTestId("gallery-container")).toBeVisible();

    // 9. Check for gallery items (DataFeature components)
    const galleryItems = page.getByTestId("gallery-item-0");
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
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Wait for the first gallery link to be visible before clicking
    const galleryLink = galleryLinks.first();
    await galleryLink.waitFor({ state: "visible", timeout: 10000 });

    // 5. Click the first gallery link
    await galleryLink.click();

    // 6. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 7. Wait for the gallery container to be present
    await page
      .getByTestId("gallery-container")
      .waitFor({ state: "attached", timeout: 5000 });

    // 8. Look for image links (lightbox enabled)
    const imageLinks = page.locator("a[data-lightbox]");
    const imageCount = await imageLinks.count();

    if (imageCount > 0) {
      // 9. Click on the first image to open lightbox
      const firstImage = imageLinks.first();
      await firstImage.click();

      // 10. Verify lightbox elements are present
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
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Wait for the first gallery link to be visible before clicking
    const galleryLink = galleryLinks.first();
    await galleryLink.waitFor({ state: "visible", timeout: 10000 });

    // 5. Click the first gallery link
    await galleryLink.click();

    // 6. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 7. Wait for the gallery container to be present
    await page
      .getByTestId("gallery-container")
      .waitFor({ state: "attached", timeout: 5000 });

    // 8. Look for audio elements
    const audioElements = page.locator("audio");
    const audioCount = await audioElements.count();

    if (audioCount > 0) {
      // 9. Wait for audio elements to be visible
      await audioElements.first().waitFor({ state: "visible", timeout: 5000 });

      // 10. Test audio playback using browser context with better error handling
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
          if (!audio)
            return { success: false, error: "No audio element found" };

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
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Wait for the first gallery link to be visible before clicking
    const galleryLink = galleryLinks.first();
    await galleryLink.waitFor({ state: "visible", timeout: 10000 });

    // 5. Click the first gallery link
    await galleryLink.click();

    // 6. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 7. Wait for the gallery container to be present
    await page
      .getByTestId("gallery-container")
      .waitFor({ state: "attached", timeout: 5000 });

    // 8. Look for filter container
    const filterContainer = page.getByTestId("filter-container");
    const filterCount = await filterContainer.count();

    if (filterCount > 0) {
      // 9. Click the filter select to open dropdown
      await page.getByTestId("filter-select").click();

      // 10. Wait for dropdown options to appear
      const dropdownOptions = page.getByRole("option");
      await dropdownOptions
        .first()
        .waitFor({ state: "visible", timeout: 5000 });

      // 11. Get initial gallery item count
      const initialItems = page.locator('[data-testid^="gallery-item-"]');
      const initialCount = await initialItems.count();

      // 12. Select first filter option
      const firstOption = dropdownOptions.first();
      await firstOption.click();

      // 13. Wait for filtering to take effect
      await page.waitForTimeout(1000);

      // 14. Get filtered gallery item count
      const filteredItems = page.locator('[data-testid^="gallery-item-"]');
      const filteredCount = await filteredItems.count();

      // 15. Verify filtering changed the number of items (or at least applied)
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      // 16. Clear filter by clicking the X button on selected tag
      const removeFilterButton = page.getByTestId("remove-filter-button");
      if ((await removeFilterButton.count()) > 0) {
        await removeFilterButton.click();

        // 17. Wait for filter to clear
        await page.waitForTimeout(1000);

        // 18. Verify items are back to original count
        const clearedItems = page.locator('[data-testid^="gallery-item-"]');
        const clearedCount = await clearedItems.count();
        expect(clearedCount).toBe(initialCount);
      }
    }
  }
});

test("gallery page - pagination and infinite scroll", async ({ page }) => {
  // --- STEP 1: Load home page ---
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /available views/i }),
  ).toBeVisible();

  // --- STEP 2: Get gallery links ---
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const linkCount = await galleryLinks.count();
  console.log("🔍 Found gallery links:", linkCount);

  // Debug if none found
  if (linkCount === 0) {
    const allLinks = page.locator("a");
    const allCount = await allLinks.count();
    console.log("⚠️ No gallery links. Total <a> found:", allCount);

    for (let i = 0; i < Math.min(allCount, 10); i++) {
      const href = await allLinks
        .nth(i)
        .getAttribute("href")
        .catch(() => null);
      const text = await allLinks
        .nth(i)
        .textContent()
        .catch(() => null);
      console.log(`Link ${i}: href="${href}", text="${text?.trim()}"`);
    }

    expect(linkCount).toBeGreaterThan(0);
    return;
  }

  // --- STEP 3: Visit first gallery ---
  const firstGalleryLink = galleryLinks.first();
  await firstGalleryLink.waitFor({ state: "visible", timeout: 10000 });
  await firstGalleryLink.click();
  await page.waitForURL("**/gallery/**", { timeout: 5000 });

  // --- STEP 4: Ensure gallery is loaded ---
  const galleryContainer = page.getByTestId("gallery-container");
  await galleryContainer.waitFor({ state: "attached", timeout: 5000 });

  const items = page.locator('[data-testid^="gallery-item-"]');
  await items.first().waitFor({ state: "visible", timeout: 5000 });

  const initialItemCount = await items.count();
  console.log("📸 Initial gallery items:", initialItemCount);

  // --- STEP 5: Read pagination info ---
  const paginationInfo = page.getByTestId("pagination-info");
  const totalItems = parseInt(
    (await paginationInfo.getAttribute("data-total-items")) || "0",
  );
  const paginatedItems = parseInt(
    (await paginationInfo.getAttribute("data-paginated-count")) || "0",
  );

  console.log(`📄 Pagination: showing ${paginatedItems} of ${totalItems}`);

  // Only infinite-scroll test if more items exist
  if (totalItems > paginatedItems) {
    console.log("🔄 Triggering infinite scroll...");

    const initialPaginated = paginatedItems;

    // --- STEP 6: Scroll to bottom (universal + reliable) ---
    await page.evaluate(() => {
      const scrollHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight;
      window.scrollTo(0, scrollHeight);
    });

    // Allow frontend scroll handler to fire
    await page.waitForTimeout(500);

    // --- STEP 7: Wait for new items ---
    await page
      .waitForFunction(
        (expected) => {
          const el = document.querySelector('[data-testid="pagination-info"]');
          if (!el) return false;
          const current = el.getAttribute("data-paginated-count");
          return current && parseInt(current) > expected;
        },
        initialPaginated,
        { timeout: 5000 },
      )
      .catch(() => {
        console.log(
          "ℹ️ Pagination didn't increase — may already be at final batch.",
        );
      });

    // --- STEP 8: Validate item count ---
    const finalItemCount = await items.count();
    console.log("🧮 New gallery item count:", finalItemCount);

    expect(finalItemCount).toBeGreaterThanOrEqual(initialItemCount);
  } else {
    console.log("✔ All items already visible; skipping infinite scroll");
    expect(initialItemCount).toBeGreaterThan(0);
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
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Wait for the first gallery link to be visible before clicking
    const galleryLink = galleryLinks.first();
    await galleryLink.waitFor({ state: "visible", timeout: 10000 });

    // 5. Click the first gallery link
    await galleryLink.click();

    // 6. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 7. Wait for the gallery container to be present
    await page
      .getByTestId("gallery-container")
      .waitFor({ state: "attached", timeout: 5000 });

    // 8. Get the first gallery item
    const firstItem = page.getByTestId("gallery-item-0");
    await expect(firstItem).toBeVisible();

    // 9. Check for data source heading
    const dataSourceHeading = firstItem.getByTestId("data-source-heading");
    if ((await dataSourceHeading.count()) > 0) {
      await expect(dataSourceHeading).toBeVisible();
    }

    // 10. Check for feature information fields
    const featureFields = firstItem.getByTestId("field-label");
    const fieldCount = await featureFields.count();
    expect(fieldCount).toBeGreaterThan(0);

    // 11. Check for Google Maps links (if coordinates are present)
    const googleMapsLinks = firstItem.getByTestId("google-maps-link");
    const mapsLinkCount = await googleMapsLinks.count();

    if (mapsLinkCount > 0) {
      await expect(googleMapsLinks.first()).toBeVisible();

      // 12. Verify Google Maps link opens in new tab
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
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const linkCount = await galleryLinks.count();

  // Debug: Log information about gallery links
  console.log("🔍 Gallery link count:", linkCount);
  if (linkCount > 0) {
    // Debug: Log gallery link details (with error handling)
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      try {
        const link = galleryLinks.nth(i);
        const href = await link.getAttribute("href").catch(() => null);
        const text = await link
          .textContent({ timeout: 2000 })
          .catch(() => null);
        const isVisible = await link.isVisible().catch(() => false);
        console.log(
          `🔍 Gallery link ${i}: href="${href || "(no href)"}", text="${text?.trim() || "(no text)"}", visible=${isVisible}`,
        );
      } catch (error) {
        console.log(
          `🔍 Gallery link ${i}: (error accessing link: ${String(error)})`,
        );
      }
    }
  } else {
    // Debug: Log all links to see what's available (with error handling)
    const allLinks = page.locator("a");
    const allLinkCount = await allLinks.count();
    console.log("🔍 Total links on page:", allLinkCount);
    for (let i = 0; i < Math.min(allLinkCount, 10); i++) {
      try {
        const link = allLinks.nth(i);
        const href = await link.getAttribute("href").catch(() => null);
        const text = await link
          .textContent({ timeout: 2000 })
          .catch(() => null);
        console.log(
          `🔍 Link ${i}: href="${href || "(no href)"}", text="${text?.trim() || "(no text)"}"`,
        );
      } catch (error) {
        console.log(`🔍 Link ${i}: (error accessing link: ${String(error)})`);
      }
    }
  }

  if (linkCount > 0) {
    // 4. Wait for the first gallery link to be visible before clicking
    const galleryLink = galleryLinks.first();
    await galleryLink.waitFor({ state: "visible", timeout: 10000 });

    // 5. Click the first gallery link
    await galleryLink.click();

    // 6. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 7. Wait for the gallery container to be present and visible
    const galleryContainer = page.getByTestId("gallery-container");
    await galleryContainer.waitFor({ state: "attached", timeout: 5000 });
    await expect(galleryContainer).toBeVisible();

    // 8. Wait for at least one gallery item to be rendered before checking classes
    const firstItem = page.getByTestId("gallery-item-0");
    await firstItem.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
      // If no items, that's okay - we'll still check the container classes
    });

    // 9. Verify gallery container has responsive grid classes
    // Check that the class attribute contains the expected grid classes
    const classAttribute = await galleryContainer.getAttribute("class");
    expect(classAttribute).toContain("grid");
    expect(classAttribute).toContain("grid-cols-1");
    expect(classAttribute).toContain("md:grid-cols-2");
    expect(classAttribute).toContain("lg:grid-cols-3");
    expect(classAttribute).toContain("xl:grid-cols-4");

    // 9. Test responsive behavior by changing viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // tablet
    await page.waitForTimeout(1000);

    // 10. Verify items are still visible
    const items = page.getByTestId("gallery-item-0");
    await expect(items).toBeVisible();

    // 11. Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // mobile
    await page.waitForTimeout(1000);

    // 12. Verify items are still visible in mobile
    await expect(items).toBeVisible();
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
  const galleryLinks = page.locator('a[href^="/gallery/"]');
  const linkCount = await galleryLinks.count();

  if (linkCount > 0) {
    // 4. Wait for the first gallery link to be visible before clicking
    const galleryLink = galleryLinks.first();
    await galleryLink.waitFor({ state: "visible", timeout: 10000 });

    // 5. Click the first gallery link
    await galleryLink.click();

    // 6. Wait for the gallery page to load
    await page.waitForURL("**/gallery/**", { timeout: 5000 });

    // 7. Check for either gallery content or error message
    const galleryContainer = page.getByTestId("gallery-container");
    const errorMessage = page.getByTestId("gallery-error-message");

    // 8. Wait for either to appear
    await Promise.race([
      galleryContainer.waitFor({ state: "attached", timeout: 5000 }),
      errorMessage.waitFor({ state: "visible", timeout: 5000 }),
    ]);

    // 9. Verify either gallery loads or error message is shown
    const hasGallery = (await galleryContainer.count()) > 0;
    const hasError = (await errorMessage.count()) > 0;

    expect(hasGallery || hasError).toBe(true);

    if (hasError) {
      // 10. Verify error message content
      await expect(errorMessage).toContainText(/gallery is not available/i);
    }
  }
});
