<script setup lang="ts">
import ConfigCard from "@/components/config/ConfigCard.vue";
import CopyConfigControl from "@/components/config/CopyConfigControl.vue";
import SavedModal from "@/components/config/SavedModal.vue";
import ViewTypePill from "@/components/config/ViewTypePill.vue";
import DataLoadError from "@/components/shared/DataLoadError.vue";
import { useCopyConfig } from "@/composables/useCopyConfig";
import type { ViewConfig, ViewConfigRow, ViewType } from "@/types";
import { ChevronLeft, Eye } from "lucide-vue-next";

const route = useRoute();
const datasetRaw = route.params.dataset;
const dataset = Array.isArray(datasetRaw)
  ? datasetRaw.join("/")
  : String(datasetRaw || "");

const viewType = computed(() => route.query.view_type as ViewType | undefined);

const viewRows = ref<ViewConfigRow[]>([]);
const dataFetched = ref(false);
const datasetConfig = ref<ViewConfig | null>(null);
const secondaryDataset = ref<string | null>(null);
const viewName = ref("");
const errorMessage = ref<string | null>(null);

const editedViewType = ref<ViewType | undefined>(undefined);

const { data, error, refresh } = await useFetch<{
  views: ViewConfigRow[];
  availableTables: string[];
}>("/api/config");

if (data.value && !error.value) {
  const allViewRows = data.value.views;
  viewRows.value = allViewRows;

  const editedViewRow = allViewRows.find(
    (row) =>
      row.primaryDataset === dataset &&
      (!viewType.value || row.viewType === viewType.value),
  );

  if (editedViewRow) {
    datasetConfig.value = editedViewRow.viewConfig;
    secondaryDataset.value = editedViewRow.secondaryDataset ?? null;
    viewName.value = editedViewRow.viewName;
    editedViewType.value = editedViewRow.viewType;
    dataFetched.value = true;
  } else {
    console.warn(`Dataset "${dataset}" not found in config`);
    await navigateTo("/config");
  }
} else {
  console.error("Error fetching data:", error.value);
}

const resolvedViewType = computed(() => viewType.value ?? editedViewType.value);

const showSavedModal = ref(false);

