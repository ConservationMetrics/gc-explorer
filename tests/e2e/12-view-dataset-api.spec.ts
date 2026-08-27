import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import { VIEW_CONFIG_MISSING_COLUMNS_ERROR, type ApiTestView } from "@/types";

test.describe("gallery dataset API", () => {
  let view: ApiTestView | null = null;

  test.beforeAll(async () => {
    view = await createApiTestView({
      sourceTable: "seed_survey_data",
      viewConfig: {
        FRONT_END_FILTER_COLUMN: "community",
        MEDIA_COLUMN: "photo",
        ROUTE_LEVEL_PERMISSION: "member",
      },
      viewType: "gallery",
    });
  });

  test.afterAll(async () => {
    if (view) await deleteApiTestView(view);
  });

  test("returns the gallery dataset contract", async ({
    authenticatedRequestAsAdmin: request,
  }) => {
    if (!view) throw new Error("Gallery API test view was not created");

    const response = await request.get(
      `/api/${view.primaryDataset}/${view.viewType}`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.primary_dataset).toBe(view.primaryDataset);
    expect(body.table).toBe(body.primary_dataset);
    expect(body.filterColumn).toBe("community");
    expect(body.routeLevelPermission).toBe("member");
    expect(typeof body.rowLimitReached).toBe("boolean");
    expect(body.allowedFileExtensions).toEqual(
      expect.objectContaining({
        image: expect.any(Array),
        audio: expect.any(Array),
        video: expect.any(Array),
      }),
    );

    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    for (const item of body.data) {
      expect(item).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
        }),
      );
    }
    expect(
      body.data.some(
        (item: Record<string, unknown>) =>
          typeof item.photo === "string" || typeof item.audio === "string",
      ),
    ).toBe(true);
  });
});

test.describe("map dataset API", () => {
  let view: ApiTestView | null = null;

  test.beforeAll(async () => {
    view = await createApiTestView({
      sourceTable: "bcmform_responses",
      viewConfig: {
        FRONT_END_FILTER_COLUMN: "community",
        MAPBOX_CENTER_LATITUDE: "3.44704",
        MAPBOX_CENTER_LONGITUDE: "-76.53995",
        MAPBOX_ZOOM: 16,
        ROUTE_LEVEL_PERMISSION: "member",
      },
      viewType: "map",
    });
  });

  test.afterAll(async () => {
    if (view) await deleteApiTestView(view);
  });

  test("returns the map dataset contract", async ({
    authenticatedRequestAsAdmin: request,
  }) => {
    if (!view) throw new Error("Map API test view was not created");

    const response = await request.get(
      `/api/${view.primaryDataset}/${view.viewType}`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.primary_dataset).toBe(view.primaryDataset);
    expect(body.table).toBe(body.primary_dataset);
    expect(body.filterColumn).toBe("community");
    expect(typeof body.rowLimitReached).toBe("boolean");
    expect(body.mapboxLatitude).toEqual(expect.any(Number));
    expect(body.mapboxLongitude).toEqual(expect.any(Number));
    expect(body.mapboxZoom).toEqual(expect.any(Number));
    expect(body.mapStatistics).toEqual(
      expect.objectContaining({
        totalFeatures: expect.any(Number),
      }),
    );

    expect(body.data).toEqual(
      expect.objectContaining({
        type: "FeatureCollection",
        features: expect.any(Array),
      }),
    );
    expect(body.data.features.length).toBeGreaterThan(0);
    expect(body.data.features[0]).toEqual(
      expect.objectContaining({
        type: "Feature",
        geometry: expect.any(Object),
        properties: expect.any(Object),
      }),
    );
  });
});

test.describe("invalid view config", () => {
  let view: ApiTestView | null = null;

  test.beforeAll(async () => {
    view = await createApiTestView({
      sourceTable: "bcmform_responses",
      viewConfig: {
        COLOR_COLUMN: "missing_api_test_column",
        ROUTE_LEVEL_PERMISSION: "member",
      },
      viewType: "map",
    });
  });

  test.afterAll(async () => {
    if (view) await deleteApiTestView(view);
  });

  test("returns 422 when a configured column is missing", async ({
    authenticatedRequestAsAdmin: request,
  }) => {
    if (!view) throw new Error("Invalid-config API test view was not created");

    const response = await request.get(
      `/api/${view.primaryDataset}/${view.viewType}`,
    );
    expect(response.status()).toBe(422);
    expect(JSON.stringify(await response.json())).toContain(
      VIEW_CONFIG_MISSING_COLUMNS_ERROR,
    );
  });
});
