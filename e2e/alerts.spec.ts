import { test, expect } from "@playwright/test";
import { alertsData } from "../test/fixtures/alertsData";
import type { Feature, Polygon, Point, GeoJsonProperties } from "geojson";

// Helper to convert fixture polygons to GeoJSON
function toGeoJSONPolygon(
  alert: Record<string, unknown>,
): Feature<Polygon, GeoJsonProperties> {
  return {
    id: (alert.alert_id || alert._id) as string,
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: JSON.parse(alert.g__coordinates as string),
    },
    properties: {
      alertID: alert.alert_id || alert._id,
      ...alert,
    },
  };
}

// Helper to convert fixture points to GeoJSON
function toGeoJSONPoint(
  lng: number,
  lat: number,
  id = "alertPoint",
  props: Record<string, unknown> = {},
): Feature<Point, GeoJsonProperties> {
  return {
    id,
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: { alertID: id, ...props },
  };
}
test("alerts dashboard - click pulsing dot opens sidebar", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: /alerts/i })
    .first()
    .click();
  await page.locator("#map").waitFor();

  // Wait for the map to be ready and the canvas to be visible
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await mapCanvas.waitFor({ state: "visible" });

  // Wait for markers to appear and try clicking the first one
  const pulsingDot = page.locator('[aria-label="Map marker"]').first();
  await pulsingDot.waitFor({ state: "visible" });

  // Try clicking with force and wait for the marker to move
  await pulsingDot.click({ force: true });

  // Wait a bit for the click to register
  await page.waitForTimeout(500);

  // Debug: Print all text in the DOM and log it
  const allText = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
    );
    const texts: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text) texts.push(text);
    }
    return texts;
  });

  console.log("All text in DOM:", allText);

  // Fuzzy match against "copy link"
  const copyLinkText = allText.find(
    (text) =>
      text.toLowerCase().includes("copy link") ||
      (text.toLowerCase().includes("copy") &&
        text.toLowerCase().includes("link")),
  );

  console.log("Found copy link text:", copyLinkText);

  // Assert sidebar contains "copy link to alert"
  await expect(page.locator("text=copy link to alert")).toBeVisible();
});

test("alerts dashboard - click polygon centroid opens sidebar", async ({
  page,
}) => {
  // Build a realistic API response
  const polygonFeature = toGeoJSONPolygon(alertsData[0]);
  const pointFeature = toGeoJSONPoint(0, -15, "alertPoint", {
    YYYYMM: "202401",
  });

  await page.route("**/api/test_table/alerts", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        alertsData: {
          mostRecentAlerts: {
            type: "FeatureCollection",
            features: [polygonFeature, pointFeature],
          },
          previousAlerts: {
            type: "FeatureCollection",
            features: [],
          },
        },
        alertsStatistics: {
          earliestAlertsDate: "01-2023",
          twelveMonthsBefore: "01-2024",
          allDates: ["01-2023"],
        },
        allowedFileExtensions: ["jpg"],
        logoUrl: null,
        mapLegendLayerIds: null,
        mapboxAccessToken: "pk.test",
        mapboxBearing: 0,
        mapboxLatitude: 0,
        mapboxLongitude: 0,
        mapboxPitch: 0,
        mapboxProjection: "mercator",
        mapboxStyle: "mapbox://styles/mapbox/streets-v12",
        mapboxZoom: 2,
        mapbox3d: false,
        mapeoData: [],
        mediaBasePath: null,
        mediaBasePathAlerts: null,
        planetApiKey: null,
      }),
    });
  });

  await page.goto("/");
  await page
    .getByRole("link", { name: /alerts/i })
    .first()
    .click();
  await page.locator("#map").waitFor();

  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await mapCanvas.waitFor({ state: "visible" });
  console.log("mapCanvas", mapCanvas);
  // Click the polygon centroid using map.project
  const [x, y] = await page.evaluate(() => {
    // @ts-expect-error: Accessing window._testMap for E2E pixel projection
    const map = window._testMap;
    if (!map) throw new Error("Mapbox map not found");
    // Use a coordinate inside your polygon (from fixture)
    const pt = map.project([-80.8, 37.45]);
    return [pt.x, pt.y];
  });
  await mapCanvas.click({ position: { x, y } });

  // Debug: Print all text in the DOM and log it
  const allText2 = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
    );
    const texts: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text) texts.push(text);
    }
    return texts;
  });

  console.log("All text in DOM (polygon test):", allText2);

  // Fuzzy match against "copy link"
  const copyLinkText2 = allText2.find(
    (text) =>
      text.toLowerCase().includes("copy link") ||
      (text.toLowerCase().includes("copy") &&
        text.toLowerCase().includes("link")),
  );

  console.log("Found copy link text (polygon test):", copyLinkText2);

  // Assert sidebar contains "copy link to alert"
  await expect(page.locator("text=copy link to alert")).toBeVisible();
});
