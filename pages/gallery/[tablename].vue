<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { replaceUnderscoreWithSpace } from "@/utils/index";
import { useIsPublic } from "@/utils/permissions";
import { transformSurveyData } from "@/utils/dataProcessing/transformData";
import type { DataEntry } from "@/types/types";

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

const {
  public: { appApiKey },
} = useRuntimeConfig();

const headers = {
  "x-api-key": appApiKey,
};
const { data, error } = await useFetch(`/api/${table}/gallery`, {
  headers,
});

const rawGalleryList = ref<DataEntry[]>([]);

if (data.value && !error.value) {
  allowedFileExtensions.value = data.value.allowedFileExtensions;
  dataFetched.value = true;
  filterColumn.value = data.value.filterColumn;
  const rawList = (data.value.data ?? []) as DataEntry[];
  rawGalleryList.value = rawList;
  mediaBasePath.value = data.value.mediaBasePath;
  mediaColumn.value = data.value.mediaColumn;
  // Batch load first page via bulk records endpoint (270).
  const firstPageSize = 100;
  const firstIds = rawList
    .slice(0, firstPageSize)
    .map((r) => String(r._id ?? r.id))
    .filter(Boolean);
  if (firstIds.length > 0) {
    try {
      const res = await $fetch<{ records: (DataEntry | null)[] }>(
        `/api/${table}/records`,
        {
          method: "POST",
          body: { ids: firstIds },
          headers: { "x-api-key": appApiKey },
        },
      );
      const records = (res.records ?? []).filter(
        (r): r is DataEntry => r != null,
      );
      galleryData.value = transformSurveyData(
        records,
        data.value.mediaColumn,
      );
    } catch {
      galleryData.value = transformSurveyData(
        rawList.slice(0, firstPageSize),
        data.value.mediaColumn,
      );
    }
  } else {
    galleryData.value = [];
  }
} else {
  console.error("Error fetching data:", error.value);
}

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
