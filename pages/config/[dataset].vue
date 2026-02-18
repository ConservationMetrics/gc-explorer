<script setup lang="ts">
import ConfigCard from "@/components/config/ConfigCard.vue";
import AppHeader from "@/components/shared/AppHeader.vue";
import { useCopyConfig } from "@/composables/useCopyConfig";
import type { Views, ViewConfig } from "@/types/types";

const route = useRoute();
const datasetRaw = route.params.dataset;
const dataset = Array.isArray(datasetRaw)
  ? datasetRaw.join("/")
  : String(datasetRaw || "");

const viewsConfig = ref<Views>({});
const tableNames = ref();
const dataFetched = ref(false);
const datasetConfig = ref<ViewConfig | null>(null);
const errorMessage = ref<string | null>(null);

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
  if (fetchedViewsData[dataset]) {
    datasetConfig.value = fetchedViewsData[dataset];
    dataFetched.value = true;
  } else {
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
      console.warn(`Dataset "${dataset}" not found in config`);
      await navigateTo("/config");
    }
  }
} else {
  console.error("Error fetching data:", error.value);
}

const showSavedModal = ref(false);

const submitConfig = async ({
  config,
  tableName,
}: {
  config: ViewConfig;
  tableName: string;
}) => {
  errorMessage.value = null;

  try {
    await $fetch(`/api/config/update_config/${tableName}`, {
      method: "POST",
      headers,
      body: JSON.stringify(config),
    });
    // Update the local datasetConfig to reflect the saved state
    // This will trigger the watch in ConfigCard to update originalConfig baseline thus clearing the button and applying edit
    datasetConfig.value = JSON.parse(JSON.stringify(config));
    showSavedModal.value = true;
    setTimeout(() => {
      showSavedModal.value = false;
    }, 2000);
  } catch (error) {
    console.error("Error submitting request data:", error);
    if (error instanceof Error) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value =
        "An error occurred while updating the configuration.";
    }
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
      // Hide buttons and update message to show success
      showModalButtons.value = false;
      modalMessage.value = t("tableRemovedFromViews") + "!";
      // Ensure DOM updates before continuing
      await nextTick();
      // Wait 3 seconds to show success message, then navigate
      setTimeout(async () => {
        showModal.value = false;
        await navigateTo("/config");
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

const {
  showCopyModal,
  selectedCopySource,
  configToCopy,
  otherDatasets,
  handleOpenCopyModal,
  handleConfirmCopy,
  handleCancelCopy,
} = useCopyConfig(viewsConfig, dataset);

const { t } = useI18n();
useHead({
  title: "GuardianConnector Explorer: " + t("configuration") + " - " + dataset,
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <AppHeader />
    <ClientOnly>
      <div
        v-if="dataFetched && datasetConfig"
        class="max-w-7xl mx-auto p-3 sm:p-6 w-full"
      >
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <NuxtLink
              to="/config"
              class="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {{ $t("configuration") }}
            </NuxtLink>
            <NuxtLink
              :to="`/dataset/${dataset}`"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {{ $t("viewDataset") }}
            </NuxtLink>
          </div>
          <div class="flex items-center justify-between">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {{ $t("configuration") }} - {{ dataset }}
            </h1>
            <button
              v-if="otherDatasets.length > 0"
              data-testid="copy-config-button"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              @click="handleOpenCopyModal"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {{ $t("copyConfigFromDataset") }}
            </button>
          </div>
        </div>
        <div
          v-if="errorMessage"
          class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
        >
          {{ errorMessage }}
        </div>
        <ConfigCard
          :table-name="dataset"
          :view-config="datasetConfig"
          :config-to-copy="configToCopy"
          @submit-config="submitConfig"
          @remove-table-from-config="handleRemoveTableFromConfig"
        />
      </div>
      <div
        v-if="showModal"
        data-testid="remove-confirmation-modal"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <div
          data-testid="remove-confirmation-modal-content"
          class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        >
          <!-- eslint-disable vue/no-v-html -->
          <!-- This is intentional to allow HTML rendering in the modal message -->
          <p
            data-testid="remove-confirmation-modal-message"
            class="mb-4 text-gray-700"
            v-html="modalMessage"
          ></p>
          <!-- eslint-enable vue/no-v-html -->
          <div v-if="showModalButtons" class="flex gap-3 justify-end">
            <button
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              @click="handleConfirmRemove"
            >
              {{ $t("confirm") }}
            </button>
            <button
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              @click="handleCancelRemove"
            >
              {{ $t("cancel") }}
            </button>
          </div>
        </div>
      </div>
      <!-- Copy Config Modal -->
      <div
        v-if="showCopyModal"
        data-testid="copy-config-modal"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <div
          data-testid="copy-config-modal-content"
          class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ $t("copyConfigFromDataset") }}
          </h3>
          <p class="text-sm text-gray-600 mb-4">
            {{ $t("copyConfigDescription") }}
          </p>
          <select
            v-model="selectedCopySource"
            data-testid="copy-config-select"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors mb-4"
          >
            <option value="" disabled>
              {{ $t("selectDataset") }}
            </option>
            <option
              v-for="dsName in otherDatasets"
              :key="dsName"
              :value="dsName"
            >
              {{ viewsConfig[dsName]?.DATASET_TABLE || dsName }}
            </option>
          </select>
          <div class="flex gap-3 justify-end">
            <button
              data-testid="copy-config-confirm-button"
              :disabled="!selectedCopySource"
              class="px-4 py-2 font-medium rounded-lg transition-colors"
              :class="{
                'bg-gray-300 text-gray-500 cursor-not-allowed':
                  !selectedCopySource,
                'bg-purple-700 hover:bg-purple-800 text-white':
                  selectedCopySource,
              }"
              @click="handleConfirmCopy"
            >
              {{ $t("confirm") }}
            </button>
            <button
              data-testid="copy-config-cancel-button"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              @click="handleCancelCopy"
            >
              {{ $t("cancel") }}
            </button>
          </div>
        </div>
      </div>
    </ClientOnly>

    <!-- Saved! Modal -->
    <ClientOnly>
      <div
        v-if="showSavedModal"
        data-testid="saved-modal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click="showSavedModal = false"
      >
        <div
          data-testid="saved-modal-content"
          class="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 text-center"
          @click.stop
        >
          <div class="mb-4">
            <svg
              class="w-16 h-16 mx-auto text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Saved!</h2>
          <p class="text-gray-600">
            Configuration has been saved successfully.
          </p>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>
