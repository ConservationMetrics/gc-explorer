<script setup lang="ts">
import DownloadMapData from "@/components/shared/DownloadMapData.vue";
import DataFeature from "@/components/shared/DataFeature.vue";
import AlertsIntroPanel from "@/components/alerts/AlertsIntroPanel.vue";

import type {
  AlertsData,
  AlertsStatistics,
  AllowedFileExtensions,
  DataEntry,
} from "@/types/types";

import type { Feature } from "geojson";

const props = defineProps<{
  alertsStatistics?: AlertsStatistics;
  allowedFileExtensions?: AllowedFileExtensions;
  calculateHectares?: boolean;
  dateOptions?: Array<string>;
  downloadAlert?: boolean;
  feature?: DataEntry;
  featureData?: Feature;
  filePaths?: Array<string>;
  geojsonSelection?: Feature | AlertsData;
  isAlert?: boolean;
  logoUrl?: string;
  mediaBasePath?: string;
  mediaBasePathAlerts?: string;
  showIntroPanel?: boolean;
  showSidebar?: boolean;
  showSlider?: boolean;
}>();

const scrolled = ref(false);

/** To hide the scroll indicator when the user scrolls */
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!scrolled.value && target.scrollTop > 0) {
    scrolled.value = true;
  }
};

/** Filter out latitude and longitude from feature object */
const filteredFeature = computed<DataEntry>(() => {
  if (!props.feature) {
    return {};
  }
  const { latitude, longitude, ...rest } = props.feature;
  return rest;
});

/** Data for AlertsIntroPanel component */
const dataForAlertsIntroPanel = computed(() => {
  if (props.geojsonSelection) {
    return props.geojsonSelection as AlertsData;
  }
  return undefined;
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
      v-if="showIntroPanel && alertsStatistics"
      :calculate-hectares="calculateHectares"
      :date-options="dateOptions"
      :geojson-selection="dataForAlertsIntroPanel"
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
      :feature-data="featureData"
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
    transform: translateX(-50%) scale(1.2);
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
