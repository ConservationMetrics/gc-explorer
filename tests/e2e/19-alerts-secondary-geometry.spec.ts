import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { secondaryRows } from "@/tests/fixtures/secondaryGeometry";
import { createApiTestView, deleteApiTestView } from "./helpers/apiTestData";
import {
  createTestDatabaseClient,
  TEST_WAREHOUSE_DATABASE,
} from "./helpers/testDatabase";
import type { ApiTestView } from "@/types";

let view: ApiTestView;
const secondary = `secondary_${randomUUID().replaceAll("-", "")}`;

test.beforeAll(async () => {
  const sql = createTestDatabaseClient(TEST_WAREHOUSE_DATABASE);
  try {
    await sql.unsafe(
      `CREATE TABLE "${secondary}" (_id text, g__type text, g__coordinates text, name text)`,
    );
    for (const row of secondaryRows)
      await sql.unsafe(`INSERT INTO "${secondary}" VALUES ($1,$2,$3,$4)`, [
        row._id,
        row.g__type,
        row.g__coordinates,
        row.name,
      ]);
  } finally {
    await sql.end();
  }
  view = await createApiTestView({
    sourceTable: "fake_alerts",
    secondaryDataset: secondary,
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
  const sql = createTestDatabaseClient(TEST_WAREHOUSE_DATABASE);
  try {
    await sql.unsafe(`DROP TABLE IF EXISTS "${secondary}"`);
  } finally {
    await sql.end();
  }
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
