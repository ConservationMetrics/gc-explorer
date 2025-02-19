<script setup lang="ts">
// @ts-expect-error - tokml does not have types
import tokml from "tokml";

import type { Feature } from "geojson";
import type { AlertsData } from "~/types/types";

const props = defineProps<{
  featureData?: Feature | AlertsData;
  typeOfData: string;
}>();

/** Incoming feature data can be either a single Feature or an AlertsData object */
const isAlertsData = (
  featureData: Feature | AlertsData,
): featureData is AlertsData => {
  return (
    (featureData as AlertsData).mostRecentAlerts !== undefined &&
    (featureData as AlertsData).previousAlerts !== undefined
  );
};

const downloadAlertCSV = () => {
  if (!props.featureData || isAlertsData(props.featureData)) {
    console.error("No valid GeoJSON Feature data available to convert to CSV.");
    return;
  }

  const { geometry, properties } = props.featureData;

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
  if (!props.featureData || isAlertsData(props.featureData)) {
    console.error("No valid GeoJSON Feature data available to convert to CSV.");
    return;
  }

  const geojsonCopy = { ...props.featureData };

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
  if (!props.featureData || isAlertsData(props.featureData)) {
    console.error("No valid GeoJSON Feature data available to convert to CSV.");
    return;
  }

  const kmlString = tokml(props.featureData);

  const { properties } = props.featureData;

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
  if (!props.featureData || !isAlertsData(props.featureData)) {
    console.warn("No valid AlertsData available to download as CSV.");
    return;
  }

  const combinedFeatures = [
    ...props.featureData.previousAlerts.features,
    ...props.featureData.mostRecentAlerts.features,
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
  if (!props.featureData || !isAlertsData(props.featureData)) {
    console.warn("No valid AlertsData available to download as CSV.");
    return;
  }

  // Combine features from mostRecentAlerts and previousAlerts
  const combinedFeatures = [
    ...props.featureData.previousAlerts.features,
    ...props.featureData.mostRecentAlerts.features,
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
  if (!props.featureData || !isAlertsData(props.featureData)) {
    console.warn("No valid AlertsData available to download as CSV.");
    return;
  }

  const combinedFeatures = [
    ...props.featureData.previousAlerts.features,
    ...props.featureData.mostRecentAlerts.features,
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
  <div class="button-container">
    <button
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mx-2"
      @click="
        typeOfData === 'alert' ? downloadAlertCSV() : downloadCSVSelection()
      "
    >
      {{ $t("downloadCSV") }}
    </button>
    <button
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mx-2"
      @click="
        typeOfData === 'alert'
          ? downloadAlertGeoJSON()
          : downloadGeoJSONSelection()
      "
    >
      {{ $t("downloadGeoJSON") }}
    </button>
    <button
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mx-2"
      @click="
        typeOfData === 'alert' ? downloadAlertKML() : downloadKMLSelection()
      "
    >
      {{ $t("downloadKML") }}
    </button>
  </div>
</template>

<style scoped>
.button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
