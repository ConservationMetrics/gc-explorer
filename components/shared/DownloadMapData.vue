<script setup lang="ts">
// @ts-expect-error - tokml does not have types
import tokml from "tokml";

import type { Feature } from "geojson";
import type { AlertsData } from "~/types/types";

const props = defineProps<{
  dataForDownload?: Feature | AlertsData;
}>();

/** Incoming feature data can be either a single Feature or an AlertsData object */
const isAlertsData = (
  data: Feature | AlertsData | undefined,
): data is AlertsData => {
  return (
    (data as AlertsData).mostRecentAlerts !== undefined &&
    (data as AlertsData).previousAlerts !== undefined
  );
};

const downloadAlertCSV = () => {
  if (!props.dataForDownload || isAlertsData(props.dataForDownload)) {
    console.error("No valid GeoJSON Feature data available to convert to CSV.");
    return;
  }

  const { geometry, properties } = props.dataForDownload;

  if (!properties) {
    console.error("No properties found in GeoJSON data.");
    return;
  }

  const flattenedProperties = { ...properties };

  flattenedProperties["geographicCentroid"] =
    `[${properties["geographicCentroid"]}]`;
  delete flattenedProperties["coordinates"];
  delete flattenedProperties["YYYYMM"];

  const csvColumns = Object.keys(flattenedProperties);
  const csvData = Object.values(flattenedProperties).map((value) =>
    typeof value === "string" && value.includes(",")
      ? `"${value.replace(/"/g, '""')}"`
      : value,
  );

  // Remove top level GeoJSON "type" property
  const typeIndex = csvColumns.indexOf("type");
  if (typeIndex > -1) {
    csvColumns.splice(typeIndex, 1);
    csvData.splice(typeIndex, 1);
  }

  csvColumns.push("type");
  csvData.push(`"${geometry.type}"`);

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
  } else {
    filename = "data.csv";
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
  if (!props.dataForDownload || isAlertsData(props.dataForDownload)) {
    console.error("No valid GeoJSON Feature data available to convert to CSV.");
    return;
  }

  const geojsonCopy = { ...props.dataForDownload };

  if (!geojsonCopy.properties) {
    console.error("No properties found in GeoJSON data.");
    return;
  }

  delete geojsonCopy.properties["YYYYMM"];

  let filename;
  if (geojsonCopy.properties["alertID"]) {
    filename = `${geojsonCopy.properties["alertID"]}.geojson`;
  } else if (geojsonCopy.properties["ID"]) {
    filename = `${geojsonCopy.properties["ID"]}.geojson`;
  } else {
    filename = "data.csv";
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
  if (!props.dataForDownload || isAlertsData(props.dataForDownload)) {
    console.error("No valid GeoJSON Feature data available to convert to CSV.");
    return;
  }

  const kmlString = tokml(props.dataForDownload);

  const { properties } = props.dataForDownload;

  if (!properties) {
    console.error("No properties found in GeoJSON data.");
    return;
  }

  let filename;
  if (properties["alertID"]) {
    filename = `${properties["alertID"]}.kml`;
  } else if (properties["ID"]) {
    filename = `${properties["ID"]}.kml`;
  } else {
    filename = "data.kml";
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

const downloadCSVSelection = () => {
  if (!props.dataForDownload || !isAlertsData(props.dataForDownload)) {
    console.warn("No valid AlertsData available to download as CSV.");
    return;
  }

  const combinedFeatures = [
    ...props.dataForDownload.previousAlerts.features,
    ...props.dataForDownload.mostRecentAlerts.features,
  ];

  let csvString = "";
  let headerWritten = false;

  combinedFeatures.forEach((feature) => {
    const { geometry, properties } = feature;

    const flattenedProperties = { ...properties };
    delete flattenedProperties["image_url"];
    delete flattenedProperties["image_caption"];
    delete flattenedProperties["preview_link"];
    delete flattenedProperties["YYYYMM"];

    const coordinates = JSON.stringify(
      (geometry as GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon)
        .coordinates,
    );
    flattenedProperties["coordinates"] = coordinates;

    const csvColumns = Object.keys(flattenedProperties);
    const csvData = Object.values(flattenedProperties).map((value) =>
      typeof value === "string" && value.includes(",")
        ? `"${value.replace(/"/g, '""')}"`
        : value,
    );

    csvColumns.push("geometry type");
    csvData.push(`"${geometry.type}"`);

    if (!headerWritten) {
      csvString += csvColumns.join(",") + "\n";
      headerWritten = true;
    }

    csvString += csvData.join(",") + "\n";
  });

  const filename =
    combinedFeatures[0].properties &&
    combinedFeatures[0].properties["territory"]
      ? `${combinedFeatures[0].properties["territory"]}_alerts.csv`
      : "alerts.csv";
  const blob = new Blob([csvString], { type: "text/csv" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const downloadGeoJSONSelection = () => {
  if (!props.dataForDownload || !isAlertsData(props.dataForDownload)) {
    console.warn("No valid AlertsData available to download as CSV.");
    return;
  }

  // Combine features from mostRecentAlerts and previousAlerts
  const combinedFeatures = [
    ...props.dataForDownload.previousAlerts.features,
    ...props.dataForDownload.mostRecentAlerts.features,
  ];

  combinedFeatures.forEach((feature) => {
    if (feature.properties) {
      delete feature.properties["image_url"];
      delete feature.properties["image_caption"];
      delete feature.properties["preview_link"];
      delete feature.properties["YYYYMM"];
    }
  });

  const combinedGeoJSON = {
    type: "FeatureCollection",
    features: combinedFeatures,
  };

  const filename =
    combinedFeatures[0].properties &&
    combinedFeatures[0].properties["territory"]
      ? `${combinedFeatures[0].properties["territory"]}_alerts.geojson`
      : "alerts.geojson";
  const jsonStr = JSON.stringify(combinedGeoJSON, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const downloadKMLSelection = () => {
  if (!props.dataForDownload || !isAlertsData(props.dataForDownload)) {
    console.warn("No valid AlertsData available to download as CSV.");
    return;
  }

  const combinedFeatures = [
    ...props.dataForDownload.previousAlerts.features,
    ...props.dataForDownload.mostRecentAlerts.features,
  ];

  const combinedGeoJSON = {
    type: "FeatureCollection",
    features: combinedFeatures,
  };

  const kmlString = tokml(combinedGeoJSON);

  const filename =
    combinedFeatures[0].properties &&
    combinedFeatures[0].properties["territory"]
      ? `${combinedFeatures[0].properties["territory"]}_alerts.kml`
      : "alerts.kml";

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
    <button
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      @click="
        !isAlertsData(props.dataForDownload)
          ? downloadAlertCSV()
          : downloadCSVSelection()
      "
    >
      {{ $t("downloadCSV") }}
    </button>
    <button
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      @click="
        !isAlertsData(props.dataForDownload)
          ? downloadAlertGeoJSON()
          : downloadGeoJSONSelection()
      "
    >
      {{ $t("downloadGeoJSON") }}
    </button>
    <button
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      @click="
        !isAlertsData(props.dataForDownload)
          ? downloadAlertKML()
          : downloadKMLSelection()
      "
    >
      {{ $t("downloadKML") }}
    </button>
  </div>
</template>

<style scoped>
/* Remove the old button-container styles as we're using Tailwind now */
</style>
