<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { replaceUnderscoreWithSpace } from "@/utils/index";
import { useIsPublic } from "@/utils/permissions";

import type { BasemapConfig } from "@/types/types";

// Extract the tablename from the route parameters
const route = useRoute();
const tableRaw = route.params.tablename;
const table = Array.isArray(tableRaw) ? tableRaw.join("/") : tableRaw;

const allowedFileExtensions = ref();
const colorColumn = ref();
const dataFetched = ref(false);
const filterColumn = ref();
const iconColumn = ref();
const mapLegendLayerIds = ref();
const mapStatistics = ref();
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
const mapData = ref();
const mediaBasePath = ref();
const mediaBasePathIcons = ref();
const mediaColumn = ref();
const planetApiKey = ref();
const timestampColumn = ref();

const {
  public: { appApiKey },
} = useRuntimeConfig();
const headers = {
  "x-api-key": appApiKey,
};
const { data, error } = await useFetch(`/api/${table}/map`, {
  headers,
});

if (data.value && !error.value) {
  allowedFileExtensions.value = data.value.allowedFileExtensions;
  colorColumn.value = data.value.colorColumn;
  dataFetched.value = true;
  filterColumn.value = data.value.filterColumn;
  iconColumn.value = data.value.iconColumn;
  mapLegendLayerIds.value = data.value.mapLegendLayerIds;
  mapStatistics.value = data.value.mapStatistics;
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
  mapData.value = data.value.data;
  mediaBasePath.value = data.value.mediaBasePath;
  mediaBasePathIcons.value = data.value.mediaBasePathIcons;
  mediaColumn.value = data.value.mediaColumn;
  planetApiKey.value = data.value.planetApiKey;
  timestampColumn.value = data.value.timestampColumn;
} else {
  console.error("Error fetching data:", error.value);
}

const { t } = useI18n();

// Check if this view is publicly accessible
const isPublic = useIsPublic(data);

useHead({
  title:
    "GuardianConnector Explorer " +
    t("map") +
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
      <MapView
        v-if="dataFetched"
        :allowed-file-extensions="allowedFileExtensions"
        :color-column="colorColumn"
        :filter-column="filterColumn"
        :icon-column="iconColumn"
        :map-legend-layer-ids="mapLegendLayerIds"
        :map-statistics="mapStatistics"
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
        :map-data="mapData"
        :media-base-path="mediaBasePath"
        :media-base-path-icons="mediaBasePathIcons"
        :media-column="mediaColumn"
        :planet-api-key="planetApiKey"
        :timestamp-column="timestampColumn"
      />
    </ClientOnly>
  </div>
</template>
