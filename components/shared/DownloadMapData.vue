<script setup lang="ts">
// @ts-expect-error - tokml does not have types
import tokml from "tokml";

import type { Feature, FeatureCollection } from "geojson";
import type { AlertsData } from "~/types/types";

const route = useRoute();

const props = defineProps<{
  dataForDownload?: Feature | FeatureCollection | AlertsData;
}>();

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

const downloadCSVFromFeatureCollection = () => {
  if (!props.dataForDownload || !isFeatureCollection(props.dataForDownload)) {
    console.error("No valid FeatureCollection available to convert to CSV.");
    return;
  }

  const features = props.dataForDownload.features;
  if (features.length === 0) {
    console.error("FeatureCollection has no features.");
    return;
  }

  // Get all unique column names from all features
  const columnSet = new Set<string>();
  features.forEach((feature) => {
    if (feature.properties) {
      Object.keys(feature.properties).forEach((key) => columnSet.add(key));
    }
  });
  columnSet.add("geometry_type");
  columnSet.add("coordinates");

  const columns = Array.from(columnSet);

  // Build CSV rows
  const rows = features.map((feature) => {
    return columns
      .map((col) => {
        if (col === "geometry_type") {
          return feature.geometry.type;
        } else if (col === "coordinates") {
          // Only Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon have coordinates
          const geom = feature.geometry;
          if ("coordinates" in geom) {
            return `"${JSON.stringify(geom.coordinates)}"`;
          }
          return "";
        } else {
          const value = feature.properties?.[col];
          if (value === undefined || value === null) return "";
          if (typeof value === "string" && value.includes(",")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }
      })
      .join(",");
  });

  const csvString = [columns.join(","), ...rows].join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${getFilenameBase()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const downloadAlertCSV = () => {
  if (
    !props.dataForDownload ||
    isAlertsData(props.dataForDownload) ||
    isFeatureCollection(props.dataForDownload)
  ) {
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
  if (!props.dataForDownload) {
    console.error("No data available to download.");
    return;
  }

  // Handle FeatureCollection (from MapIntroPanel)
  if (isFeatureCollection(props.dataForDownload)) {
    const jsonStr = JSON.stringify(props.dataForDownload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${getFilenameBase()}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    return;
  }

  // Handle AlertsData (not a single feature)
  if (isAlertsData(props.dataForDownload)) {
    console.error(
      "No valid GeoJSON Feature data available to convert to GeoJSON.",
    );
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
  if (!props.dataForDownload) {
    console.error("No data available to download.");
    return;
  }

  // Handle FeatureCollection or AlertsData
  if (
    isFeatureCollection(props.dataForDownload) ||
    isAlertsData(props.dataForDownload)
  ) {
    const kmlString = tokml(props.dataForDownload);
    const blob = new Blob([kmlString], {
      type: "application/vnd.google-earth.kml+xml",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${getFilenameBase()}.kml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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

  const filename = combinedFeatures[0].properties?.["territory"]
    ? `${combinedFeatures[0].properties["territory"]}_alerts.csv`
    : `${getFilenameBase()}.csv`;
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

  const filename = combinedFeatures[0].properties?.["territory"]
    ? `${combinedFeatures[0].properties["territory"]}_alerts.geojson`
    : `${getFilenameBase()}.geojson`;
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

  const filename = combinedFeatures[0].properties?.["territory"]
    ? `${combinedFeatures[0].properties["territory"]}_alerts.kml`
    : `${getFilenameBase()}.kml`;

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
        isFeatureCollection(props.dataForDownload)
          ? downloadCSVFromFeatureCollection()
          : !isAlertsData(props.dataForDownload)
            ? downloadAlertCSV()
            : downloadCSVSelection()
      "
    >
      {{ $t("downloadCSV") }}
    </button>
    <button
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      @click="
        isFeatureCollection(props.dataForDownload)
          ? downloadAlertGeoJSON()
          : !isAlertsData(props.dataForDownload)
            ? downloadAlertGeoJSON()
            : downloadGeoJSONSelection()
      "
    >
      {{ $t("downloadGeoJSON") }}
    </button>
    <button
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      @click="
        isFeatureCollection(props.dataForDownload)
          ? downloadAlertKML()
          : !isAlertsData(props.dataForDownload)
            ? downloadAlertKML()
            : downloadKMLSelection()
      "
    >
      {{ $t("downloadKML") }}
    </button>
  </div>
</template>
