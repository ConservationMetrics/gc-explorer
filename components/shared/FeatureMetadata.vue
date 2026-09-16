<script setup lang="ts">
import {
  ExternalLink,
  FileAudio,
  FileDown,
  FileImage,
  FileVideo,
} from "lucide-vue-next";

import MediaFile from "@/components/shared/MediaFile.vue";
import MediaImageComparisonModal from "@/components/shared/MediaImageComparisonModal.vue";
import Minimap from "@/components/shared/Minimap.vue";
import { formatDisplayName } from "@/utils";

import type { AllowedFileExtensions, DataEntry } from "@/types";

const FIELD_VALUE_PREVIEW_LENGTH = 120;

const props = withDefaults(
  defineProps<{
    allowedFileExtensions: AllowedFileExtensions;
    centroid?: string;
    feature: DataEntry;
    filePaths: string[];
    mapboxAccessToken?: string;
    mapboxStyle?: string;
    mediaBasePath: string;
    isAlert?: boolean;
    showMedia?: boolean;
    showMiniMap?: boolean;
  }>(),
  {
    showMedia: false,
    showMiniMap: true,
  },
);

const expandedFields = ref<Set<string>>(new Set());

/**
 * Detects values that are structured JSON blobs (e.g. raw attachment
 * metadata), including blobs partially mangled by the survey display
 * transform. These are hidden from the field list; the same underlying
 * files surface in the structured Files section instead.
 */
const isJsonBlobValue = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    // Post-transform blobs are no longer valid JSON but still contain braces
    return /[{}]/.test(trimmed);
  }
};

/** Sorted metadata fields. Hide empty values, ids, and JSON blobs. */
const visibleFields = computed(() =>
  Object.keys(props.feature)
    .sort()
    .filter((key) => {
      const value = props.feature[key];
      if (value === null || value === "") return false;

      const lowerKey = key.toLowerCase();
      if (lowerKey === "uuid") return false;
      if (lowerKey === "datasource" || lowerKey.includes("data source"))
        return false;
      if (isJsonBlobValue(value)) return false;

      return true;
    })
    .map((key) => ({ key, value: String(props.feature[key]) })),
);

const isCoordinateField = (key: string): boolean =>
  key === "geocoordinates" || key === "geographicCentroid";

/**
 * Returns whether a metadata value is a complete http(s) URL.
 *
 * @param {string} value - The metadata value to inspect.
 * @returns {boolean} Whether the value should render as an outbound link.
 */
const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value.trim());
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
};

/** Index of the last visible coordinate field, for minimap placement. */
const lastCoordinateFieldIndex = computed(() => {
  let lastIndex = -1;
  visibleFields.value.forEach((field, index) => {
    if (isCoordinateField(field.key)) {
      lastIndex = index;
    }
  });
  return lastIndex;
});

/**
 * Returns whether a metadata value exceeds the compact display limit.
 *
 * @param {string} value - The metadata value to inspect.
 * @returns {boolean} Whether the value can be expanded.
 */
const isFieldExpandable = (value: string): boolean =>
  value.length > FIELD_VALUE_PREVIEW_LENGTH;

/**
 * Returns whether a metadata field is currently expanded.
 *
 * @param {string} key - The metadata field key.
 * @returns {boolean} Whether the field is expanded.
 */
const isFieldExpanded = (key: string): boolean => expandedFields.value.has(key);

/**
 * Returns a compact or full metadata value.
 *
 * @param {{ key: string; value: string }} field - The metadata field.
 * @returns {string} The value to display.
 */
const displayFieldValue = (field: { key: string; value: string }): string => {
  if (!isFieldExpandable(field.value) || isFieldExpanded(field.key)) {
    return field.value;
  }
  return `${field.value.slice(0, FIELD_VALUE_PREVIEW_LENGTH).trimEnd()}…`;
};

/**
 * Toggles the expanded state for a metadata field.
 *
 * @param {string} key - The metadata field key.
 * @returns {void}
 */
const toggleFieldExpanded = (key: string) => {
  const nextExpandedFields = new Set(expandedFields.value);
  if (nextExpandedFields.has(key)) {
    nextExpandedFields.delete(key);
  } else {
    nextExpandedFields.add(key);
  }
  expandedFields.value = nextExpandedFields;
};

const fileType = (filePath: string): "image" | "audio" | "video" | null => {
  const extension = (filePath.split(".").pop() || "").toLowerCase();
  if (props.allowedFileExtensions.image?.includes(extension)) return "image";
  if (props.allowedFileExtensions.audio?.includes(extension)) return "audio";
  if (props.allowedFileExtensions.video?.includes(extension)) return "video";
  return null;
};

const fileIcon = (filePath: string) => {
  const type = fileType(filePath);
  if (type === "audio") return FileAudio;
  if (type === "video") return FileVideo;
  return FileImage;
};

const fileUrl = (filePath: string): string =>
  `${props.mediaBasePath}/${filePath}`;

const fileName = (filePath: string): string =>
  filePath.split("/").pop() || filePath;

/**
 * Identifies whether an alert image is a before or after image.
 *
 * @param {string} filePath - The alert image path.
 * @returns {number | null} The image time index, or null for other files.
 */
const alertImageTime = (filePath: string): number | null => {
  const match = filePath.match(/(?:^|[/_])t([01])(?:[_./]|$)/i);
  return match ? Number(match[1]) : null;
};

