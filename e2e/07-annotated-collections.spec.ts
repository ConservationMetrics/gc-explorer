import { test, expect } from "./fixtures/auth-storage";
import type { Page } from "@playwright/test";

const selectionModifierKey = process.platform === "darwin" ? "Meta" : "Control";

type LngLat = [number, number];

/* ─────────────────────────────────────────────── */
/* MAP HELPERS                                    */
/* ─────────────────────────────────────────────── */

async function getSelectableFeatureLngLat(page: Page): Promise<LngLat | null> {
  return await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    if (!map) return null;

    const layers = [
      "most-recent-alerts-polygon",
      "previous-alerts-polygon",
    ].filter((layer) => map.getLayer(layer));

    if (!layers.length) return null;

    const features = map.queryRenderedFeatures({ layers });
    if (!features.length) return null;

    const feature = features[0];
    const centroid = feature?.properties?.geographicCentroid;

    if (typeof centroid === "string") {
      const [lng, lat] = centroid.split(",").map(Number);
      if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
    }

    if (feature?.geometry?.type === "Polygon") {
      const ring = feature.geometry.coordinates?.[0];
      if (Array.isArray(ring) && ring.length) {
        const sum = ring.reduce(
          (acc, [lng, lat]) => ({
            lng: acc.lng + lng,
            lat: acc.lat + lat,
          }),
          { lng: 0, lat: 0 },
        );
        return [sum.lng / ring.length, sum.lat / ring.length];
      }
    }

    return null;
  });
}

async function projectLngLatToPagePoint(
  page: Page,
  lngLat: LngLat,
): Promise<{ x: number; y: number } | null> {
  return await page.evaluate(([lng, lat]) => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    if (!map) return null;

    const point = map.project([lng, lat]);
    const rect = map.getCanvas().getBoundingClientRect();
    return { x: rect.left + point.x, y: rect.top + point.y };
  }, lngLat);
}

/* ─────────────────────────────────────────────── */
/* NAVIGATION                                     */
/* ─────────────────────────────────────────────── */

async function navigateToAlertsDashboard(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("heading", {
      name: /available views|available dataset views/i,
    }),
  ).toBeVisible();

  const cards = page.locator("[data-testid='dataset-card']");
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  let alertsCard = null;
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    if ((await card.locator("[data-testid='view-tag-alerts']").count()) > 0) {
      alertsCard = card;
      break;
    }
  }

  expect(alertsCard).not.toBeNull();

  await alertsCard!
    .locator("[data-testid='open-dataset-view-link']")
    .click();

  await page.waitForLoadState("networkidle");

  const alertsLink = page.locator('a[href^="/alerts/"]').first();
  const href = await alertsLink.getAttribute("href");
  await page.goto(href!);

  await page.locator("canvas.mapboxgl-canvas").waitFor();

  await page.waitForFunction(() => {
    // @ts-expect-error test map
    const map = window._testMap;
    return map?.isStyleLoaded() && map.loaded();
  });
}

/* ─────────────────────────────────────────────── */
/* BASIC UI TESTS                                 */
/* ─────────────────────────────────────────────── */

test("annotated collections - view saved incidents sidebar", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  await page.getByTestId("incidents-view-button").click();
  await expect(
    page.getByRole("heading", { name: /saved incidents/i }),
  ).toBeVisible();

  await page.locator(".incidents-sidebar .close-btn").click();
  await expect(page.locator(".incidents-sidebar")).not.toBeVisible();
});

test("annotated collections - multi-select enables create button", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  await page.getByTestId("incidents-multiselect-button").click();

  const lngLat = await getSelectableFeatureLngLat(page);
  if (!lngLat) test.skip();

  const point = await projectLngLatToPagePoint(page, lngLat);
  if (!point) test.skip();

  await page.mouse.click(point.x, point.y, {
    modifiers: [selectionModifierKey],
  });

  await expect(page.getByTestId("incidents-create-button")).toBeEnabled();
});

/* ─────────────────────────────────────────────── */
/* CLUSTER HIGHLIGHTING                            */
/* ─────────────────────────────────────────────── */

