import type { FeatureCollection } from "geojson";

import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import { stubMapboxTelemetry } from "@/tests/e2e/helpers/configPage";
import type { ApiTestView } from "@/types";

test.describe("polygon map rendering", () => {
  let view: ApiTestView | null = null;

  test.beforeAll(async () => {
    view = await createApiTestView({
      sourceTable: "test_polygon_features",
      viewConfig: {
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
        MAPBOX_CENTER_LATITUDE: "0",
        MAPBOX_CENTER_LONGITUDE: "0",
        MAPBOX_PITCH: 0,
        MAPBOX_PROJECTION: "mercator",
        MAPBOX_ZOOM: 5,
        ROUTE_LEVEL_PERMISSION: "member",
      },
      viewType: "map",
    });
  });

  test.afterAll(async () => {
    if (view) await deleteApiTestView(view);
  });

  test("renders Polygon and MultiPolygon features", async ({
    authenticatedPageAsAdmin: page,
    authenticatedRequestAsAdmin: request,
  }) => {
    if (!view) throw new Error("Polygon map test view was not created");

    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    const apiResponse = await request.get(
      `/api/${view.primaryDataset}/${view.viewType}`,
    );
    expect(apiResponse.status()).toBe(200);

    const responseBody = (await apiResponse.json()) as {
      data: FeatureCollection;
    };
    expect(
      responseBody.data.features.map((feature) => feature.geometry.type),
    ).toEqual(["Polygon", "MultiPolygon"]);

    await stubMapboxTelemetry(page);
    await page.goto(`/${view.viewType}/${view.primaryDataset}`);
    await page.waitForFunction(() => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      return Boolean(window._testMap?.getLayer("data-layer-polygon"));
    });
    await page.waitForFunction(() => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      return Boolean(window._testMap?.loaded());
    });
    await page.evaluate(async () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      map.resize();
      map.fitBounds(
        [
          [-2, -1.5],
          [2, 1.5],
        ],
        { duration: 0, padding: 20 },
      );
      await new Promise<void>((resolve) => map.once("idle", resolve));
    });

    const mapState = await page.evaluate(() => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      const source = map.getSource("data-source") as {
        _data?: FeatureCollection;
      };
      const polygonLayer = map
        .getStyle()
        .layers.find(
          (layer: { id: string }) => layer.id === "data-layer-polygon",
        );
      const renderedFeatureIds = map
        .queryRenderedFeatures({ layers: ["data-layer-polygon"] })
        .map((feature: { properties?: { _id?: string } }) => {
          return feature.properties?._id;
        });

      return {
        filter: polygonLayer?.filter,
        renderedFeatureIds,
        sourceFeatureIds:
          source._data?.features.map((feature) => feature.properties?._id) ??
          [],
      };
    });

    expect(mapState.filter).toEqual(["==", "$type", "Polygon"]);
    expect(mapState.sourceFeatureIds).toEqual([
      "test-polygon",
      "test-multipolygon",
    ]);
    expect(mapState.renderedFeatureIds).toEqual(
      expect.arrayContaining(["test-polygon", "test-multipolygon"]),
    );

    const polygonLayerErrors = consoleErrors.filter((message) => {
      return (
        message.includes("layers.data-layer-polygon.filter") ||
        message.includes('"MultiPolygon" found')
      );
    });
    expect(polygonLayerErrors).toEqual([]);
  });
});
