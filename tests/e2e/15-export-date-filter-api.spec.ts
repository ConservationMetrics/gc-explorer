import type { APIResponse } from "@playwright/test";

import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import {
  createTestDatabaseClient,
  TEST_WAREHOUSE_DATABASE,
} from "@/tests/e2e/helpers/testDatabase";
import type { ApiTestView } from "@/types";

/**
 * Reads record IDs from an export response for the test dataset.
 *
 * @param response - HTTP export response.
 * @param format - Requested file format.
 * @returns IDs in the downloaded file.
 */
const exportIds = async (
  response: APIResponse,
  format: string,
): Promise<string[]> => {
  expect(response.status()).toBe(200);
  if (format === "geojson") {
    const data = await response.json();
    return data.features.map(
      (feature: { properties: { _id: string } }) => feature.properties._id,
    );
  }
  const content = await response.text();
  if (format === "kml") {
    expect(response.headers()["content-type"]).toContain(
      "application/vnd.google-earth.kml+xml",
    );
    const ids = [
      ...content.matchAll(/<Data name="_id"><value>([^<]*)<\/value><\/Data>/g),
    ].map((match) => match[1]);
    expect(content.match(/<Placemark>/g) ?? []).toHaveLength(ids.length);
    return ids;
  }
  const [header, ...rows] = content.trim().split("\n");
  if (!header) return [];
  expect(header.split(",")[0]).toBe("_id");
  return rows.map((row) => row.split(",")[0]);
};

for (const viewType of ["map", "alerts"] as const) {
  test.describe(`${viewType} export date filter (#645)`, () => {
    let view: ApiTestView | null = null;
    const records = [
      { _id: "before", date: "2024-01-31T23:59:59.999Z", month: "1" },
      { _id: "start", date: "2024-02-01T00:00:00.000Z", month: "02" },
      { _id: "middle", date: "2024-02-15T12:00:00.000Z", month: "2" },
      { _id: "end", date: "2024-02-29T23:59:59.999Z", month: "02" },
      { _id: "after", date: "2024-03-01T00:00:00.000Z", month: "3" },
      { _id: "missing", date: null, month: null },
      { _id: "invalid", date: "not-a-date", month: "invalid" },
    ];

    test.beforeAll(async () => {
      view = await createApiTestView({
        sourceTable: viewType === "map" ? "seed_survey_data" : "fake_alerts",
        viewConfig: {
          ...(viewType === "map"
            ? { TIMESTAMP_COLUMN: "_submission_time" }
            : {}),
          ROUTE_LEVEL_PERMISSION: "anyone",
        },
        viewType,
      });
      const sql = createTestDatabaseClient(TEST_WAREHOUSE_DATABASE);
      try {
        await sql`DELETE FROM ${sql(view.primaryDataset)}`;
        await sql`INSERT INTO ${sql(view.primaryDataset)} ${sql(
          records.map((record) => ({
            _id: record._id,
            ...(viewType === "map"
              ? { _submission_time: record.date }
              : { year_detec: "2024", month_detec: record.month }),
            g__type: "Point",
            g__coordinates: "[10,20]",
          })),
        )}`;
      } finally {
        await sql.end({ timeout: 5 });
      }
    });

    test.afterAll(async () => {
      if (view) await deleteApiTestView(view);
    });

    const cases = [
      {
        name: "includes both date bounds and excludes records outside the range",
        dates:
          viewType === "map"
            ? { minDate: "2024-02-01", maxDate: "2024-02-29T23:59:59.999Z" }
            : { minDate: "202402", maxDate: "202402" },
        expectedIds: ["start", "middle", "end"],
      },
      {
        name: "returns no records when no dates match",
        dates: { minDate: viewType === "map" ? "2025-01-01" : "202501" },
        expectedIds: [],
      },
      {
        name: "supports an upper date bound alone",
        dates: {
          maxDate: viewType === "map" ? "2024-01-31T23:59:59.999Z" : "202401",
        },
        expectedIds: ["before"],
      },
    ];

    for (const format of ["kml", "csv", "geojson"]) {
      for (const { name, dates, expectedIds } of cases) {
        test(`${format}: ${name}`, async ({ request }) => {
          if (!view) throw new Error("Export API test view was not created");
          const response = await request.get(
            `/api/${view.primaryDataset}/export`,
            {
              params: { format, view_type: view.viewType, ...dates },
            },
          );
          expect((await exportIds(response, format)).sort()).toEqual(
            [...expectedIds].sort(),
          );

          const unfiltered = await request.get(
            `/api/${view.primaryDataset}/export`,
            {
              params: { format, view_type: view.viewType },
            },
          );
          expect((await exportIds(unfiltered, format)).sort()).toEqual(
            records.map((record) => record._id).sort(),
          );
        });
      }
    }
  });
}
