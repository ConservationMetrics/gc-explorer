import type { Sql } from "postgres";

import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import { stubMapboxTelemetry } from "@/tests/e2e/helpers/configPage";
import { waitForTestMap } from "@/tests/e2e/helpers/testMap";
import type { ApiTestView, ViewConfig } from "@/types";

const viewConfig: ViewConfig = {
  MAPBOX_BASEMAPS: JSON.stringify([
    {
      name: "Default Style",
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f8fafc" },
          },
        ],
      },
      access_token: "pk.e2e",
      isDefault: true,
    },
  ]),
  MAPBOX_BEARING: 0,
  MAPBOX_CENTER_LATITUDE: "5",
  MAPBOX_CENTER_LONGITUDE: "-60",
  MAPBOX_PITCH: 0,
  MAPBOX_PROJECTION: "mercator",
  MAPBOX_ZOOM: 12,
  ROUTE_LEVEL_PERMISSION: "member",
};

const initializePointFixture = async (database: Sql, tableName: string) => {
  const table = `"${tableName.replaceAll('"', '""')}"`;
  await database.unsafe(`
    CREATE TABLE ${table} (
      _id text NOT NULL,
      g__coordinates text NOT NULL,
      g__type text NOT NULL,
      display_name text NOT NULL
    )
  `);
  await database.unsafe(
    `INSERT INTO ${table} (_id, g__coordinates, g__type, display_name)
     VALUES ($1, $2, $3, $4)`,
    ["point-feature-1", "[-60, 5]", "Point", "Point feature fixture"],
  );
};

test.describe("map feature link", () => {
  let mapView: ApiTestView | null = null;

  test.beforeAll(async () => {
    mapView = await createApiTestView({
      warehouseInitializer: initializePointFixture,
      viewConfig,
      viewType: "map",
    });
  });

  test.afterAll(async () => {
    if (mapView) {
      await deleteApiTestView(mapView);
    }
  });

  test("copies a feature link and reopens that feature", async ({
    authenticatedPageAsAdmin: page,
  }) => {
    if (!mapView) throw new Error("Map feature link test view was not created");

    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    await stubMapboxTelemetry(page);
    await page.goto(`/${mapView.viewType}/${mapView.primaryDataset}`);
    await waitForTestMap(page);

    await expect(page.getByTestId("copy-link-section")).toHaveCount(0);

    const canvas = page.locator("canvas.mapboxgl-canvas");
    await expect(canvas).toBeVisible();
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error("Map canvas has no bounding box");
    await page.mouse.click(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );

    await expect(page.getByText("Point feature fixture")).toBeVisible();
    await expect(page).toHaveURL(/[?&]featureId=point-feature-1/);
    await expect(page.getByTestId("copy-link-button")).toContainText(
      "Copy link to feature",
    );

    await page.getByTestId("copy-link-button").click();
    await expect(page.getByTestId("copy-link-button")).toContainText("Copied!");

    const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
    const copied = new URL(copiedUrl);
    expect(copied.searchParams.get("featureId")).toBe("point-feature-1");
    expect(copied.searchParams.has("lat")).toBe(false);
    expect(copied.searchParams.has("lng")).toBe(false);
    expect(copied.searchParams.has("zoom")).toBe(false);

    await page.getByTestId("copy-map-location-button").click();
    const locationUrl = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    const location = new URL(locationUrl);
    expect(location.searchParams.has("featureId")).toBe(false);
    expect(location.searchParams.has("lat")).toBe(true);
    expect(location.searchParams.has("lng")).toBe(true);
    expect(location.searchParams.has("zoom")).toBe(true);

    await page.goto(copiedUrl);
    await waitForTestMap(page);
    await expect(page.getByText("Point feature fixture")).toBeVisible();

    const camera = await page.evaluate(() => {
      const map = window.getTestMap();
      const center = map.getCenter();
      return { lat: center.lat, lng: center.lng, zoom: map.getZoom() };
    });
    expect(camera.lat).toBeCloseTo(5, 1);
    expect(camera.lng).toBeCloseTo(-60, 1);
    expect(camera.zoom).toBeCloseTo(13, 0);

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page).not.toHaveURL(/featureId=/);
    await expect(page.getByTestId("copy-link-section")).toHaveCount(0);
  });
});
