<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { replaceUnderscoreWithSpace } from "@/utils/index";
import { useIsPublic } from "@/utils/permissions";

import type { BasemapConfig } from "@/types/types";
import type { Feature } from "geojson";

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
const mapeoTable = ref<string | undefined>();
const mediaBasePath = ref();
const mediaBasePathAlerts = ref();
const planetApiKey = ref();

/** Sidebar record state (page fetches; component does not call API). */
const sidebarDisplayFeature = ref<Record<string, unknown> | null>(null);
const sidebarLoadingFeature = ref(false);
const sidebarFeatureLoadError = ref<string | null>(null);
const sidebarSelectedFeatureOriginal = ref<Feature | null>(null);

const {
  public: { appApiKey },
} = useRuntimeConfig();
const headers = {
  "x-api-key": appApiKey,
};
const { data, error } = await useFetch(`/api/${table}/alerts`, {
  headers,
});

/** Fetch a single record for the sidebar when the dashboard requests it. */
const onRequestRecord = async (
  payload: {
    table: string;
    recordId: string;
    feature?: Record<string, unknown>;
  } | null,
) => {
  if (!payload) {
    sidebarDisplayFeature.value = null;
    sidebarLoadingFeature.value = false;
    sidebarFeatureLoadError.value = null;
    sidebarSelectedFeatureOriginal.value = null;
    return;
  }
  const { table: tableForFetch, recordId } = payload;
  sidebarLoadingFeature.value = true;
  sidebarFeatureLoadError.value = null;
  sidebarDisplayFeature.value = payload.feature ?? null;
  sidebarSelectedFeatureOriginal.value = null;
  try {
    const fetchHeaders: Record<string, string> = {};
    if (appApiKey) fetchHeaders["x-api-key"] = appApiKey;
    const raw = await $fetch<Record<string, unknown>>(
      `/api/${encodeURIComponent(tableForFetch)}/${encodeURIComponent(String(recordId))}`,
      { headers: fetchHeaders },
    );
    sidebarDisplayFeature.value = raw;
    const gType = raw?.g__type as string | undefined;
    const gCoords = raw?.g__coordinates;
    const coords =
      typeof gCoords === "string" ? JSON.parse(gCoords as string) : gCoords;
    sidebarSelectedFeatureOriginal.value = {
      type: "Feature",
      geometry: {
        type: (gType ?? "Point") as "Point" | "LineString" | "Polygon",
        coordinates: coords ?? [],
      },
      properties: { ...raw },
    } as Feature;
  } catch (err) {
    sidebarFeatureLoadError.value =
      err && typeof err === "object" && "statusMessage" in err
        ? String((err as { statusMessage: string }).statusMessage)
        : "Failed to load record";
    sidebarDisplayFeature.value = payload.feature ?? null;
    sidebarSelectedFeatureOriginal.value = null;
  } finally {
    sidebarLoadingFeature.value = false;
  }
};

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
  mapboxBasemaps.value = data.value.mapboxBasemaps || [];
  mapboxZoom.value = data.value.mapboxZoom;
  mapbox3d.value = data.value.mapbox3d;
  mapbox3dTerrainExaggeration.value = data.value.mapbox3dTerrainExaggeration;
  mapeoData.value = data.value.mapeoData;
  mapeoTable.value = data.value.mapeoTable;
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
        :mapeo-table="mapeoTable"
        :table="table"
        :media-base-path="mediaBasePath"
        :media-base-path-alerts="mediaBasePathAlerts"
        :planet-api-key="planetApiKey"
        :sidebar-display-feature="sidebarDisplayFeature"
        :sidebar-loading-feature="sidebarLoadingFeature"
        :sidebar-feature-load-error="sidebarFeatureLoadError"
        :sidebar-selected-feature-original="sidebarSelectedFeatureOriginal"
        @request-record="onRequestRecord"
      />
    </ClientOnly>
  </div>
</template>
