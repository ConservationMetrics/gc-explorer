<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { replaceUnderscoreWithSpace } from "@/utils/index";
import { useIsPublic } from "@/utils/permissions";
import {
  filterUnwantedKeys,
  filterGeoData,
} from "@/utils/dataProcessing/filterData";
import {
  prepareAlertData,
  prepareAlertsStatistics,
  prepareMapData,
  transformSurveyData,
  transformToGeojson,
} from "@/utils/dataProcessing/transformData";
import { generateMapboxIdFromMapeoFeatureId } from "@/utils/dataProcessing/helpers";

import type { BasemapConfig, ColumnEntry, DataEntry } from "@/types/types";

// Extract the tablename from the route parameters
const route = useRoute();
const tableRaw = route.params.tablename;
const table = Array.isArray(tableRaw) ? tableRaw.join("/") : tableRaw;

const alertsData = ref();
const alertsStatistics = ref();
const dataFetched = ref(false);
const allowedFileExtensions = ref();
const logoUrl = ref();
const mapLegendLayerIds = ref();
const mapboxAccessToken = ref();
const mapboxBearing = ref(0);
const mapboxLatitude = ref(0);
const mapboxLongitude = ref(0);
const mapboxPitch = ref(0);
const mapboxProjection = ref();
const mapboxStyle = ref();
const mapboxBasemaps = ref<BasemapConfig[]>([]);
const mapboxZoom = ref(0);
const mapbox3d = ref(false);
const mapbox3dTerrainExaggeration = ref(0);
const mapeoData = ref();
const mediaBasePath = ref();
const mediaBasePathAlerts = ref();
const planetApiKey = ref();

const {
  public: { appApiKey },
} = useRuntimeConfig();
const headers = {
  "x-api-key": appApiKey,
};
const { data, error } = await useFetch(`/api/${table}/alerts`, {
  headers,
});

if (data.value && !error.value) {
  const mainData = (data.value.mainData ?? []) as DataEntry[];
  const metadata = data.value.metadata ?? null;

  const changeDetectionData = prepareAlertData(mainData, table);
  alertsData.value = {
    mostRecentAlerts: transformToGeojson(changeDetectionData.mostRecentAlerts),
    previousAlerts: transformToGeojson(changeDetectionData.previousAlerts),
  };
  alertsStatistics.value = prepareAlertsStatistics(mainData, metadata);

  let processedMapeo: DataEntry[] | null = null;
  if (data.value.mapeoData && data.value.mapeoCategoryIds) {
    const rawMapeo = data.value.mapeoData as DataEntry[];
    const columns = (data.value.mapeoColumns ?? []) as ColumnEntry[];
    const filteredMapeo = filterUnwantedKeys(
      rawMapeo,
      columns,
      data.value.unwantedColumns,
      data.value.unwantedSubstrings,
    );
    const byCategory = filteredMapeo.filter((row: DataEntry) =>
      Object.keys(row).some(
        (key) =>
          key.includes("category") &&
          data.value.mapeoCategoryIds.split(",").includes(row[key]),
      ),
    );
    const geoMapeo = filterGeoData(byCategory);
    const transformedMapeo = transformSurveyData(geoMapeo);
    const withMapData = prepareMapData(
      transformedMapeo,
      data.value.filterColumn,
    );
    processedMapeo = withMapData.map((item: DataEntry) => {
      if (
        item.id &&
        typeof item.id === "string" &&
        item.id.match(/^[0-9a-fA-F]{16}$/)
      ) {
        item.normalizedId = generateMapboxIdFromMapeoFeatureId(item.id);
      }
      return item;
    });
  }

  allowedFileExtensions.value = data.value.allowedFileExtensions;
  dataFetched.value = true;
  logoUrl.value = data.value.logoUrl;
  mapLegendLayerIds.value = data.value.mapLegendLayerIds;
  mapboxAccessToken.value = data.value.mapboxAccessToken;
  mapboxBearing.value = data.value.mapboxBearing;
  mapboxLatitude.value = data.value.mapboxLatitude;
  mapboxLongitude.value = data.value.mapboxLongitude;
  mapboxPitch.value = data.value.mapboxPitch;
  mapboxProjection.value = data.value.mapboxProjection;
  mapboxStyle.value = data.value.mapboxStyle;
  mapboxBasemaps.value = data.value.mapboxBasemaps || [];
  mapboxZoom.value = data.value.mapboxZoom;
  mapbox3d.value = data.value.mapbox3d;
  mapbox3dTerrainExaggeration.value = data.value.mapbox3dTerrainExaggeration;
  mapeoData.value = processedMapeo;
  mediaBasePath.value = data.value.mediaBasePath;
  mediaBasePathAlerts.value = data.value.mediaBasePathAlerts;
  planetApiKey.value = data.value.planetApiKey;
} else {
  console.error("Error fetching data:", error.value);
}

const { t } = useI18n();

// Check if this view is publicly accessible
const isPublic = useIsPublic(data);

useHead({
  title:
    "GuardianConnector Explorer " +
    t("changeDetectionAlerts") +
    " - " +
    replaceUnderscoreWithSpace(table),
  meta: [
    ...(isPublic.value
      ? [{ name: "robots", content: "noindex, nofollow" }]
      : []),
  ],
});
</script>

<template>
  <div>
    <ClientOnly>
      <AlertsDashboard
        v-if="dataFetched"
        :alerts-data="alertsData"
        :alerts-statistics="alertsStatistics"
        :allowed-file-extensions="allowedFileExtensions"
        :logo-url="logoUrl"
        :map-legend-layer-ids="mapLegendLayerIds"
        :mapbox-access-token="mapboxAccessToken"
        :mapbox-bearing="mapboxBearing"
        :mapbox-latitude="mapboxLatitude"
        :mapbox-longitude="mapboxLongitude"
        :mapbox-pitch="mapboxPitch"
        :mapbox-projection="mapboxProjection"
        :mapbox-style="mapboxStyle"
        :mapbox-basemaps="mapboxBasemaps"
        :mapbox-zoom="mapboxZoom"
        :mapbox3d="mapbox3d"
        :mapbox3d-terrain-exaggeration="mapbox3dTerrainExaggeration"
        :mapeo-data="mapeoData"
        :media-base-path="mediaBasePath"
        :media-base-path-alerts="mediaBasePathAlerts"
        :planet-api-key="planetApiKey"
      />
    </ClientOnly>
  </div>
</template>
