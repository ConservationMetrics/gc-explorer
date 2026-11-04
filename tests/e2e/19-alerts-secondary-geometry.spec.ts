import { test, expect } from "@playwright/test";
import { secondaryRows } from "@/tests/fixtures/secondaryGeometry";
import { alertsTable } from "@/tests/fixtures/warehouseTables";
import { createApiTestView, deleteApiTestView } from "./helpers/apiTestData";
import type { ApiTestView } from "@/types";

let view: ApiTestView;

test.beforeAll(async () => {
  view = await createApiTestView({
    table: alertsTable,
    secondaryTable: {
      columns: ["_id", "g__type", "g__coordinates", "name", "photo"],
      rows: secondaryRows,
    },
    viewConfig: {
      ROUTE_LEVEL_PERMISSION: "anyone",
      FRONT_END_FILTER_COLUMN: "name",
      SECONDARY_FILTER_VALUES: "Observation transect,Mapping areas",
    },
    viewType: "alerts",
  });
});

test.afterAll(async () => {
  if (view) await deleteApiTestView(view);
});

test("Alerts retains configured secondary filtering for lines and polygons", async ({
  request,
}) => {
  const response = await request.get(`/api/${view.primaryDataset}/alerts`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(
    body.secondaryData.features
      .map((feature: { geometry: { type: string } }) => feature.geometry.type)
      .sort(),
  ).toEqual(["LineString", "MultiPolygon"]);
});
