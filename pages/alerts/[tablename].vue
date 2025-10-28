<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { replaceUnderscoreWithSpace } from "@/utils/index";
import { useIsPublic } from "@/utils/permissions";

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
  alertsData.value = data.value.alertsData;
  alertsStatistics.value = data.value.alertsStatistics;
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
  mapboxZoom.value = data.value.mapboxZoom;
  mapbox3d.value = data.value.mapbox3d;
  mapbox3dTerrainExaggeration.value = data.value.mapbox3dTerrainExaggeration;
  mapeoData.value = data.value.mapeoData;
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
