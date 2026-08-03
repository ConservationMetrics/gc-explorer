import { beforeEach, describe, expect, it, vi } from "vitest";

import alertsHandler from "@/server/api/[table]/alerts";

type AlertsRouteEvent = {
  context: { params: { table: string } };
};

type AlertsRouteHandler = (
  event: AlertsRouteEvent,
) => Promise<Record<string, unknown>>;

const handleAlertsRequest = alertsHandler as unknown as AlertsRouteHandler;

const hoisted = vi.hoisted(() => {
  Object.assign(globalThis, {
    defineEventHandler: (handler: unknown) => handler,
    useRuntimeConfig: () => ({
      public: {
        allowedFileExtensions: {
          audio: [],
          image: ["jpg"],
          video: [],
        },
      },
    }),
  });

  return {
    buildMinimalFeatureCollection: vi.fn(),
    buildRequiredAlertsProjection: vi.fn(),
    fetchTableConfig: vi.fn(),
    fetchTableSqlColumns: vi.fn(),
    fetchViewData: vi.fn(),
    fetchViewTables: vi.fn(),
    filterGeoData: vi.fn(),
    filterToSelectedValues: vi.fn(),
    filterUnwantedKeys: vi.fn(),
    parseAndValidateLimit: vi.fn(),
    parseBasemaps: vi.fn(),
    prepareAlertsStatistics: vi.fn(),
    prepareMinimalAlertEntries: vi.fn(),
    validatePermissions: vi.fn(),
  };
});

vi.mock("@/server/database/dbOperations", () => ({
  ALERTS_METADATA_PROJECTION: [],
  fetchTableConfig: hoisted.fetchTableConfig,
  fetchTableSqlColumns: hoisted.fetchTableSqlColumns,
  fetchViewData: hoisted.fetchViewData,
  fetchViewTables: hoisted.fetchViewTables,
}));

vi.mock("@/server/dataProcessing/dataTransformers", () => ({
  prepareAlertsStatistics: hoisted.prepareAlertsStatistics,
  prepareMinimalAlertEntries: hoisted.prepareMinimalAlertEntries,
}));

vi.mock("@/server/dataProcessing/dataFilters", () => ({
  filterGeoData: hoisted.filterGeoData,
  filterToSelectedValues: hoisted.filterToSelectedValues,
  filterUnwantedKeys: hoisted.filterUnwantedKeys,
}));

vi.mock("@/utils/geoUtils", () => ({
  buildMinimalFeatureCollection: hoisted.buildMinimalFeatureCollection,
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: hoisted.validatePermissions,
}));

vi.mock("@/server/utils", () => ({
  parseBasemaps: hoisted.parseBasemaps,
}));

vi.mock("@/server/utils/alertsProjection", () => ({
  buildRequiredAlertsProjection: hoisted.buildRequiredAlertsProjection,
}));

vi.mock("@/server/utils/dbHelpers", () => ({
  parseAndValidateLimit: hoisted.parseAndValidateLimit,
}));

describe("alerts endpoint secondary filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hoisted.parseAndValidateLimit.mockReturnValue(25);
    hoisted.fetchTableConfig.mockResolvedValue({
      FRONT_END_FILTER_COLUMN: "status",
      SECONDARY_FILTER_VALUES: "active",
      ROUTE_LEVEL_PERMISSION: "anyone",
    });
    hoisted.fetchViewTables.mockResolvedValue({
      primaryTable: "alerts_data",
      secondaryTable: "observations",
    });
    hoisted.fetchTableSqlColumns.mockImplementation((table: string) => {
      if (table === "observations") {
        return Promise.resolve(["_id", "status", "g__type", "g__coordinates"]);
      }
      return Promise.resolve([]);
    });
    hoisted.buildRequiredAlertsProjection.mockReturnValue([]);
    hoisted.fetchViewData.mockResolvedValue({
      primaryData: { mainData: [], metadata: [] },
      secondaryData: {
        mainData: [
          {
            _id: "observation-1",
            status: "active",
            g__type: "Point",
            g__coordinates: "[0,0]",
          },
          {
            _id: "observation-2",
            status: "closed",
            g__type: "Point",
            g__coordinates: "[1,1]",
          },
        ],
        columnsData: [],
      },
    });
    hoisted.prepareMinimalAlertEntries.mockReturnValue({
      mostRecentAlerts: [],
      previousAlerts: [],
    });
    hoisted.prepareAlertsStatistics.mockReturnValue({});
    hoisted.filterUnwantedKeys.mockImplementation((data) => data);
    hoisted.filterToSelectedValues.mockImplementation(
      (data: Array<Record<string, unknown>>, column: string, values: string) =>
        data.filter((row) => values.split(",").includes(String(row[column]))),
    );
    hoisted.filterGeoData.mockImplementation((data) => data);
    hoisted.buildMinimalFeatureCollection.mockImplementation(
      (data: Array<Record<string, unknown>>) => ({
        type: "FeatureCollection",
        features: data,
      }),
    );
    hoisted.parseBasemaps.mockReturnValue({
      basemaps: [],
      defaultMapboxStyle: "mapbox://styles/mapbox/streets-v12",
    });
  });

  it("keeps values from the configured secondary dataset column", async () => {
    const response = await handleAlertsRequest({
      context: { params: { table: "route_alerts" } },
    });

    expect(hoisted.filterToSelectedValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ status: "active" }),
        expect.objectContaining({ status: "closed" }),
      ]),
      "status",
      "active",
    );
    expect(hoisted.buildMinimalFeatureCollection).toHaveBeenLastCalledWith(
      [expect.objectContaining({ status: "active" })],
      {
        idField: "_id",
        includeAllProperties: true,
      },
    );
    expect(response.secondaryData).toEqual({
      type: "FeatureCollection",
      features: [expect.objectContaining({ status: "active" })],
    });
  });

  it("uses the Mapeo category column for legacy configs", async () => {
    hoisted.fetchTableConfig.mockResolvedValue({
      SECONDARY_CATEGORY_IDS: "threat",
      ROUTE_LEVEL_PERMISSION: "anyone",
    });
    hoisted.fetchViewData.mockResolvedValue({
      primaryData: { mainData: [], metadata: [] },
      secondaryData: {
        mainData: [
          {
            _id: "observation-1",
            p__categoryid: "threat",
            g__type: "Point",
            g__coordinates: "[0,0]",
          },
        ],
        columnsData: [],
      },
    });

    await handleAlertsRequest({
      context: { params: { table: "route_alerts" } },
    });

    expect(hoisted.filterToSelectedValues).toHaveBeenCalledWith(
      expect.any(Array),
      "p__categoryid",
      "threat",
    );
  });
});
