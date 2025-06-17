<script setup lang="ts">
import { X, ChevronDown } from "lucide-vue-next";
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
  filePaths?: Array<string>;
  isAlert?: boolean;
  localAlertsData?: Feature | AlertsData;
  logoUrl?: string;
  mediaBasePath?: string;
  mediaBasePathAlerts?: string;
  showIntroPanel?: boolean;
  showSidebar?: boolean;
  showSlider?: boolean;
}>();

const isScrollable = ref(false);

/** Filter out latitude and longitude from feature object */
const filteredFeature = computed<DataEntry>(() => {
  if (!props.feature) {
    return {};
  }
  const { latitude, longitude, ...rest } = props.feature;
  return rest;
});

const dataForAlertsIntroPanel = computed<AlertsData | undefined>(() => {
  if (props.localAlertsData && "mostRecentAlerts" in props.localAlertsData) {
    return props.localAlertsData as AlertsData;
  }
  return undefined;
});

const emit = defineEmits<{
  close: [];
  "date-range-changed": [[string, string]];
  "update:showSidebar": [boolean];
}>();

const checkIfScrollable = () => {
  const sidebar = document.querySelector(".sidebar") as HTMLElement;
  if (sidebar) {
    isScrollable.value = sidebar.scrollHeight > sidebar.offsetHeight;
  }
};

// Check scrollability when content changes or sidebar becomes visible
watch(
  () => props.feature,
  () => {
    nextTick(() => {
      checkIfScrollable();
    });
  },
);

watch(
  () => props.showSidebar,
  (newValue) => {
    if (newValue) {
      nextTick(() => {
        checkIfScrollable();
      });
    }
  },
);

onMounted(() => {
  checkIfScrollable();
  window.addEventListener("resize", checkIfScrollable);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkIfScrollable);
});
</script>

<template>
  <div
    class="fixed top-0 left-0 h-full w-[400px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto z-50 sidebar"
    :class="{ 'translate-x-0': showSidebar, '-translate-x-full': !showSidebar }"
  >
    <div class="relative h-full">
      <div v-if="isScrollable" class="scroll-indicator">
        <ChevronDown class="w-6 h-6 text-gray-600 animate-bounce" />
      </div>
      <button
        class="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur-sm hover:bg-gray-100 rounded-full transition-all duration-200 ease-in-out shadow-sm hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
        @click="emit('close')"
      >
        <span class="sr-only">Close</span>
        <X class="w-5 h-5 text-gray-600" />
      </button>

      <div class="p-4 sidebar-content">
        <AlertsIntroPanel
          v-if="showIntroPanel && alertsStatistics"
          :calculate-hectares="calculateHectares"
          :date-options="dateOptions"
          :data-for-alerts-intro-panel="dataForAlertsIntroPanel"
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
          :data-for-download="localAlertsData"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroll-indicator {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  padding: 0.5rem;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
