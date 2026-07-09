<script setup lang="ts">
import { FileAudio, FileImage, FileVideo, ExternalLink } from "lucide-vue-next";

import GalleryDetailMinimap from "@/components/gallery/GalleryDetailMinimap.vue";

import type {
  AllowedFileExtensions,
  DataEntry,
  GalleryAttachment,
} from "@/types";

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  attachments: GalleryAttachment[];
  centroid?: string;
  feature: DataEntry;
  filePaths: string[];
  mapboxAccessToken?: string;
  mapboxStyle?: string;
  mediaBasePath: string;
}>();

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

/** Sorted metadata fields: DataFeature exclusions plus attachment/json-blob hiding. */
const visibleFields = computed(() =>
  Object.keys(props.feature)
    .sort()
    .filter((key) => {
      const value = props.feature[key];
      if (value === null || value === "") return false;

      const lowerKey = key.toLowerCase();
      if (lowerKey === "uuid") return false;
      if (lowerKey.includes("photo")) return false;
      if (lowerKey === "audio") return false;
      if (lowerKey.includes("data source")) return false;
      if (lowerKey.includes("attachment")) return false;
      if (isJsonBlobValue(value)) return false;

      return true;
    })
    .map((key) => ({ key, value: String(props.feature[key]) })),
);

const isCoordinateField = (key: string): boolean =>
  key === "geocoordinates" || key === "geographicCentroid";

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

const showAttachments = computed(() => props.attachments.length > 0);

const showFilePathFallback = computed(
  () => !showAttachments.value && props.filePaths.length > 0,
);

const showFilesSection = computed(
  () => showAttachments.value || showFilePathFallback.value,
);

const attachmentIcon = (attachment: GalleryAttachment) => {
  const mimetype = attachment.mimetype || "";
  if (mimetype.startsWith("audio/")) return FileAudio;
  if (mimetype.startsWith("video/")) return FileVideo;
  return FileImage;
};

type AttachmentDownloadLink = {
  href: string;
  labelKey: string;
};

/**
 * Returns the download links available for a parsed attachment.
 *
 * @param {GalleryAttachment} attachment - Parsed attachment metadata.
 * @returns {AttachmentDownloadLink[]} Download links to render.
 */
const attachmentDownloadLinks = (
  attachment: GalleryAttachment,
): AttachmentDownloadLink[] => {
  const links: AttachmentDownloadLink[] = [];

  if (attachment.downloadUrl) {
    links.push({
      href: attachment.downloadUrl,
      labelKey: "galleryDownloadOriginal",
    });
  }
  if (attachment.downloadLargeUrl) {
    links.push({
      href: attachment.downloadLargeUrl,
      labelKey: "galleryDownloadLarge",
    });
  }
  if (attachment.downloadMediumUrl) {
    links.push({
      href: attachment.downloadMediumUrl,
      labelKey: "galleryDownloadMedium",
    });
  }
  if (attachment.downloadSmallUrl) {
    links.push({
      href: attachment.downloadSmallUrl,
      labelKey: "galleryDownloadSmall",
    });
  }

  return links;
};

/**
 * Builds a compact metadata line for a parsed attachment.
 *
 * @param {GalleryAttachment} attachment - Parsed attachment metadata.
 * @returns {string} Metadata summary.
 */
const attachmentMetaLine = (attachment: GalleryAttachment): string => {
  const parts: string[] = [];
  if (attachment.mimetype) parts.push(attachment.mimetype);
  if (attachment.questionXpath) parts.push(attachment.questionXpath);
  if (attachment.id != null) parts.push(`ID ${attachment.id}`);
  if (attachment.uid) parts.push(`UID ${attachment.uid}`);
  return parts.join(" · ");
};
</script>

<template>
  <div class="space-y-6" data-testid="gallery-detail-metadata-fields">
    <div class="space-y-4">
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
          {{
            field.key === "dataCollectedOn"
              ? $t(field.key)
              : field.key.charAt(0).toUpperCase() + field.key.slice(1)
          }}
        </span>
        <span
          v-if="!isCoordinateField(field.key)"
          class="break-words text-sm text-gray-900"
          data-testid="gallery-metadata-value"
        >
          {{ field.value }}
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
        <GalleryDetailMinimap
          v-if="index === lastCoordinateFieldIndex"
          class="mt-2"
          :centroid="centroid"
          :mapbox-access-token="mapboxAccessToken"
          :mapbox-style="mapboxStyle"
        />
      </div>
    </div>

    <GalleryDetailMinimap
      v-if="centroid && lastCoordinateFieldIndex < 0"
      :centroid="centroid"
      :mapbox-access-token="mapboxAccessToken"
      :mapbox-style="mapboxStyle"
    />

    <div
      v-if="showFilesSection"
      class="border-t border-violet-100 pt-4"
      data-testid="gallery-metadata-files"
    >
      <h3
        class="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700"
      >
        {{ $t("galleryFiles") }}
      </h3>

      <ul v-if="showAttachments" class="space-y-3">
        <li
          v-for="(attachment, index) in attachments"
          :key="`${attachment.uid ?? attachment.id ?? attachment.name}-${index}`"
          class="rounded-lg bg-white/60 px-3 py-2"
          data-testid="gallery-metadata-attachment"
        >
          <div class="flex items-start gap-2">
            <component
              :is="attachmentIcon(attachment)"
              class="mt-0.5 h-4 w-4 shrink-0 text-violet-500"
              aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <p
                class="break-words text-sm font-medium text-gray-900"
                data-testid="gallery-metadata-attachment-name"
              >
                {{ attachment.name }}
              </p>
              <p
                v-if="attachmentMetaLine(attachment)"
                class="mt-0.5 break-words text-xs text-gray-600"
                data-testid="gallery-metadata-attachment-meta"
              >
                {{ attachmentMetaLine(attachment) }}
              </p>
              <div
                v-if="attachmentDownloadLinks(attachment).length > 0"
                class="mt-1.5 flex flex-wrap gap-x-3 gap-y-1"
              >
                <a
                  v-for="link in attachmentDownloadLinks(attachment)"
                  :key="link.labelKey"
                  :href="link.href"
                  target="_blank"
                  class="inline-flex items-center gap-1 text-xs font-medium text-violet-600 underline-offset-4 hover:text-violet-800 hover:underline"
                  data-testid="gallery-metadata-attachment-link"
                >
                  {{ $t(link.labelKey) }}
                  <ExternalLink class="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <ul v-else class="space-y-1.5">
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
            <ExternalLink
              class="h-3.5 w-3.5 shrink-0 text-violet-400 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
