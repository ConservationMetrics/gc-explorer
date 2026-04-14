<script setup lang="ts">
// @ts-expect-error - tokml does not have types
import tokml from "tokml";

import type { Feature, FeatureCollection } from "geojson";
import type { AlertsData } from "@/types";
import { useTableExportDownload } from "@/composables/useTableExportDownload";
import { triggerBrowserDownload } from "@/utils/browserDownload";
import { escapeCSVValue } from "@/utils/csvUtils";

const props = defineProps<{
  dataForDownload?: Feature | FeatureCollection | AlertsData;
  /** Warehouse `_id` for a selected map feature; triggers server export with full raw columns. */
  exportRecordId?: string;
  exportTableName?: string;
  exportFilterColumn?: string;
  exportFilterValues?: string[];
  exportMinDate?: string;
  exportMaxDate?: string;
  exportTimestampColumn?: string;
  filenamePrefix?: string;
}>();

const exportingFormat = ref<string | null>(null);

const { t } = useI18n();
const { warning: showWarningToast } = useToast();
const { downloadTableExport, getTablename } = useTableExportDownload();

/** Incoming feature data can be either a single Feature, FeatureCollection, or an AlertsData object */
const isAlertsData = (
  data: Feature | FeatureCollection | AlertsData | undefined,
): data is AlertsData => {
  return (
    (data as AlertsData).mostRecentAlerts !== undefined &&
    (data as AlertsData).previousAlerts !== undefined
  );
};

const isFeatureCollection = (
  data: Feature | FeatureCollection | AlertsData | undefined,
): data is FeatureCollection => {
  return (
    data !== undefined &&
    (data as FeatureCollection).type === "FeatureCollection" &&
    Array.isArray((data as FeatureCollection).features)
  );
};

/** True when the download represents a full dataset rather than a single feature */
const isBulkDownload = computed(() => {
  return (
    isFeatureCollection(props.dataForDownload) ||
    isAlertsData(props.dataForDownload)
  );
});

/** Use the server export route for bulk data or a single record identified by `_id`. */
const useServerExport = computed(() => {
  const id = props.exportRecordId?.trim();
  return isBulkDownload.value || !!id;
});

/**
 * Downloads spatial dataset files from the server export endpoint. For bulk export, the server
 * handles data formatting and streams the response; the client saves the blob to disk.
 *
 * @param format - The desired export format: `"csv"`, `"geojson"`, or `"kml"`.
 * @returns {Promise<void>}
 */
const downloadFromExportEndpoint = async (
  format: "csv" | "geojson" | "kml",
) => {
  exportingFormat.value = format;
  try {
    await downloadTableExport({
      format,
      exportTableName: props.exportTableName,
      exportFilterColumn: props.exportFilterColumn,
      exportFilterValues: props.exportFilterValues,
      exportMinDate: props.exportMinDate,
      exportMaxDate: props.exportMaxDate,
      exportTimestampColumn: props.exportTimestampColumn,
      filenamePrefix: props.filenamePrefix ?? props.exportRecordId?.trim(),
      recordId: props.exportRecordId?.trim(),
    });
  } finally {
    exportingFormat.value = null;
  }
};

/**
 * Builds a CSV file from a single GeoJSON Feature in the browser and downloads it.
 *
 * @returns {void}
 */
const downloadAlertCSV = () => {
  if (
    !props.dataForDownload ||
    isAlertsData(props.dataForDownload) ||
    isFeatureCollection(props.dataForDownload)
  ) {
    console.error("No valid GeoJSON Feature data available to convert to CSV.");
    showWarningToast(t("errorNoDataToDownload"));
    return;
  }

  const { geometry, properties } = props.dataForDownload;

  if (!properties) {
    console.error("No properties found in GeoJSON data.");
    showWarningToast(t("errorNoDataToDownload"));
    return;
  }

  const flattenedProperties = { ...properties };

  flattenedProperties["geographicCentroid"] =
    `[${properties["geographicCentroid"]}]`;
  delete flattenedProperties["coordinates"];
  delete flattenedProperties["YYYYMM"];

  const csvColumns = Object.keys(flattenedProperties);
  const csvData = Object.values(flattenedProperties).map((value) =>
    escapeCSVValue(value),
  );

  // Remove top level GeoJSON "type" property
  const typeIndex = csvColumns.indexOf("type");
  if (typeIndex > -1) {
    csvColumns.splice(typeIndex, 1);
    csvData.splice(typeIndex, 1);
  }

  csvColumns.push("type");
  csvData.push(escapeCSVValue(geometry.type));

  const coordinates = JSON.stringify(
    (geometry as GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon)
      .coordinates,
  );
  csvColumns.push("coordinates");
  csvData.push(`"${coordinates}"`);

  const csvString = [csvColumns.join(","), csvData.join(",")].join("\n");

  let filename;
  if (properties["alertID"]) {
    filename = `${properties["alertID"]}.csv`;
  } else if (properties["ID"]) {
    filename = `${properties["ID"]}.csv`;
  } else if (properties["id"]) {
    filename = `${properties["id"]}.csv`;
  } else {
    filename = `${getTablename()}.csv`;
  }

  const blob = new Blob([csvString], { type: "text/csv" });
  triggerBrowserDownload(blob, filename);
};