test("annotated collections - cluster highlighting when viewing incident details", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  await page.getByTestId("incidents-multiselect-button").click();

  const lngLat = await getSelectableFeatureLngLat(page);
  if (!lngLat) test.skip();

  const point = await projectLngLatToPagePoint(page, lngLat);
  if (!point) test.skip();

  await page.mouse.click(point.x, point.y, {
    modifiers: [selectionModifierKey],
  });

  await page.getByTestId("incidents-create-button").click();

  await page.getByLabel("Name").fill("Cluster Highlight Test Incident");
  await page.getByLabel("Description").fill("Cluster highlighting test");
  await page.getByLabel("Incident Type").selectOption("Deforestation");
  await page.locator(".submit-btn").click();

  await page.getByTestId("incidents-view-button").click();
  await page.getByText("Cluster Highlight Test Incident").click();

  const hasHighlight = await page.evaluate(() => {
    // @ts-expect-error test map
    const map = window._testMap;
    if (!map) return false;

    return [
      "most-recent-alerts-centroids-clusters",
      "most-recent-alerts-point-clusters",
      "previous-alerts-centroids-clusters",
      "previous-alerts-point-clusters",
    ].some((layer) =>
      JSON.stringify(map.getPaintProperty(layer, "circle-color") ?? "").includes(
        "FFFF00",
      ),
    );
  });

  expect(hasHighlight).toBe(true);
});

/* ─────────────────────────────────────────────── */
/* AUTH0 ATTRIBUTION                               */
/* ─────────────────────────────────────────────── */

test("annotated collections - incident created_by attribution", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  await page.getByTestId("incidents-multiselect-button").click();

  const lngLat = await getSelectableFeatureLngLat(page);
  if (!lngLat) test.skip();

  const point = await projectLngLatToPagePoint(page, lngLat);
  if (!point) test.skip();

  await page.mouse.click(point.x, point.y, {
    modifiers: [selectionModifierKey],
  });

  await page.getByTestId("incidents-create-button").click();

  await page.getByLabel("Name").fill("Auth0 Attribution Test Incident");
  await page
    .getByLabel("Description")
    .fill("Verify created_by attribution");
  await page.getByLabel("Incident Type").selectOption("Deforestation");
  await page.locator(".submit-btn").click();

  await page.getByTestId("incidents-view-button").click();
  await page.getByText("Auth0 Attribution Test Incident").click();

  const byValue = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll(".meta-row"));
    for (const row of rows) {
      const label = row.querySelector(".meta-label");
      const value = row.querySelector(".meta-value");
      if (label?.textContent?.toLowerCase().includes("by:")) {
        return value?.textContent?.trim() ?? null;
      }
    }
    return null;
  });

  expect(byValue).toBeTruthy();
  expect(byValue).not.toBe("system");

  if (byValue?.includes("@")) {
    expect(byValue).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }
});

/* ─────────────────────────────────────────────── */
/* SHAREABLE LINK                                  */
/* ─────────────────────────────────────────────── */

test("annotated collections - shareable incident link URL parameter", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  await page.getByTestId("incidents-multiselect-button").click();

  const lngLat = await getSelectableFeatureLngLat(page);
  if (!lngLat) test.skip();

  const point = await projectLngLatToPagePoint(page, lngLat);
  if (!point) test.skip();

  await page.mouse.click(point.x, point.y, {
    modifiers: [selectionModifierKey],
  });

  await page.getByTestId("incidents-create-button").click();

  await page.getByLabel("Name").fill("Shareable Link Test Incident");
  await page.getByLabel("Description").fill("Shareable link test");
  await page.getByLabel("Incident Type").selectOption("Deforestation");
  await page.locator(".submit-btn").click();

  await page.getByTestId("incidents-view-button").click();
  await page.getByText("Shareable Link Test Incident").click();

  const url = page.url();
  expect(url).toContain("incidentId=");

  await page.goto(url);
  await expect(
    page.getByText("Shareable Link Test Incident"),
  ).toBeVisible();
});
