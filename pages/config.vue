<script setup lang="ts">
import { useI18n } from "vue-i18n";

import type { Views, ViewConfig } from "@/types/types";

// Refs to store the fetched data
const viewsConfig = ref<Views>({});
const tableNames = ref();
const dataFetched = ref(false);

// API request to fetch the data
const {
  public: { appApiKey },
} = useRuntimeConfig();

const headers = {
  "x-api-key": appApiKey,
};

const { data, error } = await useFetch("/api/config", {
  headers,
});

if (data.value && !error.value) {
  const fetchedViewsData = data.value[0] as Views;
  viewsConfig.value = fetchedViewsData;

  const fetchedTableNames = data.value[1] as string[];
  tableNames.value = fetchedTableNames;
  dataFetched.value = true;
} else {
  console.error("Error fetching data:", error.value);
}

/** POST request to submit the updated config */
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
      headers,
      body: JSON.stringify(config),
    });
  } catch (error) {
    console.error("Error submitting request data:", error);
  }
};

/** POST request to remove a table from the config */
const removeTableFromConfig = async (tableName: string) => {
  try {
    await $fetch(`/api/config/delete_table/${tableName}`, {
      method: "POST",
      headers,
    });
  } catch (error) {
    console.error("Error removing table from config:", error);
  }
};

/** POST request to add a table to the config */
const addTableToConfig = async (tableName: string) => {
  try {
    await $fetch(`/api/config/new_table/${tableName}`, {
      method: "POST",
      headers,
    });
  } catch (error) {
    console.error("Error adding table to config:", error);
  }
};

const { t } = useI18n();
useHead({
  title: "GuardianConnector Explorer: " + t("configuration"),
});
</script>

<template>
  <div>
    <ClientOnly>
      <ConfigDashboard
        v-if="dataFetched"
        :views-config="viewsConfig"
        :table-names="tableNames"
        @submit-config="submitConfig"
        @remove-table-from-config="removeTableFromConfig"
        @add-table-to-config="addTableToConfig"
    /></ClientOnly>
  </div>
</template>
