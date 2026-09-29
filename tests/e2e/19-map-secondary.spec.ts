import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { secondaryRows } from "@/tests/fixtures/secondaryGeometry";
import { createApiTestView, deleteApiTestView } from "./helpers/apiTestData";
import {
  createTestDatabaseClient,
  TEST_WAREHOUSE_DATABASE,
  TEST_CONFIG_DATABASE,
} from "./helpers/testDatabase";
import { waitForTestMap } from "./helpers/testMap";
import type { ApiTestView } from "@/types";

const style = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#f8fafc" },
    },
  ],
};
const config = {
  ROUTE_LEVEL_PERMISSION: "anyone",
  MEDIA_BASE_PATH: "/test-media",
  MAPBOX_BASEMAPS: JSON.stringify([
    { name: "Local", style, access_token: "pk.e2e", isDefault: true },
    {
      name: "Alternate",
      style: {
        ...style,
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#ddd" },
          },
        ],
      },
      access_token: "pk.e2e",
    },
  ]),
  MAPBOX_CENTER_LATITUDE: "5",
  MAPBOX_CENTER_LONGITUDE: "-60",
  MAPBOX_ZOOM: 12,
  FRONT_END_FILTER_COLUMN: "category",
  TIMESTAMP_COLUMN: "observed_at",
};
let view: ApiTestView;
let privateView: ApiTestView;
let alertsView: ApiTestView;
const secondary = `secondary_${randomUUID().replaceAll("-", "")}`;

test.beforeAll(async () => {
  const sql = createTestDatabaseClient(TEST_WAREHOUSE_DATABASE);
  try {
    await sql.unsafe(
      `CREATE TABLE "${secondary}" (_id text, g__type text, g__coordinates text, name text, photo text)`,
    );
    for (const row of secondaryRows)
      await sql.unsafe(`INSERT INTO "${secondary}" VALUES ($1,$2,$3,$4,$5)`, [
        row._id,
        row.g__type,
        row.g__coordinates,
        row.name,
        row.photo || null,
      ]);
  } finally {
    await sql.end();
  }
  const warehouseInitializer = async (
    database: ReturnType<typeof createTestDatabaseClient>,
    table: string,
  ) => {
    await database.unsafe(
      `CREATE TABLE "${table}" (_id text, g__type text, g__coordinates text, name text, category text, observed_at text)`,
    );
    await database.unsafe(
      `INSERT INTO "${table}" VALUES ('1','Point','[-59.99,5]','Primary observation','wildlife','2026-01-01')`,
    );
  };
  view = await createApiTestView({
    warehouseInitializer,
    secondaryDataset: secondary,
    viewConfig: config,
    viewType: "map",
  });
  const configSql = createTestDatabaseClient(TEST_CONFIG_DATABASE);
  try {
    await configSql`INSERT INTO public_views (view_id) SELECT view_id FROM views WHERE primary_dataset = ${view.primaryDataset}`;
  } finally {
    await configSql.end();
  }
  alertsView = await createApiTestView({
    sourceTable: "fake_alerts",
    secondaryDataset: secondary,
    viewConfig: {
      ROUTE_LEVEL_PERMISSION: "anyone",
      FRONT_END_FILTER_COLUMN: "name",
      SECONDARY_FILTER_VALUES: "Observation transect,Mapping areas",
    },
    viewType: "alerts",
  });
  privateView = await createApiTestView({
    warehouseInitializer,
    secondaryDataset: secondary,
    viewConfig: { ...config, ROUTE_LEVEL_PERMISSION: "member" },
    viewType: "map",
  });
});
test.afterAll(async () => {
  if (view) await deleteApiTestView(view);
  if (privateView) await deleteApiTestView(privateView);
  if (alertsView) await deleteApiTestView(alertsView);
  const sql = createTestDatabaseClient(TEST_WAREHOUSE_DATABASE);
  try {
    await sql.unsafe(`DROP TABLE IF EXISTS "${secondary}"`);
  } finally {
    await sql.end();
  }
});

