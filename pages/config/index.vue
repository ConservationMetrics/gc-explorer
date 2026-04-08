<script setup lang="ts">
import type { Views, ViewConfig } from "@/types";
import DataLoadError from "@/components/shared/DataLoadError.vue";

const viewsConfig = ref<Views>({});
const tableNames = ref();
const dataFetched = ref(false);

const { data, error, refresh } = await useFetch("/api/config");

if (data.value && !error.value) {
  const fetchedViewsData = data.value[0] as Views;
  viewsConfig.value = fetchedViewsData;

  const fetchedTableNames = data.value[1] as string[];
  tableNames.value = fetchedTableNames;
  dataFetched.value = true;
} else {
  console.error("Error fetching data:", error.value);
}

const submitConfig = async ({
  config,
  tableName,
}: {
  config: ViewConfig;
  tableName: string;
}) => {
  try {
    await $fetch(`/api/config/update_config/${tableName}`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  } catch (error) {
    console.error("Error submitting request data:", error);
    showErrorToast(t("errorCouldNotSaveChanges"));
  }
};

const removeTableFromConfig = async (tableName: string) => {
  try {
    await $fetch(`/api/config/delete_table/${tableName}`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Error removing table from config:", error);
    showErrorToast(t("errorCouldNotRemoveDataset"));
  }
};

const addTableToConfig = async (tableName: string) => {
  try {
    await $fetch(`/api/config/new_table/${tableName}`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Error adding table to config:", error);
    showErrorToast(t("errorCouldNotAddDataset"));
  }
};

const { t } = useI18n();
const { error: showErrorToast } = useToast();
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
    <ConfigDashboard
      v-if="dataFetched"
      :views-config="viewsConfig"
      :table-names="tableNames"
      @submit-config="submitConfig"
      @remove-table-from-config="removeTableFromConfig"
      @add-table-to-config="addTableToConfig"
    />
  </ClientOnly>
</template>
