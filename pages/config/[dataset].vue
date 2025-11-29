<script setup lang="ts">
import { useI18n } from "vue-i18n";
import LanguagePicker from "@/components/shared/LanguagePicker.vue";
import ConfigCard from "@/components/config/ConfigCard.vue";

import type { Views, ViewConfig } from "@/types/types";

// Extract the dataset parameter from the route
const route = useRoute();
const datasetRaw = route.params.dataset;
const dataset = Array.isArray(datasetRaw)
  ? datasetRaw.join("/")
  : String(datasetRaw || "");

// Refs to store the fetched data
const viewsConfig = ref<Views>({});
const tableNames = ref();
const dataFetched = ref(false);
const datasetConfig = ref<ViewConfig | null>(null);

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
  // Get the specific dataset config - try exact match first
  if (fetchedViewsData[dataset]) {
    datasetConfig.value = fetchedViewsData[dataset];
    dataFetched.value = true;
  } else {
    // Try to find by matching keys (in case of URL encoding issues)
    const matchingKey = Object.keys(fetchedViewsData).find(
      (key) =>
        key === dataset ||
        decodeURIComponent(key) === dataset ||
        key === decodeURIComponent(dataset),
    );
    if (matchingKey) {
      datasetConfig.value = fetchedViewsData[matchingKey];
      dataFetched.value = true;
    } else {
      // Dataset not found, redirect to config page
      console.warn(`Dataset "${dataset}" not found in config`);
      await navigateTo("/config");
    }
  }
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
    // Show success message and redirect after a delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await navigateTo("/config");
  } catch (error) {
    console.error("Error submitting request data:", error);
  }
};

// Modal state for remove confirmation
const showModal = ref(false);
const showModalButtons = ref(false);
const modalMessage = ref("");
const tableNameToRemove = ref<string | null>(null);

const handleRemoveTableFromConfig = (tableName: string) => {
  tableNameToRemove.value = tableName;
  modalMessage.value =
    t("removeTableAreYouSure") +
    ": <strong>" +
    tableName +
    "</strong>?<br><br><em>" +
    t("tableRemovedNote") +
    ".</em>";
  showModal.value = true;
  showModalButtons.value = true;
};

const handleConfirmRemove = async () => {
  if (tableNameToRemove.value) {
    try {
      await $fetch(`/api/config/delete_table/${tableNameToRemove.value}`, {
        method: "POST",
        headers,
      });
      modalMessage.value = t("tableRemovedFromViews") + "!";
      showModalButtons.value = false;
      setTimeout(() => {
        showModal.value = false;
        navigateTo("/config");
      }, 3000);
    } catch (error) {
      console.error("Error removing table from config:", error);
      showModal.value = false;
    }
  }
};

const handleCancelRemove = () => {
  showModal.value = false;
  showModalButtons.value = false;
  modalMessage.value = "";
  tableNameToRemove.value = null;
};

const { t } = useI18n();
useHead({
  title: "GuardianConnector Explorer: " + t("configuration") + " - " + dataset,
});
</script>

<template>
  <div>
    <ClientOnly>
      <div v-if="dataFetched && datasetConfig" class="container relative">
        <div class="absolute top-0 right-4 flex justify-end space-x-4 mb-4">
          <LanguagePicker />
        </div>
        <div class="back-navigation mb-4">
          <NuxtLink
            to="/config"
            class="back-link text-blue-500 hover:text-blue-700 font-bold"
          >
            ← {{ $t("configuration") }}
          </NuxtLink>
        </div>
        <h1>
          {{ $t("availableViews") }}: {{ $t("configuration") }} - {{ dataset }}
        </h1>
        <div class="grid-container">
          <ConfigCard
            :table-name="dataset"
            :view-config="datasetConfig"
            :is-minimized="false"
            @submit-config="submitConfig"
            @remove-table-from-config="handleRemoveTableFromConfig"
            @toggle-minimize="() => {}"
          />
        </div>
      </div>
      <!-- Modal moved outside conditional block so it stays visible after deletion -->
      <div v-if="showModal" class="overlay"></div>
      <div v-if="showModal" class="modal">
        <!-- eslint-disable vue/no-v-html -->
        <!-- this is done intentionally to allow for HTML rendering in the modal message -->
        <p v-html="modalMessage"></p>
        <!-- eslint-enable vue/no-v-html -->
        <div v-if="showModalButtons" class="mt-4">
          <button
            class="text-white font-bold mb-2 mr-2 py-2 px-4 rounded transition-colors duration-200 bg-red-500 hover:bg-red-700"
            @click="handleConfirmRemove"
          >
            {{ $t("confirm") }}
          </button>
          <button
            class="text-white font-bold bg-blue-500 hover:bg-blue-700 mb-2 py-2 px-4 rounded transition-colors duration-200"
            @click="handleCancelRemove"
          >
            {{ $t("cancel") }}
          </button>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2em;
}

.container h1 {
  color: #333;
  margin-bottom: 1em;
  font-size: 2em;
  font-weight: 900;
}

.grid-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 1em auto;
}

.back-navigation {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.back-link {
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