const submitConfig = async ({
  config,
  secondaryDataset: submittedSecondaryDataset,
  tableName,
}: {
  config: ViewConfig;
  secondaryDataset?: string | null;
  tableName: string;
}) => {
  errorMessage.value = null;

  try {
    await $fetch(`/api/config/update_config/${tableName}`, {
      method: "POST",
      query: resolvedViewType.value
        ? { view_type: resolvedViewType.value }
        : undefined,
      body: JSON.stringify({
        config,
        secondaryDataset: submittedSecondaryDataset,
      }),
    });
    // Update the local datasetConfig to reflect the saved state
    // This will trigger the watch in ConfigCard to update originalConfig baseline thus clearing the button and applying edit
    datasetConfig.value = JSON.parse(JSON.stringify(config));
    secondaryDataset.value = submittedSecondaryDataset ?? null;
    viewName.value = config.DATASET_TABLE?.trim() || tableName;
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
    t("removeDatasetViewAreYouSure") +
    ": <strong>" +
    tableName +
    "</strong>?<br><br><em>" +
    t("datasetViewRemovedNote") +
    ".</em>";
  showModal.value = true;
  showModalButtons.value = true;
};

const handleConfirmRemove = async () => {
  if (tableNameToRemove.value) {
    try {
      await $fetch(`/api/config/delete_table/${tableNameToRemove.value}`, {
        method: "POST",
        query: resolvedViewType.value
          ? { view_type: resolvedViewType.value }
          : undefined,
      });
      // Hide buttons and update message to show success
      showModalButtons.value = false;
      modalMessage.value = t("datasetViewRemovedFromViews") + "!";
      // Ensure DOM updates before continuing
      await nextTick();
      // Wait 3 seconds to show success message, then navigate
      setTimeout(async () => {
        showModal.value = false;
        await navigateTo("/config");
      }, 3000);
    } catch (error) {
      console.error("Error removing table from config:", error);
      showErrorToast(t("errorCouldNotRemoveDataset"));
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

const handleSecondaryDatasetUpdate = (value: string) => {
  secondaryDataset.value = value.trim() === "" ? null : value;
};

const {
  showCopyModal,
  selectedCopySource,
  configToCopy,
  otherCopySources,
  handleOpenCopyModal,
  handleConfirmCopy,
  handleCancelCopy,
} = useCopyConfig(viewRows, dataset, resolvedViewType);

const { t } = useI18n();
const { error: showErrorToast } = useToast();
const pageDisplayName = computed(() => viewName.value.trim() || dataset);
useHead({
  title: computed(
    () =>
      "GuardianConnector Explorer: " +
      t("configuration") +
      " - " +
      pageDisplayName.value,
  ),
});

definePageMeta({ layout: "explorer" });
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <DataLoadError
      v-if="error"
      :title="$t('dataLoadErrorTitle')"
      :message="$t('dataLoadErrorMessage')"
      :retry="() => refresh()"
    />
    <ClientOnly v-else>
      <div
        v-if="dataFetched && datasetConfig"
        class="max-w-7xl mx-auto p-3 sm:p-6 w-full"
      >
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <NuxtLink
              to="/config"
              class="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 font-medium transition-colors"
            >
              <ChevronLeft class="w-5 h-5" />
              {{ $t("configuration") }}
            </NuxtLink>
            <NuxtLink
              v-if="resolvedViewType"
              :to="`/${resolvedViewType}/${dataset}`"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
            >
              <Eye class="w-4 h-4" />
              {{ $t("viewDataset") }}
            </NuxtLink>
          </div>
          <div class="flex items-center justify-between">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {{ $t("configuration") }} - {{ pageDisplayName }}
            </h1>
            <CopyConfigControl
              :sources="otherCopySources"
              :show-modal="showCopyModal"
              :selected-source="selectedCopySource"
              @open="handleOpenCopyModal"
              @confirm="handleConfirmCopy"
              @cancel="handleCancelCopy"
              @update:selected-source="selectedCopySource = $event"
            />
          </div>
          <dl
            v-if="resolvedViewType"
            data-testid="view-metadata"
            class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 sm:max-w-2xl text-sm"
          >
            <div>
              <dt class="text-gray-500">{{ $t("view") }}</dt>
              <dd class="mt-1">
                <ViewTypePill :view-type="resolvedViewType" />
              </dd>
            </div>
            <div>
              <dt class="text-gray-500">{{ $t("primaryDatasetLabel") }}</dt>
              <dd
                data-testid="view-metadata-primary"
                class="mt-1 font-medium text-gray-900"
              >
                {{ dataset }}
              </dd>
            </div>
            <div>
              <dt class="text-gray-500">{{ $t("secondaryDatasetLabel") }}</dt>
              <dd
                data-testid="view-metadata-secondary"
                class="mt-1 font-medium text-gray-900"
              >
                {{ secondaryDataset || $t("none") }}
              </dd>
            </div>
          </dl>
        </div>
        <div
          v-if="errorMessage"
          class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
        >
          {{ errorMessage }}
        </div>
        <ConfigCard
          v-if="resolvedViewType"
          :table-name="dataset"
          :view-type="resolvedViewType"
          :view-config="datasetConfig"
          :secondary-dataset="secondaryDataset"
          :config-to-copy="configToCopy"
          :secondary-editable="true"
          @submit-config="submitConfig"
          @remove-table-from-config="handleRemoveTableFromConfig"
          @update-secondary-dataset="handleSecondaryDatasetUpdate"
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
    </ClientOnly>

    <SavedModal
      :show="showSavedModal"
      dismissible
      @close="showSavedModal = false"
    />
  </div>
</template>
