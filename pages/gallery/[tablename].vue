<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { replaceUnderscoreWithSpace } from "@/utils/index";
import { useIsPublic } from "@/utils/permissions";
import {
  filterUnwantedKeys,
  filterOutUnwantedValues,
  filterDataByExtension,
} from "@/utils/dataProcessing/filterData";
import { transformSurveyData } from "@/utils/dataProcessing/transformData";

import type { ColumnEntry } from "@/types/types";

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

if (data.value && !error.value) {
  const rawData = data.value.data ?? [];
  const columns = (data.value.columns ?? []) as ColumnEntry[];

  const filteredKeys = filterUnwantedKeys(
    rawData,
    columns,
    data.value.unwantedColumns,
    data.value.unwantedSubstrings,
  );
  const filteredValues = filterOutUnwantedValues(
    filteredKeys,
    data.value.filterByColumn,
    data.value.filterOutValuesFromColumn,
  );
  const withFilesOnly = filterDataByExtension(
    filteredValues,
    data.value.allowedFileExtensions,
    data.value.mediaColumn,
  );
  const transformed = transformSurveyData(withFilesOnly);

  allowedFileExtensions.value = data.value.allowedFileExtensions;
  dataFetched.value = true;
  filterColumn.value = data.value.filterColumn;
  galleryData.value = transformed;
  mediaBasePath.value = data.value.mediaBasePath;
  mediaColumn.value = data.value.mediaColumn;
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
