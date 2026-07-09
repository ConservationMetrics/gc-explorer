<script setup lang="ts">
import { useI18n } from "vue-i18n";

import DataLoadError from "@/components/shared/DataLoadError.vue";
import EmptyStateIllustration from "@/components/shared/EmptyStateIllustration.vue";
import { replaceUnderscoreWithSpace } from "@/utils/identifierUtils";
import { useIsPublic } from "@/utils/accessControls";

const { t } = useI18n();
const rowLimit = useRuntimeConfig().public.rowLimit;

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
const mapboxAccessToken = ref<string | undefined>();
const mapboxStyle = ref<string | undefined>();
const timestampColumn = ref<string | undefined>();

const { data, error, refresh } = await useFetch(`/api/${table}/gallery`, {
  params: { limit: rowLimit },
});

useRowLimitReachedToast(data, rowLimit);

if (data.value && !error.value) {
  allowedFileExtensions.value = data.value.allowedFileExtensions;
  dataFetched.value = true;
  filterColumn.value = data.value.filterColumn;
  galleryData.value = data.value.data;
  mapboxAccessToken.value = data.value.mapboxAccessToken;
  mapboxStyle.value = data.value.mapboxStyle;
  mediaBasePath.value = data.value.mediaBasePath;
  mediaColumn.value = data.value.mediaColumn;
  timestampColumn.value = data.value.timestampColumn;
} else {
  console.error("Error fetching data:", error.value);
}

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

definePageMeta({ layout: "explorer" });
</script>

<template>
  <main class="mx-auto w-full max-w-7xl p-3 sm:p-6">
    <DataLoadError
      v-if="error"
      :title="$t('dataLoadErrorTitle')"
      :message="$t('dataLoadErrorMessage')"
      :retry="() => refresh()"
    />
    <ClientOnly v-else>
      <GalleryView
        v-if="mediaBasePath && dataFetched"
        :allowed-file-extensions="allowedFileExtensions"
        :gallery-data="galleryData"
        :filter-column="filterColumn"
        :mapbox-access-token="mapboxAccessToken"
        :mapbox-style="mapboxStyle"
        :media-base-path="mediaBasePath"
        :media-column="mediaColumn"
        :table="table"
        :timestamp-column="timestampColumn"
      />
      <div
        v-if="!mediaBasePath && dataFetched"
        class="py-12 text-center"
        data-testid="gallery-error-message"
      >
        <EmptyStateIllustration variant="notConfigured" />
        <p class="text-sm text-gray-500 sm:text-base">
          {{ $t("galleryNotAvailable") }}.
        </p>
      </div>
    </ClientOnly>
  </main>
</template>
