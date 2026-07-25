<script setup lang="ts">
import type { ViewConfigRow } from "@/types";
import DataLoadError from "@/components/shared/DataLoadError.vue";

const viewRows = ref<ViewConfigRow[]>([]);
const dataFetched = ref(false);

const { data, error, refresh } = await useFetch<{
  views: ViewConfigRow[];
  availableTables: string[];
}>("/api/config");

if (data.value && !error.value) {
  viewRows.value = data.value.views;
  dataFetched.value = true;
} else {
  console.error("Error fetching data:", error.value);
}

const { t } = useI18n();
useHead({
  title: "GuardianConnector Explorer: " + t("configuration"),
});

definePageMeta({ layout: "explorer" });
</script>

<template>
  <DataLoadError
    v-if="error"
    :title="$t('dataLoadErrorTitle')"
    :message="$t('dataLoadErrorMessage')"
    :retry="() => refresh()"
  />
  <ClientOnly v-else>
    <ConfigDashboard v-if="dataFetched" :view-rows="viewRows" />
  </ClientOnly>
</template>
