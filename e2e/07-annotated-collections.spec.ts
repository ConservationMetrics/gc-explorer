import { test, expect } from "./fixtures/auth-storage";
import type { Page } from "@playwright/test";

const selectionModifierKey = process.platform === "darwin" ? "Meta" : "Control";

type LngLat = [number, number];

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

async function navigateToAlertsDashboard(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.waitForSelector("main", { timeout: 15000 });
  await expect(
    page.getByRole("heading", {
      name: /available views|available dataset views/i,
    }),
  ).toBeVisible();

  const datasetCards = page.locator("[data-testid='dataset-card']");
  const cardCount = await datasetCards.count();
  expect(cardCount).toBeGreaterThan(0);

  let alertsCard = null;
  for (let i = 0; i < cardCount; i++) {
    const card = datasetCards.nth(i);
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

  await page.locator("canvas.mapboxgl-canvas").first().waitFor();

  await page.waitForFunction(() => {
    // @ts-expect-error test map
    const map = window._testMap;
    return map?.isStyleLoaded() && map.loaded();
  });
}

/* ─────────────────────────────────────────────── */
/* EXISTING TESTS                                  */
/* ─────────────────────────────────────────────── */

test("annotated collections - view saved incidents sidebar", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  const viewIncidentsButton = page.getByTestId("incidents-view-button");
  await viewIncidentsButton.click();

  await expect(
    page.getByRole("heading", { name: /saved incidents/i }),
  ).toBeVisible();

  await page.locator(".incidents-sidebar .close-btn").click();
  await expect(page.locator(".incidents-sidebar")).not.toBeVisible();
});

test("annotated collections - multi-select mode and create incident", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  const multiSelectButton = page.getByTestId("incidents-multiselect-button");
  await multiSelectButton.click();
  await expect(multiSelectButton).toHaveClass(/active/);

  const lngLat = await getSelectableFeatureLngLat(page);
  if (!lngLat) test.skip();

  const clickPoint = await projectLngLatToPagePoint(page, lngLat!);
  if (!clickPoint) test.skip();

  await page.mouse.click(clickPoint.x, clickPoint.y, {
    modifiers: [selectionModifierKey],
  });

  await expect(
    page.getByTestId("incidents-create-button"),
  ).toBeEnabled();
});

/* ─────────────────────────────────────────────── */
/* MERGED TESTS – BOTH BRANCHES INCLUDED           */
/* ─────────────────────────────────────────────── */

test("annotated collections - cluster highlighting when viewing incident details", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  const multiSelectButton = page.getByTestId("incidents-multiselect-button");
  await multiSelectButton.click();

  const lngLat = await getSelectableFeatureLngLat(page);
  if (!lngLat) test.skip();

  const clickPoint = await projectLngLatToPagePoint(page, lngLat!);
  if (!clickPoint) test.skip();

  await page.mouse.click(clickPoint.x, clickPoint.y, {
    modifiers: [selectionModifierKey],
  });

  await page.getByTestId("incidents-create-button").click();

  await page.getByLabel("Name").fill("Cluster Highlight Test Incident");
  await page.getByLabel("Description").fill("Test incident for clusters");
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

test("annotated collections - shareable incident link URL parameter", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  const multiSelectButton = page.getByTestId("incidents-multiselect-button");
  await multiSelectButton.click();

  const lngLat = await getSelectableFeatureLngLat(page);
  if (!lngLat) test.skip();

  const clickPoint = await projectLngLatToPagePoint(page, lngLat!);
  if (!clickPoint) test.skip();

  await page.mouse.click(clickPoint.x, clickPoint.y, {
    modifiers: [selectionModifierKey],
  });

  await page.getByTestId("incidents-create-button").click();

  await page.getByLabel("Name").fill("Shareable Link Test Incident");
  await page.getByLabel("Description").fill("Test incident for share links");
  await page.getByLabel("Incident Type").selectOption("Deforestation");
  await page.locator(".submit-btn").click();

  await page.getByTestId("incidents-view-button").click();
  await page.getByText("Shareable Link Test Incident").click();

  const url = page.url();
  expect(url).toContain("incidentId=");

  const id = new URL(url).searchParams.get("incidentId");
  expect(id).toBeTruthy();

  await page.goto(url);
  await expect(
    page.getByText("Shareable Link Test Incident"),
  ).toBeVisible();
});