const comparisonImagePaths = computed(() => {
  if (!props.isAlert) return [];

  return props.filePaths
    .filter(
      (filePath) =>
        fileType(filePath) === "image" && alertImageTime(filePath) !== null,
    )
    .sort(
      (left, right) =>
        (alertImageTime(left) ?? 0) - (alertImageTime(right) ?? 0),
    )
    .slice(0, 2);
});

const comparisonEnabled = computed(
  () => comparisonImagePaths.value.length === 2,
);
const comparisonModalOpen = ref(false);

const comparisonImageUrls = computed(() =>
  comparisonImagePaths.value.map((filePath) => fileUrl(filePath)),
);
const comparisonImageNames = computed(() =>
  comparisonImagePaths.value.map((filePath) => fileName(filePath)),
);

/** Opens the paired before/after image preview. */
const openComparisonModal = () => {
  if (comparisonEnabled.value) {
    comparisonModalOpen.value = true;
  }
};

/** Closes the paired before/after image preview. */
const closeComparisonModal = () => {
  comparisonModalOpen.value = false;
};
</script>

<template>
  <div class="space-y-6" data-testid="gallery-detail-metadata-fields">
    <div class="space-y-4">
      <div
        v-if="showMedia && mediaBasePath && filePaths.length > 0"
        :class="{ 'grid grid-cols-2 gap-6': isAlert }"
        data-testid="media-files-container"
      >
        <MediaFile
          v-for="filePath in filePaths"
          :key="filePath"
          :allowed-file-extensions="allowedFileExtensions"
          :file-path="filePath"
          :media-base-path="mediaBasePath"
          :image-modal-mode="comparisonEnabled ? 'comparison' : 'single'"
          @image-click="openComparisonModal"
        />
      </div>
      <div
        v-for="(field, index) in visibleFields"
        :key="field.key"
        class="flex flex-col gap-0.5"
        data-testid="gallery-metadata-field"
      >
        <span
          class="text-xs font-semibold uppercase tracking-wide text-violet-700"
          data-testid="gallery-metadata-label"
        >
          {{ formatDisplayName(field.key) }}
        </span>
        <span
          v-if="!isCoordinateField(field.key)"
          class="break-words text-sm text-gray-900"
          data-testid="gallery-metadata-value"
        >
          <a
            v-if="isHttpUrl(field.value)"
            :href="field.value.trim()"
            target="_blank"
            rel="noopener noreferrer"
            class="inline break-all text-violet-600 underline underline-offset-4 hover:text-violet-800"
            data-testid="gallery-metadata-url"
          >
            {{ displayFieldValue(field) }}
            <ExternalLink
              class="mb-0.5 inline h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
          </a>
          <template v-else>{{ displayFieldValue(field) }}</template>
          <button
            v-if="isFieldExpandable(field.value)"
            class="ml-1 text-sm font-medium text-violet-700 underline underline-offset-2 hover:text-violet-900"
            type="button"
            @click="toggleFieldExpanded(field.key)"
          >
            {{ isFieldExpanded(field.key) ? $t("showLess") : $t("showMore") }}
          </button>
        </span>
        <span
          v-else
          class="flex flex-wrap items-center gap-2 text-sm text-gray-900"
          data-testid="gallery-metadata-value"
        >
          {{ field.value }}
          <a
            :href="
              'https://www.google.com/maps/search/?api=1&query=' + field.value
            "
            target="_blank"
            class="text-violet-600 underline-offset-4 hover:text-violet-800 hover:underline"
            data-testid="google-maps-link"
            >({{ $t("viewOnGoogleMaps") }})</a
          >
        </span>
        <Minimap
          v-if="showMiniMap && index === lastCoordinateFieldIndex"
          class="mt-2"
          :alt="$t('galleryLocation')"
          :centroid="centroid"
          :mapbox-access-token="mapboxAccessToken"
          :mapbox-style="mapboxStyle"
        />
      </div>
    </div>

    <Minimap
      v-if="showMiniMap && centroid && lastCoordinateFieldIndex < 0"
      :alt="$t('galleryLocation')"
      :centroid="centroid"
      :mapbox-access-token="mapboxAccessToken"
      :mapbox-style="mapboxStyle"
    />

    <div
      v-if="!showMedia && filePaths.length > 0"
      class="border-t border-violet-100 pt-4"
      data-testid="gallery-metadata-files"
    >
      <h3
        class="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700"
      >
        {{ $t("galleryFiles") }}
      </h3>
      <ul class="space-y-1.5">
        <li v-for="filePath in filePaths" :key="filePath">
          <a
            :href="fileUrl(filePath)"
            target="_blank"
            class="group flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-gray-900 transition-colors hover:bg-white"
            data-testid="gallery-metadata-file-link"
          >
            <component
              :is="fileIcon(filePath)"
              class="h-4 w-4 shrink-0 text-violet-500"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1 break-words">{{
              fileName(filePath)
            }}</span>
            <FileDown
              class="h-3.5 w-3.5 shrink-0 text-violet-400 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </a>
        </li>
      </ul>
    </div>
    <MediaImageComparisonModal
      v-if="comparisonEnabled"
      :file-names="comparisonImageNames"
      :image-urls="comparisonImageUrls"
      :labels="['before', 'after']"
      :open="comparisonModalOpen"
      @close="closeComparisonModal"
    />
  </div>
</template>
