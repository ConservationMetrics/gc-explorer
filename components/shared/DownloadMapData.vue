<script setup lang="ts">
// @ts-expect-error - tokml does not have types
import tokml from "tokml";

import type { Feature, FeatureCollection } from "geojson";
import type { AlertsData } from "@/types";
import { escapeCSVValue } from "@/utils/csvUtils";

const route = useRoute();
const { t } = useI18n();
const { warning: showWarningToast } = useToast();
const config = useRuntimeConfig();
const apiKey = config.public.appApiKey as string;

const props = defineProps<{
  dataForDownload?: Feature | FeatureCollection | AlertsData;
  exportPath?: string;
  exportFilterColumn?: string;
  exportFilterValues?: string[];
  exportMinDate?: string;
  exportMaxDate?: string;
  exportTimestampColumn?: string;
  filenamePrefix?: string;
}>();

const exportingFormat = ref<string | null>(null);

/** Get filename base from route tablename, fallback to 'data' */
const getFilenameBase = (): string => {
  const tablename = route.params.tablename;
  return typeof tablename === "string" ? tablename : "data";
};

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

const isStatisticsExport = computed(
  () => props.exportPath === "statistics-export",
);

/**
 * Downloads a dataset file from the server export endpoint.
 * The server handles data formatting and streams the response;
 * the client saves the received blob directly to disk.
 *
 * @param {"csv" | "geojson" | "kml"} format - The desired export format.
 * @returns {Promise<void>}
 */
const downloadFromExportEndpoint = async (
  format: "csv" | "geojson" | "kml",
) => {
  const tablename = getFilenameBase();
  const exportPath = props.exportPath || "export";
  if (tablename === "data") {
    console.error("No table name available for export.");
    showWarningToast(t("errorNoDataToDownload"));
    return;
  }

  exportingFormat.value = format;
  try {
    const params: Record<string, string> = { format };
    if (props.exportFilterColumn && props.exportFilterValues?.length) {
      params.filterColumn = props.exportFilterColumn;
      params.filterValues = props.exportFilterValues.join(",");
    }
    const isStatisticsEndpoint = exportPath === "statistics-export";
    if (
      (props.exportTimestampColumn || isStatisticsEndpoint) &&
      (props.exportMinDate || props.exportMaxDate)
    ) {
      if (props.exportMinDate) params.minDate = props.exportMinDate;
      if (props.exportMaxDate) params.maxDate = props.exportMaxDate;
    }
    const blob = await $fetch<Blob>(`/api/${tablename}/${exportPath}`, {
      params,
      responseType: "blob",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filenameBase = props.filenamePrefix || tablename;
    link.download = `${filenameBase}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(`Failed to export ${format}:`, error);
    showWarningToast(t("errorNoDataToDownload"));
  } finally {
    exportingFormat.value = null;
  }
};

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
    filename = `${getFilenameBase()}.csv`;
  }

  const blob = new Blob([csvString], { type: "text/csv" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

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
    filename = `${getFilenameBase()}.geojson`;
  }

  const jsonStr = JSON.stringify(geojsonCopy, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

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
    filename = `${getFilenameBase()}.kml`;
  }

  const blob = new Blob([kmlString], {
    type: "application/vnd.google-earth.kml+xml",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
</script>

<template>
  <div class="flex flex-wrap gap-2 justify-center mt-6">
    <template v-if="isStatisticsExport">
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
        :disabled="!!exportingFormat"
        type="button"
        @click="downloadFromExportEndpoint('csv')"
      >
        {{
          exportingFormat === "csv"
            ? $t("downloading")
            : $t("downloadStatistics")
        }}
      </button>
    </template>
    <template v-else>
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
        :disabled="!!exportingFormat"
        type="button"
        @click="
          isBulkDownload
            ? downloadFromExportEndpoint('csv')
            : downloadAlertCSV()
        "
      >
        {{ exportingFormat === "csv" ? $t("downloading") : $t("downloadCSV") }}
      </button>
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
        :disabled="!!exportingFormat"
        type="button"
        @click="
          isBulkDownload
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
          isBulkDownload
            ? downloadFromExportEndpoint('kml')
            : downloadAlertKML()
        "
      >
        {{ exportingFormat === "kml" ? $t("downloading") : $t("downloadKML") }}
      </button>
    </template>
  </div>
</template>
