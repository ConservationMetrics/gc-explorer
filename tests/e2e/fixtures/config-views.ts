import { test as authTest, expect } from "./auth-storage";
import { createApiTestView, deleteApiTestView } from "../helpers/apiTestData";
import type { ApiTestView, ViewConfig } from "@/types";

const mapConfig: ViewConfig = {
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
      access_token: "pk.ey_e2e_mapbox_access_token_value",
      isDefault: true,
    },
  ]),
  MAPBOX_CENTER_LATITUDE: "3.44704",
  MAPBOX_CENTER_LONGITUDE: "-76.53995",
  MAPBOX_ZOOM: 16,
  MAPBOX_PROJECTION: "globe",
  MAPBOX_BEARING: 0,
  MAPBOX_PITCH: 0,
  FRONT_END_FILTER_COLUMN: "community",
  ROUTE_LEVEL_PERMISSION: "member",
};

export const test = authTest.extend<{
  configMapView: ApiTestView;
  configGalleryView: ApiTestView;
}>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires a fixture dependency pattern.
  configMapView: async ({}, use) => {
    const view = await createApiTestView({
      sourceTable: "bcmform_responses",
      viewType: "map",
      viewConfig: mapConfig,
    });
    try {
      await use(view);
    } finally {
      await deleteApiTestView(view);
    }
  },
  configGalleryView: async ({ baseURL }, use) => {
    const view = await createApiTestView({
      sourceTable: "seed_survey_data",
      viewType: "gallery",
      viewConfig: {
        FRONT_END_FILTER_COLUMN: "community",
        MEDIA_COLUMN: "photo",
        MEDIA_BASE_PATH: new URL("/test-media", baseURL).href,
        ROUTE_LEVEL_PERMISSION: "member",
      },
    });
    try {
      await use(view);
    } finally {
      // Tests can add a map for the same test-owned warehouse table.
      await deleteApiTestView({ ...view, viewType: "map" });
      await deleteApiTestView(view);
    }
  },
});

export { expect };
