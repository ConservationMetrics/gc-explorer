<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { replaceUnderscoreWithSpace } from "@/utils/index";
import { useIsPublic } from "@/utils/permissions";

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
const timestampColumn = ref();

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
  galleryData.value = data.value.data;
  mediaBasePath.value = data.value.mediaBasePath;
  mediaColumn.value = data.value.mediaColumn;
  timestampColumn.value = data.value.timestampColumn;
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
        :timestamp-column="timestampColumn"
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
