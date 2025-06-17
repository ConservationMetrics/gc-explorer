<script setup lang="ts">
import MediaFile from "@/components/shared/MediaFile.vue";
import { Copy, Check } from "lucide-vue-next";

import type { AllowedFileExtensions, DataEntry } from "@/types/types";

const props = defineProps<{
  allowedFileExtensions?: AllowedFileExtensions;
  feature: DataEntry;
  filePaths?: Array<string>;
  isAlert?: boolean;
  mediaBasePath?: string;
  mediaBasePathAlerts?: string;
}>();

const showCopied = ref(false);

const copyLink = () => {
  navigator.clipboard.writeText(window.location.href);
  showCopied.value = true;
  setTimeout(() => {
    showCopied.value = false;
  }, 2000);
};

/** Sort feature object by key */
const sortedFeature = computed(() => {
  return Object.keys(props.feature as Record<string, string>)
    .sort()
    .reduce(
      (accumulator, key: string) => {
        if (props.feature) {
          accumulator[key] = props.feature[key];
        }
        return accumulator;
      },
      {} as Record<string, string>,
    );
});

/** Set media base path based on whether it's an alert or not */
const setMediaBasePath = () => {
  if (props.isAlert && props.mediaBasePathAlerts) {
    return props.mediaBasePathAlerts;
  } else if (!props.isAlert && props.mediaBasePath) {
    return props.mediaBasePath;
  } else {
    return "";
  }
};
</script>

<template>
  <div class="feature p-4 rounded-lg shadow-lg">
    <div v-for="(value, key) in sortedFeature" :key="key">
      <div v-if="key.toLowerCase().includes('data source')" class="mt-4">
        <h1 class="text-2xl font-bold">{{ value }} data</h1>
      </div>
    </div>
    <div
      v-if="allowedFileExtensions && setMediaBasePath()"
      :class="{ 'flex-container': isAlert }"
    >
      <MediaFile
        v-for="filePath in filePaths"
        :key="filePath"
        :allowed-file-extensions="allowedFileExtensions"
        :file-path="filePath"
        :media-base-path="setMediaBasePath()"
      />
    </div>
    <div v-for="(value, key) in sortedFeature" :key="key" class="mt-4">
      <div
        v-if="
          value !== null &&
          value !== '' &&
          key.toLowerCase() !== 'uuid' &&
          !key.toLowerCase().includes('photo') &&
          key.toLowerCase() !== 'audio' &&
          !key.toLowerCase().includes('data source')
        "
        class="mb-2"
      >
        <span class="font-bold">
          <!-- Translate keys only when it's an alert to avoid performance issues with translating all keys -->
          {{
            isAlert
              ? $t(key).charAt(0).toUpperCase() + $t(key).slice(1)
              : key === "dataCollectedOn"
                ? $t(key)
                : key.charAt(0).toUpperCase() + key.slice(1)
          }}</span
        >:
        <span
          v-if="key !== 'geographicCentroid' && key !== 'geocoordinates'"
          class="break-words"
          >{{ value }}</span
        >
        <span v-else>
          {{ value }}
          <!-- guide on Google search URL construction here: https://developers.google.com/maps/documentation/urls/get-started-->
          <a
            :href="'https://www.google.com/maps/search/?api=1&query=' + value"
            target="_blank"
            >({{ $t("viewOnGoogleMaps") }})</a
          >
        </span>
      </div>
    </div>
    <div class="mt-6 pt-4 border-t border-gray-200">
      <button
        class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
        @click="copyLink"
      >
        <component
          :is="showCopied ? Check : Copy"
          class="w-4 h-4"
          :class="{ 'text-green-500': showCopied }"
        />
        <span>{{ showCopied ? $t("copied") : $t("copyLink") }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
a {
  text-decoration: underline;
}
.flex-container {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}
.flex-container > img {
  flex: 1 0 45%;
  max-width: calc(50% - 10px);
}
</style>