/**
 * Serializes a single GeoJSON Feature to a file download (client-side formatting).
 *
 * @returns {void}
 */
const downloadAlertGeoJSON = () => {
  if (
    !props.dataForDownload ||
    isAlertsData(props.dataForDownload) ||
    isFeatureCollection(props.dataForDownload)
  ) {
    console.error(
      "No valid GeoJSON Feature data available to convert to GeoJSON.",
    );
    showWarningToast(t("errorNoDataToDownload"));
    return;
  }

  const geojsonCopy = { ...props.dataForDownload };

  if (!geojsonCopy.properties) {
    console.error("No properties found in GeoJSON data.");
    showWarningToast(t("errorNoDataToDownload"));
    return;
  }

  delete geojsonCopy.properties["YYYYMM"];

  let filename;
  if (geojsonCopy.properties["alertID"]) {
    filename = `${geojsonCopy.properties["alertID"]}.geojson`;
  } else if (geojsonCopy.properties["ID"]) {
    filename = `${geojsonCopy.properties["ID"]}.geojson`;
  } else if (geojsonCopy.properties["id"]) {
    filename = `${geojsonCopy.properties["id"]}.geojson`;
  } else {
    filename = `${getTablename()}.geojson`;
  }

  const jsonStr = JSON.stringify(geojsonCopy, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  triggerBrowserDownload(blob, filename);
};

/**
 * Converts a single GeoJSON Feature to KML via tokml and downloads it.
 *
 * @returns {void}
 */
const downloadAlertKML = () => {
  if (
    !props.dataForDownload ||
    isAlertsData(props.dataForDownload) ||
    isFeatureCollection(props.dataForDownload)
  ) {
    console.error("No valid GeoJSON Feature data available to convert to KML.");
    showWarningToast(t("errorNoDataToDownload"));
    return;
  }

  const kmlString = tokml(props.dataForDownload);

  const { properties } = props.dataForDownload;

  if (!properties) {
    console.error("No properties found in GeoJSON data.");
    showWarningToast(t("errorNoDataToDownload"));
    return;
  }

  let filename;
  if (properties["alertID"]) {
    filename = `${properties["alertID"]}.kml`;
  } else if (properties["ID"]) {
    filename = `${properties["ID"]}.kml`;
  } else if (properties["id"]) {
    filename = `${properties["id"]}.kml`;
  } else {
    filename = `${getTablename()}.kml`;
  }

  const blob = new Blob([kmlString], {
    type: "application/vnd.google-earth.kml+xml",
  });
  triggerBrowserDownload(blob, filename);
};
</script>

<template>
  <div class="flex flex-wrap gap-2 justify-center mt-6">
    <button
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      :disabled="!!exportingFormat"
      type="button"
      @click="
        useServerExport ? downloadFromExportEndpoint('csv') : downloadAlertCSV()
      "
    >
      {{ exportingFormat === "csv" ? $t("downloading") : $t("downloadCSV") }}
    </button>
    <button
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      :disabled="!!exportingFormat"
      type="button"
      @click="
        useServerExport
          ? downloadFromExportEndpoint('geojson')
          : downloadAlertGeoJSON()
      "
    >
      {{
        exportingFormat === "geojson"
          ? $t("downloading")
          : $t("downloadGeoJSON")
      }}
    </button>
    <button
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      :disabled="!!exportingFormat"
      type="button"
      @click="
        useServerExport ? downloadFromExportEndpoint('kml') : downloadAlertKML()
      "
    >
      {{ exportingFormat === "kml" ? $t("downloading") : $t("downloadKML") }}
    </button>
  </div>
</template>
