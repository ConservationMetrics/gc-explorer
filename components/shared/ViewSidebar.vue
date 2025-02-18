<script setup lang="ts">
import DownloadMapData from "@/components/shared/DownloadMapData.vue";
import DataFeature from "@/components/shared/DataFeature.vue";
import AlertsIntroPanel from "@/components/alerts/AlertsIntroPanel.vue";

import type { AllowedFileExtensions, DataEntry, GeoJSON } from "@/types/types";

const props = defineProps<{
  alertsStatistics?: Record<string, unknown>;
  allowedFileExtensions?: AllowedFileExtensions;
  calculateHectares?: boolean;
  dateOptions?: Array<unknown>;
  downloadAlert?: boolean;
  feature?: DataEntry;
  featureGeojson?: GeoJSON;
  filePaths?: Array<string>;
  geojsonSelection?: GeoJSON;
  isAlert?: boolean;
  logoUrl?: string;
  mediaBasePath?: string;
  mediaBasePathAlerts?: string;
  showIntroPanel?: boolean;
  showSidebar?: boolean;
  showSlider?: boolean;
}>();

const scrolled = ref(false);

// To hide the scroll indicator when the user scrolls
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!scrolled.value && target.scrollTop > 0) {
    scrolled.value = true;
  }
};

// Filter out latitude and longitude from feature object
const filteredFeature = computed<DataEntry>(() => {
  if (!props.feature) {
    return {};
  }
  const { latitude, longitude, ...rest } = props.feature;
  return rest;
});

const emit = defineEmits(["close", "date-range-changed"]);

// Watchers
watch(
  () => props.feature,
  (newValue) => {
    if (newValue) {
      scrolled.value = false;
    }
  },
);
watch(
  () => props.showSidebar,
  (newValue) => {
    if (newValue) {
      scrolled.value = false;
    }
  },
);
</script>

<template>
  <div v-if="showSidebar" class="sidebar" @scroll="handleScroll">
    <div v-if="!scrolled" class="scroll-indicator">&#x2193;</div>
    <button class="close-btn" @click="emit('close')">X</button>
    <AlertsIntroPanel
      v-if="showIntroPanel"
      :calculate-hectares="calculateHectares"
      :date-options="dateOptions"
      :geojson-selection="geojsonSelection"
      :logo-url="logoUrl"
      :show-slider="showSlider"
      :alerts-statistics="alertsStatistics"
      @date-range-changed="emit('date-range-changed', $event)"
    />
    <DataFeature
      v-if="feature"
      :allowed-file-extensions="allowedFileExtensions"
      :feature="filteredFeature"
      :file-paths="filePaths"
      :is-alert="isAlert"
      :media-base-path="mediaBasePath"
      :media-base-path-alerts="mediaBasePathAlerts"
    />
    <DownloadMapData
      v-if="downloadAlert"
      :geojson="featureGeojson"
      :type-of-data="'alert'"
    />
  </div>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 400px;
  background: white;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  z-index: 1000;
}

@media (max-width: 768px) {
  .sidebar {
    height: 50%;
    width: 100%;
    bottom: 0;
    top: auto;
  }

  .scroll-indicator {
    display: block !important;
  }
}

.scroll-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 46px;
  font-weight: bold;
  color: #333;
  animation: pulse 1s infinite;
  display: none;
}

@keyframes pulse {
  0% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.2); /* Slightly larger */
  }
  100% {
    transform: translateX(-50%) scale(1);
  }
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
}
</style>
