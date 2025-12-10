<script setup lang="ts">
import type { Views, ViewConfig } from "@/types/types";
import AppHeader from "@/components/shared/AppHeader.vue";

const viewsConfig = ref<Views>({});
const tableNames = ref();
const dataFetched = ref(false);

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
  <div class="min-h-screen flex flex-col bg-white">
    <AppHeader />
    <ClientOnly>
      <ConfigDashboard
        v-if="dataFetched"
        :views-config="viewsConfig"
        :table-names="tableNames"
        @submit-config="submitConfig"
        @remove-table-from-config="removeTableFromConfig"
        @add-table-to-config="addTableToConfig"
      />
    </ClientOnly>
  </div>
</template>
