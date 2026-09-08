import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import type { ApiTestView } from "@/types";

test.describe("alerts dataset API", () => {
  let view: ApiTestView | null = null;

  test.beforeAll(async () => {
    view = await createApiTestView({
      sourceTable: "fake_alerts",
      secondaryDataset: "mapeo_data",
      viewConfig: {
        FRONT_END_FILTER_COLUMN: "p__categoryid",
        ROUTE_LEVEL_PERMISSION: "anyone",
        SECONDARY_FILTER_VALUES: "threat",
      },
      viewType: "alerts",
    });
  });

  test.afterAll(async () => {
    if (view) await deleteApiTestView(view);
  });

  test("returns the alerts dataset contract", async ({
    authenticatedRequestAsAdmin: request,
  }) => {
    if (!view) throw new Error("Alerts API test view was not created");

    const response = await request.get(
      `/api/${view.primaryDataset}/${view.viewType}`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.primary_dataset).toBe(view.primaryDataset);
    expect(body.table).toBe(body.primary_dataset);
    expect(body.secondary_dataset).toBe(view.secondaryDataset);
    expect(body.routeLevelPermission).toBe("anyone");
    expect(typeof body.rowLimitReached).toBe("boolean");

    expect(body.alertsData).toEqual(
      expect.objectContaining({
        mostRecentAlerts: expect.objectContaining({
          type: "FeatureCollection",
          features: expect.any(Array),
        }),
        previousAlerts: expect.objectContaining({
          type: "FeatureCollection",
          features: expect.any(Array),
        }),
      }),
    );
    expect(
      body.alertsData.mostRecentAlerts.features.length +
        body.alertsData.previousAlerts.features.length,
    ).toBeGreaterThan(0);
  });

  test("filters secondary data to the configured values", async ({
    authenticatedRequestAsAdmin: request,
  }) => {
    if (!view) throw new Error("Alerts API test view was not created");

    const response = await request.get(
      `/api/${view.primaryDataset}/${view.viewType}`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.secondaryData).toEqual(
      expect.objectContaining({
        type: "FeatureCollection",
        features: expect.any(Array),
      }),
    );
    expect(body.secondaryData.features.length).toBe(2);
    for (const feature of body.secondaryData.features) {
      expect(feature.properties.p__categoryid).toBe("threat");
    }
  });
});

test.describe("record APIs", () => {
  let view: ApiTestView | null = null;

  test.beforeAll(async () => {
    view = await createApiTestView({
      sourceTable: "seed_survey_data",
      viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
      viewType: "gallery",
    });
  });

  test.afterAll(async () => {
    if (view) await deleteApiTestView(view);
  });

  test("returns a warehouse row by record ID", async ({
    authenticatedRequestAsAdmin: request,
  }) => {
    if (!view) throw new Error("Record API test view was not created");

    const response = await request.get(
      `/api/${view.primaryDataset}/254137498?view_type=${view.viewType}`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body._id).toBe("254137498");
    expect(typeof body.photo).toBe("string");
    expect(typeof body.community).toBe("string");
  });

  test("returns matching rows and omits missing record IDs", async ({
    authenticatedRequestAsAdmin: request,
  }) => {
    if (!view) throw new Error("Record API test view was not created");

    const response = await request.post(
      `/api/${view.primaryDataset}/records?view_type=${view.viewType}`,
      {
        data: { ids: ["254137498", "missing-id"] },
      },
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0]._id).toBe("254137498");
  });
});

test.describe("invalid alerts dataset", () => {
  let view: ApiTestView | null = null;

  test.beforeAll(async () => {
    view = await createApiTestView({
      sourceTable: "seed_survey_data",
      viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
      viewType: "alerts",
    });
  });

  test.afterAll(async () => {
    if (view) await deleteApiTestView(view);
  });

  test("returns 422 when required alerts columns are missing", async ({
    authenticatedRequestAsAdmin: request,
  }) => {
    if (!view) throw new Error("Invalid alerts API test view was not created");

    const response = await request.get(
      `/api/${view.primaryDataset}/${view.viewType}`,
    );
    expect(response.status()).toBe(422);
    expect(JSON.stringify(await response.json())).toContain(
      "Alerts dashboard datasets require columns",
    );
  });
});
