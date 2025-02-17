<script setup>
import { ref, computed, watch } from "vue";
import DownloadMapData from "@/components/shared/DownloadMapData.vue";
import DataFeature from "@/components/shared/DataFeature.vue";
import AlertsIntroPanel from "@/components/alerts/AlertsIntroPanel.vue";

const props = defineProps({
  alertsStatistics: Object,
  allowedFileExtensions: Object,
  calculateHectares: Boolean,
  dateOptions: Array,
  downloadAlert: Boolean,
  feature: Object,
  featureGeojson: Object,
  filePaths: Array,
  geojsonSelection: Object,
  isAlert: Boolean,
  logoUrl: String,
  mediaBasePath: String,
  mediaBasePathAlerts: String,
  showIntroPanel: Boolean,
  showSidebar: Boolean,
  showSlider: Boolean,
});

const scrolled = ref(false);

// To hide the scroll indicator when the user scrolls
const handleScroll = (event) => {
  if (!scrolled.value && event.target.scrollTop > 0) {
    scrolled.value = true;
  }
};

// Filter out latitude and longitude from feature object
const filteredFeature = computed(() => {
  const { latitude, longitude, ...rest } = props.feature;
  return rest;
});

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
    <button class="close-btn" @click="$emit('close')">X</button>
    <AlertsIntroPanel
      v-if="showIntroPanel"
      :calculate-hectares="calculateHectares"
      :date-options="dateOptions"
      :geojson-selection="geojsonSelection"
      :logo-url="logoUrl"
      :show-slider="showSlider"
      :alerts-statistics="alertsStatistics"
      @date-range-changed="$emit('date-range-changed', $event)"
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
