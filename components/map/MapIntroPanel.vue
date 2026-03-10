<script setup lang="ts">
import DownloadMapData from "@/components/shared/DownloadMapData.vue";

import type { MapStatistics } from "@/types/types";
import type { FeatureCollection } from "geojson";

const props = defineProps<{
  mapStatistics: MapStatistics;
  mapFeatureCollection: FeatureCollection;
  logoUrl?: string;
  showIcons?: boolean;
  canToggleIcons?: boolean;
  loadingIcons?: boolean;
}>();

const emit = defineEmits<{
  (e: "toggleIcons"): void;
}>();
/** Get data source from first item if available */
const dataSource = computed(() => {
  if (props.mapFeatureCollection.features.length === 0) return null;

  const firstProps = props.mapFeatureCollection.features[0].properties;
  if (!firstProps) return null;

  // Look for a column that contains "data source" (case insensitive)
  const dataSourceKey = Object.keys(firstProps).find((key) =>
    key.toLowerCase().includes("data source"),
  );

  return dataSourceKey ? firstProps[dataSourceKey] : null;
});
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div class="p-6 space-y-4">
        <img
          v-if="props.logoUrl"
          :src="props.logoUrl"
          class="w-auto mx-auto mb-4 max-h-25"
          alt="Logo"
          loading="eager"
        />
        <h2 v-if="dataSource" class="text-2xl font-semibold tracking-tight">
          {{ dataSource }} {{ $t("data") }}
        </h2>
        <div class="space-y-2 text-sm text-muted-foreground">
          <p class="italic">🗺️ {{ $t("clickOnFeaturesForMoreInfo") }}.</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm">{{ $t("totalFeatures") }}:</span>
            <span class="text-sm text-muted-foreground">{{
              $n(props.mapStatistics.totalFeatures)
            }}</span>
          </div>

          <div
            v-if="props.mapStatistics.dateRange"
            class="flex items-center gap-2"
          >
            <span class="font-bold text-sm">{{ $t("dateRange") }}:</span>
            <span class="text-sm text-muted-foreground">{{
              props.mapStatistics.dateRange
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div class="p-6">
        <DownloadMapData :data-for-download="mapFeatureCollection" />
      </div>
    </div>

    <div
      v-if="canToggleIcons"
      class="rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <div class="p-6 flex justify-center">
        <button
          class="toggle-icons-button bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loadingIcons"
          @click="emit('toggleIcons')"
        >
          <span v-if="loadingIcons">Loading icons...</span>
          <span v-else>{{
            showIcons ? $t("showPoints") : $t("showIcons")
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
