import { expect, test } from "@playwright/test";

test("alerts dashboard - symbol click and polygon click open sidebar and update URL", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(2000);
  const alertsLink = page.getByRole("link", { name: /alerts/i }).first();

  await page.goto((await alertsLink.getAttribute("href")) ?? "");

  await page.waitForTimeout(3000);
  /* Give Mapbox a gentle nudge: click roughly at 75% of the viewport width
   (vertically centered).  This ensures tiles are rendered and
   the map has focus before we look for pulsing markers. */
  const viewport = page.viewportSize();
  if (viewport) {
    await page.mouse.click(viewport.width * 0.75, viewport.height * 0.5);
  }
  await page.locator("#map").waitFor();

  // Wait for the map to be ready and the canvas to be visible
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await mapCanvas.waitFor({ state: "visible" });

  // pull every "symbol" feature Mapobox has already rendered

  const symbolFeatures = await page.evaluate(() => {
    // @ts-expect-error helper exposed in component
    const map = window._testMap;
    const features = map.queryRenderedFeatures({
      layers: ["most-recent-alerts-symbol"],
    });
    return features;
  });

  //
  // loop through them and fire a synthetic click
  for (const feature of symbolFeatures) {
    // Parse centroid (as string "lat, lng")
    const [lat, lng] = feature.properties.geographicCentroid
      .split(",")
      .map(Number);

    // 1. Click the symbol to zoom
    await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error helper exposed in component
        const map = window._testMap;
        const pt = map.project([lng, lat]);
        map.fire("click", {
          point: pt,
          lngLat: [lng, lat],
          originalEvent: {},
          features: [],
        });
      },
      [lng, lat],
    );

    // 2. Wait for zoom to finish (fixed delay)
    await page.waitForTimeout(1500);

    // 3. Project centroid to screen coordinates (use [lng, lat] order!)
    const { x, y } = await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error helper exposed in component
        return window._testMap.project([lng, lat]);
      },
      [lng, lat],
    );

    // 4. Try to find a polygon at or near that pixel (expand search radius)
    const found = await page.evaluate(
      ({ x, y }) => {
        // @ts-expect-error helper exposed in component
        const map = window._testMap;
        // Try a wider offset in case of projection drift
        for (let r = 0; r <= 50; r += 5) {
          // search radius up to 50px, step 5px
          for (let dx = -r; dx <= r; dx += 5) {
            for (let dy = -r; dy <= r; dy += 5) {
              const px = x + dx,
                py = y + dy;
              const poly = map.queryRenderedFeatures([px, py], {
                layers: ["most-recent-alerts-polygon"],
              })[0];
              if (poly) return { found: true, px, py };
            }
          }
        }
        return { found: false };
      },
      { x, y },
    );

    if (found.found) {
      // 5. Click the canvas at the found pixel
      await page.mouse.click(found.px, found.py);
      // 6. Assert sidebar
      await expect(page.getByText(/copy link to alert/i)).toBeVisible();
      // 7 check url that it includes ?alertId=
      await page.waitForTimeout(1000);
      const url = page.url();
      console.log(url);
      expect(url).toContain(`?alertId`);
    }
  }
});
