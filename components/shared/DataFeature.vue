<script setup lang="ts">
import MediaFile from "@/components/shared/MediaFile.vue";
import { Copy, Check } from "lucide-vue-next";
import AlertTooltip from "@/components/alerts/AlertTooltip.vue";

import type { AllowedFileExtensions, DataEntry } from "@/types/types";

const props = defineProps<{
  allowedFileExtensions?: AllowedFileExtensions;
  feature: DataEntry;
  filePaths?: Array<string>;
  isAlert?: boolean;
  isMapeo?: boolean;
  isAlertsDashboard?: boolean;
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
        if (props.feature && props.feature[key] !== undefined) {
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
  <div
    class="rounded-lg border bg-card text-card-foreground shadow-sm"
    data-testid="data-feature"
  >
    <div class="p-6 space-y-6">
      <div v-for="(value, key) in sortedFeature" :key="key">
        <div v-if="key.toLowerCase().includes('data source')" class="mb-4">
          <h1
            class="text-2xl font-semibold tracking-tight"
            data-testid="data-source-heading"
          >
            {{ value }} data
          </h1>
        </div>
      </div>

      <div
        v-if="allowedFileExtensions && setMediaBasePath()"
        :class="{ 'grid grid-cols-2 gap-6': isAlert }"
        data-testid="media-files-container"
      >
        <MediaFile
          v-for="filePath in filePaths"
          :key="filePath"
          :allowed-file-extensions="allowedFileExtensions"
          :file-path="filePath"
          :media-base-path="setMediaBasePath()"
        />
      </div>

      <div class="space-y-3" data-testid="feature-fields">
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
            data-testid="feature-field"
          >
            <!-- Translate keys only when it's an alert to avoid performance issues with translating all keys -->
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium" data-testid="field-label">
                {{
                  isAlert
                    ? $t(key).charAt(0).toUpperCase() + $t(key).slice(1)
                    : key === "dataCollectedOn"
                      ? $t(key)
                      : key.charAt(0).toUpperCase() + key.slice(1)
                }}
              </span>
              <!-- Tooltip for confidenceLevel field, for alerts only -->
              <AlertTooltip
                v-if="
                  isAlert &&
                  key.toLowerCase() === 'confidencelevel' &&
                  sortedFeature.dataProvider &&
                  sortedFeature.alertType
                "
                :data-provider="sortedFeature.dataProvider"
                :alert-type="sortedFeature.alertType"
              />
            </div>
            <div
              class="text-sm text-muted-foreground"
              data-testid="field-value"
            >
              <span
                v-if="key !== 'geographicCentroid' && key !== 'geocoordinates'"
                class="break-words"
                >{{ value }}</span
              >
              <span v-else class="flex items-center gap-2">
                {{ value }}
                <!-- guide on Google search URL construction here: https://developers.google.com/maps/documentation/urls/get-started-->
                <a
                  :href="
                    'https://www.google.com/maps/search/?api=1&query=' + value
                  "
                  target="_blank"
                  class="text-primary hover:text-primary/90 underline-offset-4 hover:underline"
                  data-testid="google-maps-link"
                  >({{ $t("viewOnGoogleMaps") }})</a
                >
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="isAlertsDashboard"
      class="mt-6 pt-4 border-t border-gray-200"
      data-testid="copy-link-section"
    >
      <button
        class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
        data-testid="copy-link-button"
        @click="copyLink"
      >
        <component
          :is="showCopied ? Check : Copy"
          class="w-4 h-4"
          :class="{ 'text-green-500': showCopied }"
        />
        <span>{{
          showCopied
            ? $t("copied")
            : isMapeo
              ? $t("copyMapeoLink")
              : $t("copyLink")
        }}</span>
      </button>
    </div>
  </div>
</template>
