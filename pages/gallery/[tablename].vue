<script setup lang="ts">
import { ref } from "vue";
import { useHead, useFetch, useRuntimeConfig } from "#app";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

// Extract the tablename from the route parameters
const route = useRoute();
const table = route.params.tablename;

// Refs to store the fetched data
const allowedFileExtensions = ref({});
const dataFetched = ref(false);
const filterColumn = ref("");
const galleryData = ref([]);
const mediaBasePath = ref("");

// API request to fetch the data
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
} else {
  console.error("Error fetching data:", error.value);
}

const { t } = useI18n();
useHead({
  title: "GuardianConnector Explorer" + t("gallery"),
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
      />
      <h3 v-if="!mediaBasePath && dataFetched">
        {{ $t("galleryNotAvailable") }}.
      </h3>
    </ClientOnly>
  </div>
</template>
