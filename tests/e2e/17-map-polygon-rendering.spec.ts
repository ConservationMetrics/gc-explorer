import type { Sql } from "postgres";

import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import { stubMapboxTelemetry } from "@/tests/e2e/helpers/configPage";
import { waitForTestMap } from "@/tests/e2e/helpers/testMap";
import type { ApiTestView, ViewConfig } from "@/types";

type PolygonFixtureRow = {
  color: string;
  coordinates: string;
  displayName: string;
  id: string;
  type: "Polygon" | "MultiPolygon";
};

const polygonRows: PolygonFixtureRow[] = [
  {
    id: "test-polygon",
    type: "Polygon",
    coordinates:
      "[[[-63.5,2.5],[-62.5,2.5],[-62.5,3.5],[-63.5,3.5],[-63.5,2.5]]]",
    color: "#dc2626",
    displayName: "Ordinary polygon fixture",
  },
  {
    id: "test-multipolygon",
    type: "MultiPolygon",
    coordinates:
      "[[[[-60.5,4.5],[-59.5,4.5],[-59.5,5.5],[-60.5,5.5],[-60.5,4.5]]],[[[-57.5,6.5],[-56.5,6.5],[-56.5,7.5],[-57.5,7.5],[-57.5,6.5]]]]",
    color: "#16a34a",
    displayName: "Multipart polygon fixture",
  },
];

const multiPolygonOnlyRows = polygonRows.filter(
  (row) => row.type === "MultiPolygon",
);

const viewConfig: ViewConfig = {
  COLOR_COLUMN: "filter_color",
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
  MAPBOX_ZOOM: 5,
  ROUTE_LEVEL_PERMISSION: "member",
};

const initializePolygonFixture =
  (rows: PolygonFixtureRow[]) => async (database: Sql, tableName: string) => {
    const table = `"${tableName.replaceAll('"', '""')}"`;
    await database.unsafe(`
      CREATE TABLE ${table} (
        _id text NOT NULL,
        g__coordinates text NOT NULL,
        g__type text NOT NULL,
        filter_color text NOT NULL,
        display_name text NOT NULL
      )
    `);

    await Promise.all(
      rows.map((row) =>
        database.unsafe(
          `INSERT INTO ${table} (_id, g__coordinates, g__type, filter_color, display_name)
           VALUES ($1, $2, $3, $4, $5)`,
          [row.id, row.coordinates, row.type, row.color, row.displayName],
        ),
      ),
    );
  };

test.describe("polygon map rendering", () => {
  let mixedView: ApiTestView | null = null;
  let multiPolygonOnlyView: ApiTestView | null = null;

  test.beforeAll(async () => {
    mixedView = await createApiTestView({
      warehouseInitializer: initializePolygonFixture(polygonRows),
      viewConfig,
      viewType: "map",
    });
    multiPolygonOnlyView = await createApiTestView({
      warehouseInitializer: initializePolygonFixture(multiPolygonOnlyRows),
      viewConfig,
      viewType: "map",
    });
  });

  test.afterAll(async () => {
    await Promise.all(
      [mixedView, multiPolygonOnlyView]
        .filter((view): view is ApiTestView => view !== null)
        .map(deleteApiTestView),
    );
  });

  test("renders Polygon and MultiPolygon features", async ({
    authenticatedPageAsAdmin: page,
  }) => {
    if (!mixedView)
      throw new Error("Mixed polygon map test view was not created");

    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await stubMapboxTelemetry(page);
    await page.goto(`/${mixedView.viewType}/${mixedView.primaryDataset}`);
    await waitForTestMap(page);

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const map = window.getTestMap();
          if (!map.getLayer("data-layer-polygon")) return [];
          return [
            ...new Set(
              map
                .queryRenderedFeatures({ layers: ["data-layer-polygon"] })
                .map((feature) => feature.properties?._id)
                .filter((id): id is string => typeof id === "string"),
            ),
          ];
        }),
      )
      .toEqual(expect.arrayContaining(["test-polygon", "test-multipolygon"]));

    expect(
      consoleErrors.filter(
        (message) =>
          message.includes("layers.data-layer-polygon.filter") ||
          message.includes('"MultiPolygon" found'),
      ),
    ).toEqual([]);
  });

  test("creates the polygon layer for MultiPolygon-only data", async ({
    authenticatedPageAsAdmin: page,
  }) => {
    if (!multiPolygonOnlyView) {
      throw new Error("MultiPolygon-only map test view was not created");
    }

    await stubMapboxTelemetry(page);
    await page.goto(
      `/${multiPolygonOnlyView.viewType}/${multiPolygonOnlyView.primaryDataset}`,
    );
    await waitForTestMap(page);

    await expect
      .poll(() =>
        page.evaluate(() => {
          const map = window.getTestMap();
          return map.getLayer("data-layer-polygon")?.id ?? null;
        }),
      )
      .toBe("data-layer-polygon");
  });

  test("clicking a MultiPolygon interior opens its feature sidebar", async ({
    authenticatedPageAsAdmin: page,
  }) => {
    if (!mixedView)
      throw new Error("Mixed polygon map test view was not created");

    await stubMapboxTelemetry(page);
    await page.goto(`/${mixedView.viewType}/${mixedView.primaryDataset}`);
    const canvas = page.locator("canvas.mapboxgl-canvas");
    await expect(canvas).toBeVisible();

    // The first MultiPolygon part surrounds the configured camera center.
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error("Map canvas has no bounding box");
    await page.mouse.click(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );

    await expect(page.getByText("Multipart polygon fixture")).toBeVisible();
  });
});
