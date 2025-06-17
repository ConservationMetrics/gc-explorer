<script setup lang="ts">
import MediaFile from "@/components/shared/MediaFile.vue";

import type { AllowedFileExtensions, DataEntry } from "@/types/types";

const props = defineProps<{
  allowedFileExtensions?: AllowedFileExtensions;
  feature: DataEntry;
  filePaths?: Array<string>;
  isAlert?: boolean;
  mediaBasePath?: string;
  mediaBasePathAlerts?: string;
}>();

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
  <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div class="p-6 space-y-6">
      <div v-for="(value, key) in sortedFeature" :key="key">
        <div v-if="key.toLowerCase().includes('data source')" class="mb-4">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ value }} data
          </h1>
        </div>
      </div>

      <div
        v-if="allowedFileExtensions && setMediaBasePath()"
        :class="{ 'flex-container': isAlert }"
        class="space-y-4"
      >
        <MediaFile
          v-for="filePath in filePaths"
          :key="filePath"
          :allowed-file-extensions="allowedFileExtensions"
          :file-path="filePath"
          :media-base-path="setMediaBasePath()"
        />
      </div>

      <div class="space-y-3">
        <div v-for="(value, key) in sortedFeature" :key="key">
          <div
            v-if="
              value !== null &&
              value !== '' &&
              key.toLowerCase() !== 'uuid' &&
              !key.toLowerCase().includes('photo') &&
              key.toLowerCase() !== 'audio' &&
              !key.toLowerCase().includes('data source')
            "
            class="flex flex-col gap-1"
          >
            <span class="text-sm font-medium">
              {{
                isAlert
                  ? $t(key).charAt(0).toUpperCase() + $t(key).slice(1)
                  : key === "dataCollectedOn"
                    ? $t(key)
                    : key.charAt(0).toUpperCase() + key.slice(1)
              }}
            </span>
            <div class="text-sm text-muted-foreground">
              <span
                v-if="key !== 'geographicCentroid' && key !== 'geocoordinates'"
                class="break-words"
                >{{ value }}</span
              >
              <span v-else class="flex items-center gap-2">
                {{ value }}
                <a
                  :href="
                    'https://www.google.com/maps/search/?api=1&query=' + value
                  "
                  target="_blank"
                  class="text-primary hover:text-primary/90 underline-offset-4 hover:underline"
                  >({{ $t("viewOnGoogleMaps") }})</a
                >
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flex-container {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
}
.flex-container > img {
  flex: 1 0 45%;
  max-width: calc(50% - 0.75rem);
}
</style>
