import {
  fetchData,
  fetchInformationSchemaColumns,
  fetchTableConfig,
  fetchTableSqlColumns,
  fetchViewTables,
} from "@/server/database/dbOperations";
import {
  filterDataByExtension,
  valueHasAllowedFileExtension,
} from "@/server/dataProcessing/dataFilters";
import { parseBasemaps } from "@/server/utils";
import {
  assertConfiguredColumnsExist,
  getConfiguredColumns,
} from "@/server/utils/assertConfiguredColumns";
import { parseAndValidateLimit, getTableParam } from "@/server/utils/dbHelpers";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";
import type { AllowedFileExtensions } from "@/types";

export default defineEventHandler(async (event: H3Event) => {
  const table = getTableParam(event);
  const limit = parseAndValidateLimit(event);

  const {
    public: { allowedFileExtensions },
  } = useRuntimeConfig() as unknown as {
    public: { allowedFileExtensions: AllowedFileExtensions };
  };

  try {
    const tableConfig = await fetchTableConfig(table, "gallery");
    const { primaryTable } = await fetchViewTables(table, "gallery");

    // Check visibility permissions
    const permission = tableConfig.ROUTE_LEVEL_PERMISSION ?? "member";

    // Validate user authentication and permissions
    await validatePermissions(event, permission);

    const filterColumn = tableConfig.FRONT_END_FILTER_COLUMN;
    const mediaColumn = tableConfig.MEDIA_COLUMN;
    const timestampColumn = tableConfig.TIMESTAMP_COLUMN;

    if (mediaColumn) {
      const configuredColumns = getConfiguredColumns([
        { field: "FRONT_END_FILTER_COLUMN", column: filterColumn },
        { field: "TIMESTAMP_COLUMN", column: timestampColumn },
        { field: "MEDIA_COLUMN", column: mediaColumn },
      ]);
      if (configuredColumns.length > 0) {
        const schemaColumns = await fetchInformationSchemaColumns(primaryTable);
        assertConfiguredColumnsExist(
          primaryTable,
          schemaColumns,
          configuredColumns,
        );
      }
    }

    const projectedColumns = mediaColumn
      ? Array.from(
          new Set(
            ["_id", filterColumn, timestampColumn, mediaColumn].filter(
              (column): column is string => Boolean(column),
            ),
          ),
        )
      : await fetchTableSqlColumns(primaryTable);

    const { mainData } = await fetchData(primaryTable, {
      limit,
      mainColumns: projectedColumns,
    });

    // Filter only data with media attachments
    const dataWithFilesOnly = filterDataByExtension(
      mainData,
      allowedFileExtensions,
      tableConfig.MEDIA_COLUMN,
    );

    let mapboxAccessToken = tableConfig.MAPBOX_ACCESS_TOKEN;
    let mapboxStyle =
      parseBasemaps(tableConfig).defaultMapboxStyle ?? tableConfig.MAPBOX_STYLE;

    try {
      if (!mapboxAccessToken || !mapboxStyle) {
        const mapConfig = await fetchTableConfig(table, "map");
        mapboxAccessToken = mapboxAccessToken ?? mapConfig.MAPBOX_ACCESS_TOKEN;
        if (!mapboxStyle) {
          mapboxStyle =
            parseBasemaps(mapConfig).defaultMapboxStyle ??
            mapConfig.MAPBOX_STYLE;
        }
      }
    } catch {
      mapboxAccessToken = undefined;
      mapboxStyle = undefined;
    }

    // Return minimal records: ID + columns needed for filtering and media display.
    // When MEDIA_COLUMN is unset, keep every string field that carries allowed
    // media extensions (e.g. separate photo + audio columns). Otherwise the
    // client media-type filter has nothing to classify and appears broken.
    const minimalData = dataWithFilesOnly.map((entry) => {
      const minimal: Record<string, unknown> = {};
      if (entry._id != null) minimal._id = entry._id;
      if (filterColumn && entry[filterColumn] != null) {
        minimal[filterColumn] = entry[filterColumn];
      }
      if (timestampColumn && entry[timestampColumn] != null) {
        minimal[timestampColumn] = entry[timestampColumn];
      }
      if (mediaColumn) {
        if (entry[mediaColumn] != null) {
          minimal[mediaColumn] = entry[mediaColumn];
        }
      } else {
        for (const [key, value] of Object.entries(entry)) {
          if (
            typeof value === "string" &&
            valueHasAllowedFileExtension(value, allowedFileExtensions)
          ) {
            minimal[key] = value;
          }
        }
      }
      return minimal;
    });

    return {
      allowedFileExtensions,
      data: minimalData,
      filterColumn,
      mapboxAccessToken,
      mapboxStyle,
      mediaBasePath: tableConfig.MEDIA_BASE_PATH,
      mediaColumn,
      primary_dataset: primaryTable,
      table: primaryTable,
      timestampColumn: timestampColumn ?? undefined,
      viewDescription: tableConfig.VIEW_DESCRIPTION || undefined,
      viewName: tableConfig.DATASET_TABLE?.trim() || undefined,
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
