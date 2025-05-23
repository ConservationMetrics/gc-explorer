<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { replaceUnderscoreWithSpace } from "@/utils/index";

// Extract the tablename from the route parameters
const route = useRoute();
const tableRaw = route.params.tablename;
const table = Array.isArray(tableRaw) ? tableRaw.join("/") : tableRaw;

const allowedFileExtensions = ref();
const dataFetched = ref(false);
const filterColumn = ref();
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
const mapData = ref();
const mediaBasePath = ref();
const planetApiKey = ref();

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
  dataFetched.value = true;
  filterColumn.value = data.value.filterColumn;
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
  mapData.value = data.value.data;
  mediaBasePath.value = data.value.mediaBasePath;
  planetApiKey.value = data.value.planetApiKey;
} else {
  console.error("Error fetching data:", error.value);
}

const { t } = useI18n();
useHead({
  title:
    "GuardianConnector Explorer " +
    t("map") +
    " - " +
    replaceUnderscoreWithSpace(table),
});
</script>

<template>
  <div>
    <ClientOnly>
      <MapView
        v-if="dataFetched"
        :allowed-file-extensions="allowedFileExtensions"
        :filter-column="filterColumn"
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
        :map-data="mapData"
        :media-base-path="mediaBasePath"
        :planet-api-key="planetApiKey"
      />
    </ClientOnly>
  </div>
</template>
