import {
  ALERTS_METADATA_PROJECTION,
  fetchTableConfig,
  fetchTableSqlColumns,
  fetchViewData,
  fetchViewTables,
} from "@/server/database/dbOperations";
import murmurhash from "murmurhash";
import {
  prepareAlertsStatistics,
  prepareMinimalAlertEntries,
} from "@/server/dataProcessing/dataTransformers";
import {
  filterUnwantedKeys,
  filterGeoData,
  filterToSelectedValues,
} from "@/server/dataProcessing/dataFilters";
import { buildMinimalFeatureCollection } from "@/utils/geoUtils";
import { validatePermissions } from "@/utils/accessControls";
import { parseBasemaps } from "@/server/utils";
import { buildRequiredAlertsProjection } from "@/server/utils/alertsProjection";
import { parseAndValidateLimit } from "@/server/utils/dbHelpers";

import type { H3Event } from "h3";
import type {
  AllowedFileExtensions,
  DataEntry,
  AlertsMetadata,
  ViewConfig,
} from "@/types";
import type { FeatureCollection } from "geojson";

const ALERTS_MAIN_PROJECTION = [
  "_id",
  "alert_id",
  "month_detec",
  "year_detec",
  "day_detec",
  "date_end_t1",
  "data_source",
  "territory_name",
  "alert_type",
  "area_alert_ha",
  "g__type",
  "g__coordinates",
];

const REQUIRED_ALERTS_MAIN_COLUMNS = [
  "_id",
  "alert_id",
  "month_detec",
  "year_detec",
  "g__type",
  "g__coordinates",
];

/**
 * Reads secondary include values from current and legacy config keys.
 *
 * @param {ViewConfig} tableConfig - Alerts view configuration.
 * @returns {string | undefined} Comma-separated values to include.
 */
const resolveSecondaryFilterValues = (
  tableConfig: ViewConfig,
): string | undefined =>
  tableConfig.SECONDARY_FILTER_VALUES ||
  tableConfig.SECONDARY_CATEGORY_IDS ||
  tableConfig.MAPEO_CATEGORY_IDS;

/**
 * Resolves the secondary filter column, including the implicit Mapeo column.
 *
 * @param {ViewConfig} tableConfig - Alerts view configuration.
 * @returns {string | undefined} Secondary dataset column to filter.
 */