test("Map API keeps primary fields and permits secondary records only through an authorized parent", async ({
  request,
}) => {
  const response = await request.get(`/api/${view.primaryDataset}/map?limit=5`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.features).toHaveLength(1);
  expect(body.secondaryData.features).toHaveLength(5);
  expect(body.secondary_dataset).toBe(secondary);
  expect(body.rowLimitReached).toBe(true);
  expect(body.filterColumn).toBe("category");
  expect(body.timestampColumn).toBe("observed_at");
  const record = await request.get(`/api/${secondary}/1`, {
    params: { view_type: "map", primary_dataset: view.primaryDataset },
  });
  expect(record.status()).toBe(200);
  expect(await record.json()).toMatchObject({ name: "Camera deployment" });
  expect(
    (
      await request.get(`/api/${secondary}/1`, { params: { view_type: "map" } })
    ).ok(),
  ).toBe(false);
  expect(
    (
      await request.get(`/api/${secondary}/1`, {
        params: {
          view_type: "map",
          primary_dataset: privateView.primaryDataset,
        },
      })
    ).ok(),
  ).toBe(false);
});

test("Alerts retains configured secondary filtering for lines and polygons", async ({
  request,
}) => {
  const response = await request.get(
    `/api/${alertsView.primaryDataset}/alerts`,
  );
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(
    body.secondaryData.features
      .map((feature: { geometry: { type: string } }) => feature.geometry.type)
      .sort(),
  ).toEqual(["LineString", "MultiPolygon"]);
});

test("shows both datasets, restores secondary metadata, toggles the group and reopens its link", async ({
  page,
}) => {
  await page.route("**/api.mapbox.com/map-sessions/**", (route) =>
    route.fulfill({ status: 200, body: "{}" }),
  );
  await page.route(/\/_ipx\/.*camera\.jpg/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#c7d2fe"/><text x="35" y="95" font-size="20">Synthetic camera photo</text></svg>',
    }),
  );
  await page.route("**/events.mapbox.com/**", (route) =>
    route.fulfill({ status: 200, body: "{}" }),
  );
  await page.goto(`/map/${view.primaryDataset}`);
  await waitForTestMap(page);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(window.getTestMap().getLayer("secondary-data")),
      ),
    )
    .toBe(true);
  const canvas = page.locator("canvas.mapboxgl-canvas");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Map canvas is missing");
  const point = await page.evaluate(() => {
    const position = window.getTestMap().project([-60, 5]);
    return { x: position.x, y: position.y };
  });
  await page.mouse.click(bounds.x + point.x, bounds.y + point.y);
  await expect(page).toHaveURL(/secondaryDocId=1/);
  await expect(
    page.getByText("Camera deployment", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          window.getTestMap().getLayer("secondary-data-polygon") &&
            window.getTestMap().getLayer("data-layer-point"),
        ),
      ),
    )
    .toBe(true);
  await expect(page.getByText("Image not found", { exact: true })).toHaveCount(
    0,
  );
  await page.getByTestId("map-legend-toggle").click();
  await page.locator('input[id="secondary-data"]').uncheck();
  expect(
    await page.evaluate(() =>
      [
        "secondary-data",
        "secondary-data-line",
        "secondary-data-polygon",
        "secondary-data-stroke",
      ].map((id) => window.getTestMap().getLayoutProperty(id, "visibility")),
    ),
  ).toEqual(["none", "none", "none", "none"]);
  await page.locator(".basemap-toggle").click();
  await page.getByLabel("Alternate", { exact: true }).check();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.getTestMap().getLayer("secondary-data-stroke") &&
          window
            .getTestMap()
            .getLayoutProperty("secondary-data-stroke", "visibility"),
      ),
    )
    .toBe("none");
  await expect(page.locator('input[id="secondary-data"]')).not.toBeChecked();
  await page.locator(".basemap-toggle").click();
  await page.locator('input[id="secondary-data"]').check();
  await page.evaluate(() =>
    window.getTestMap().fitBounds(
      [
        [-60.1, 4.99],
        [-59.98, 5.02],
      ],
      { padding: { left: 430, right: 30, top: 30, bottom: 30 }, duration: 0 },
    ),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.getTestMap().queryRenderedFeatures({
            layers: [
              "secondary-data",
              "secondary-data-line",
              "secondary-data-polygon",
            ],
          }).length,
      ),
    )
    .toBeGreaterThan(4);
  await page.screenshot({ path: "/tmp/gc-secondary-desktop.png" });
  const link = page.url();
  await page.goto(link);
  await expect(
    page.getByText("Camera deployment", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByText("Camera deployment", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/gc-secondary-mobile.png" });
});
