import { test as authTest, expect } from "./auth-storage";
import { createApiTestView, deleteApiTestView } from "../helpers/apiTestData";
import {
  alertsTable,
  mapeoTable,
  surveyTable,
} from "@/tests/fixtures/warehouseTables";
import type { ApiTestView, ApiTestViewInput, ViewConfig } from "@/types";

// A local style keeps map loads independent of the remote Mapbox style API.
const localBasemaps = JSON.stringify([
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
]);

const surveyMapConfig: ViewConfig = {
  MAPBOX_BASEMAPS: localBasemaps,
  MAPBOX_CENTER_LATITUDE: "3.44704",
  MAPBOX_CENTER_LONGITUDE: "-76.53995",
  MAPBOX_ZOOM: 16,
  MAPBOX_PROJECTION: "globe",
  MAPBOX_BEARING: 0,
  MAPBOX_PITCH: 0,
  FRONT_END_FILTER_COLUMN: "community",
  ROUTE_LEVEL_PERMISSION: "member",
};

const alertsConfig: ViewConfig = {
  EMBED_MEDIA: "YES",
  MAPBOX_BASEMAPS: localBasemaps,
  MAPBOX_PROJECTION: "globe",
  MAPBOX_CENTER_LATITUDE: "38",
  MAPBOX_CENTER_LONGITUDE: "-79",
  MAPBOX_ZOOM: 7,
  MAPBOX_PITCH: 0,
  MAPBOX_BEARING: 0,
  MAPBOX_3D: false,
  FRONT_END_FILTER_COLUMN: "p__categoryid",
  SECONDARY_FILTER_VALUES: "threat",
  MAP_LEGEND_LAYER_IDS: "road-primary,aerialway",
  ALERT_RESOURCES: "NO",
  // Any value shows the Planet basemap option next to the Mapbox basemap.
  PLANET_API_KEY: "{PLANET_API_KEY}",
  ROUTE_LEVEL_PERMISSION: "anyone",
};

/**
 * Creates a view for one test and deletes it after the test.
 *
 * @param input - Arguments for createApiTestView.
 * @param use - Playwright fixture callback.
 * @returns {Promise<void>}
 */
const useTestView = async (
  input: ApiTestViewInput,
  use: (view: ApiTestView) => Promise<void>,
): Promise<void> => {
  const view = await createApiTestView(input);
  try {
    await use(view);
  } finally {
    await deleteApiTestView(view);
  }
};

export const test = authTest.extend<{
  alertsView: ApiTestView;
  galleryView: ApiTestView;
  mapView: ApiTestView;
  publicGalleryView: ApiTestView;
}>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires a fixture dependency pattern.
  alertsView: async ({}, use) => {
    await useTestView(
      {
        table: alertsTable,
        secondaryTable: mapeoTable,
        viewConfig: alertsConfig,
        viewType: "alerts",
      },
      use,
    );
  },
  galleryView: async ({ baseURL }, use) => {
    await useTestView(
      {
        table: surveyTable,
        viewConfig: {
          ...surveyMapConfig,
          MEDIA_BASE_PATH: new URL("/test-media", baseURL).href,
        },
        viewType: "gallery",
      },
      use,
    );
  },
  // eslint-disable-next-line no-empty-pattern -- Playwright requires a fixture dependency pattern.
  mapView: async ({}, use) => {
    await useTestView(
      { table: surveyTable, viewConfig: surveyMapConfig, viewType: "map" },
      use,
    );
  },
  publicGalleryView: async ({ baseURL }, use) => {
    await useTestView(
      {
        table: surveyTable,
        viewConfig: {
          ...surveyMapConfig,
          MEDIA_BASE_PATH: new URL("/test-media", baseURL).href,
          ROUTE_LEVEL_PERMISSION: "anyone",
        },
        viewType: "gallery",
      },
      use,
    );
  },
});

export { expect };