const resolveSecondaryFilterColumn = (
  tableConfig: ViewConfig,
): string | undefined =>
  tableConfig.FRONT_END_FILTER_COLUMN ||
  (tableConfig.SECONDARY_CATEGORY_IDS || tableConfig.MAPEO_CATEGORY_IDS
    ? "p__categoryid"
    : undefined);

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };
  const limit = parseAndValidateLimit(event);

  const {
    public: { allowedFileExtensions },
  } = useRuntimeConfig() as unknown as {
    public: { allowedFileExtensions: AllowedFileExtensions };
  };

  try {
    const tableConfig = await fetchTableConfig(table, "alerts");
    const { primaryTable, secondaryTable } = await fetchViewTables(
      table,
      "alerts",
    );

    // Check visibility permissions
    const permission = tableConfig.ROUTE_LEVEL_PERMISSION ?? "member";

    // Validate user authentication and permissions
    await validatePermissions(event, permission);

    const availableMainColumns = await fetchTableSqlColumns(primaryTable);
    const alertsMainProjection = buildRequiredAlertsProjection(
      primaryTable,
      ALERTS_MAIN_PROJECTION,
      REQUIRED_ALERTS_MAIN_COLUMNS,
      availableMainColumns,
      "Alerts dashboard datasets",
    );
    const availableMetadataColumns = await fetchTableSqlColumns(
      `${primaryTable}__metadata`,
    );
    const alertsMetadataProjection = ALERTS_METADATA_PROJECTION.filter(
      (columnName) => availableMetadataColumns.includes(columnName),
    );

    const secondaryFilterColumn = resolveSecondaryFilterColumn(tableConfig);
    const secondaryFilterValues = resolveSecondaryFilterValues(tableConfig);
    const shouldFetchSecondaryData = Boolean(secondaryTable);
    const secondaryMainColumns = shouldFetchSecondaryData
      ? await fetchTableSqlColumns(secondaryTable!)
      : [];

    const { primaryData, secondaryData } = await fetchViewData(primaryTable, {
      secondaryTable: shouldFetchSecondaryData ? secondaryTable : null,
      primaryOptions: {
        limit,
        mainColumns: alertsMainProjection,
        includeMetadata: alertsMetadataProjection.length > 0,
        metadataColumns: alertsMetadataProjection,
      },
      secondaryOptions: {
        limit,
        mainColumns: secondaryMainColumns,
        includeColumnsData: true,
      },
    });

    const { mainData, metadata } = primaryData as {
      mainData: DataEntry[];
      metadata: AlertsMetadata[];
    };

    const { mostRecentAlerts, previousAlerts } =
      prepareMinimalAlertEntries(mainData);

    const minimalAlertOptions = {
      includeProperties: ["alertID", "YYYYMM", "geographicCentroid"],
      generateId: (entry: DataEntry) => murmurhash.v3(String(entry.alertID)),
    };

    const alertsGeojsonData = {
      mostRecentAlerts: buildMinimalFeatureCollection(
        mostRecentAlerts,
        minimalAlertOptions,
      ),
      previousAlerts: buildMinimalFeatureCollection(
        previousAlerts,
        minimalAlertOptions,
      ),
    };

    let secondaryGeojson: FeatureCollection | null = null;

    if (secondaryData) {
      // Filter data to remove unwanted columns and substrings
      let filteredSecondaryData = filterUnwantedKeys(
        secondaryData.mainData,
        secondaryData.columnsData,
        tableConfig.UNWANTED_COLUMNS,
        tableConfig.UNWANTED_SUBSTRINGS,
      );

      filteredSecondaryData = filterToSelectedValues(
        filteredSecondaryData,
        secondaryFilterColumn,
        secondaryFilterValues,
      );

      // Filter only data with valid geofields
      const filteredSecondaryGeoData = filterGeoData(filteredSecondaryData);

      secondaryGeojson = buildMinimalFeatureCollection(
        filteredSecondaryGeoData,
        {
          idField: "_id",
          includeAllProperties: true,
        },
      );

      if (secondaryGeojson.features.length === 0) {
        secondaryGeojson = null;
      }
    }

    // Prepare statistics data for the alerts view
    const alertsStatistics = prepareAlertsStatistics(mainData, metadata);

    // Parse basemaps configuration
    const { basemaps, defaultMapboxStyle } = parseBasemaps(tableConfig);

    return {
      alertsData: alertsGeojsonData,
      alertsStatistics,
      allowedFileExtensions,
      logoUrl: tableConfig.LOGO_URL,
      mapLegendLayerIds: tableConfig.MAP_LEGEND_LAYER_IDS,
      mapbox3d: tableConfig.MAPBOX_3D ?? false,
      mapbox3dTerrainExaggeration: Number(
        tableConfig.MAPBOX_3D_TERRAIN_EXAGGERATION,
      ),
      mapboxAccessToken: tableConfig.MAPBOX_ACCESS_TOKEN,
      mapboxBearing: Number(tableConfig.MAPBOX_BEARING),
      mapboxLatitude: Number(tableConfig.MAPBOX_CENTER_LATITUDE),
      mapboxLongitude: Number(tableConfig.MAPBOX_CENTER_LONGITUDE),
      mapboxPitch: Number(tableConfig.MAPBOX_PITCH),
      mapboxProjection: tableConfig.MAPBOX_PROJECTION,
      mapboxStyle: defaultMapboxStyle,
      mapboxBasemaps: basemaps,
      mapboxZoom: Number(tableConfig.MAPBOX_ZOOM),
      secondaryData: secondaryGeojson,
      mediaBasePath: tableConfig.MEDIA_BASE_PATH,
      mediaBasePathAlerts: tableConfig.MEDIA_BASE_PATH_ALERTS,
      planetApiKey: tableConfig.PLANET_API_KEY,
      primary_dataset: primaryTable,
      secondary_dataset: secondaryTable,
      table: primaryTable,
      rowLimitReached: mainData.length >= limit,
      routeLevelPermission: tableConfig.ROUTE_LEVEL_PERMISSION,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching data on API side:", error.message);
      return sendError(event, error);
    } else {
      console.error("Unknown error fetching data on API side:", error);
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});
