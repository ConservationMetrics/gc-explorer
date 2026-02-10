<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ViewSidebar from "@/components/shared/ViewSidebar.vue";
import { replaceUnderscoreWithSpace } from "@/utils/index";
import { useIsPublic } from "@/utils/permissions";
import { transformSurveyData } from "@/utils/dataProcessing/transformData";
import type { DataEntry } from "@/types/types";

import type { DataEntry } from "@/types/types";
import type { Feature } from "geojson";

// Extract the tablename from the route parameters
const route = useRoute();
const tableRaw = route.params.tablename;
const table = Array.isArray(tableRaw) ? tableRaw.join("/") : tableRaw;

const allowedFileExtensions = ref();
const dataFetched = ref(false);
const filterColumn = ref();
const galleryData = ref();
const mediaBasePath = ref();
const mediaColumn = ref();

const showDetailSidebar = ref(false);
const displayFeature = ref<DataEntry | null>(null);
const loadingFeature = ref(false);
const featureLoadError = ref<string | null>(null);
const selectedFeatureOriginal = ref<Feature | null>(null);

const {
  public: { appApiKey },
} = useRuntimeConfig();

const headers = {
  "x-api-key": appApiKey,
};
const { data, error } = await useFetch(`/api/${table}/gallery`, {
  headers,
});

if (data.value && !error.value) {
  allowedFileExtensions.value = data.value.allowedFileExtensions;
  dataFetched.value = true;
  filterColumn.value = data.value.filterColumn;
  // API returns raw data; transform for display (human-readable keys/values).
  galleryData.value = transformSurveyData(
    (data.value.data ?? []) as DataEntry[],
    data.value.mediaColumn,
  );
  mediaBasePath.value = data.value.mediaBasePath;
  mediaColumn.value = data.value.mediaColumn;
} else {
  console.error("Error fetching data:", error.value);
}

const onSelectFeature = async (record: DataEntry) => {
  const recordId = record._id ?? record.id;
  if (recordId == null || String(recordId).trim() === "") return;
  showDetailSidebar.value = true;
  displayFeature.value = record;
  loadingFeature.value = true;
  featureLoadError.value = null;
  selectedFeatureOriginal.value = null;
  try {
    const fetchHeaders: Record<string, string> = {};
    if (appApiKey) fetchHeaders["x-api-key"] = appApiKey;
    const raw = await $fetch<Record<string, unknown>>(
      `/api/${encodeURIComponent(table)}/${encodeURIComponent(String(recordId))}`,
      { headers: fetchHeaders },
    );
    displayFeature.value = raw as DataEntry;
    const gType = raw?.g__type as string | undefined;
    const gCoords = raw?.g__coordinates;
    const coords =
      typeof gCoords === "string" ? JSON.parse(gCoords as string) : gCoords;
    selectedFeatureOriginal.value = {
      type: "Feature",
      geometry: {
        type: (gType ?? "Point") as "Point" | "LineString" | "Polygon",
        coordinates: coords ?? [],
      },
      properties: { ...raw },
    };
  } catch (err) {
    featureLoadError.value =
      err && typeof err === "object" && "statusMessage" in err
        ? String((err as { statusMessage: string }).statusMessage)
        : "Failed to load record";
    displayFeature.value = record;
  } finally {
    loadingFeature.value = false;
  }
};

const closeDetailSidebar = () => {
  showDetailSidebar.value = false;
  displayFeature.value = null;
  selectedFeatureOriginal.value = null;
  featureLoadError.value = null;
};

const { t } = useI18n();

// Check if this view is publicly accessible
const isPublic = useIsPublic(data);

useHead({
  title:
    "GuardianConnector Explorer " +
    t("gallery") +
    " - " +
    replaceUnderscoreWithSpace(table),
  meta: [
    ...(isPublic.value
      ? [{ name: "robots", content: "noindex, nofollow" }]
      : []),
  ],
});
</script>

<template>
  <div>
    <ClientOnly>
      <GalleryView
        v-if="mediaBasePath && dataFetched"
        :allowed-file-extensions="allowedFileExtensions"
        :gallery-data="galleryData"
        :filter-column="filterColumn"
        :media-base-path="mediaBasePath"
        :media-column="mediaColumn"
        :table="table"
        @select-feature="onSelectFeature"
      />
      <ViewSidebar
        v-if="showDetailSidebar"
        :feature="displayFeature ?? undefined"
        :feature-geojson="selectedFeatureOriginal ?? undefined"
        :feature-load-error="featureLoadError"
        :loading-feature="loadingFeature"
        :media-base-path="mediaBasePath"
        :show-sidebar="showDetailSidebar"
        @close="closeDetailSidebar"
        @update:showSidebar="showDetailSidebar = $event"
      />
      <h3
        v-if="!mediaBasePath && dataFetched"
        data-testid="gallery-error-message"
      >
        {{ $t("galleryNotAvailable") }}.
      </h3>
    </ClientOnly>
  </div>
</template>
