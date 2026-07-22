<script setup lang="ts">
import ConfigCard from "@/components/config/ConfigCard.vue";
import SecondaryDatasetFields from "@/components/config/SecondaryDatasetFields.vue";
import DataLoadError from "@/components/shared/DataLoadError.vue";
import { useCopyConfig } from "@/composables/useCopyConfig";
import { useDuplicateViewCheck } from "@/composables/useDuplicateViewCheck";
import type { ViewConfig, ViewConfigRow, ViewType } from "@/types";
import { ChevronLeft, Copy } from "lucide-vue-next";

const VALID_VIEW_TYPES: ViewType[] = ["map", "gallery", "alerts"];

const route = useRoute();
const { t } = useI18n();
const { error: showErrorToast } = useToast();

const viewTypeParam = computed(() => {
  const raw = route.params.view_type;
  return Array.isArray(raw) ? raw[0] : String(raw || "");
});

const viewType = computed(() => viewTypeParam.value as ViewType);
const isValidViewType = computed(() =>
  VALID_VIEW_TYPES.includes(viewType.value),
);

if (!isValidViewType.value) {
  await navigateTo("/config/new");
}

const primaryDataset = ref(
  typeof route.query.primary === "string" ? route.query.primary : "",
);

const { data, error, refresh } = await useFetch<{
  views: ViewConfigRow[];
  availableTables: string[];
}>("/api/config");

const availableTables = computed(() => data.value?.availableTables ?? []);
const viewRows = computed(() => data.value?.views ?? []);

const viewConfig = ref<ViewConfig>({});
const secondaryDataset = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const isSaving = ref(false);

const { isDuplicate, existingView, isChecking, checkDuplicate } =
  useDuplicateViewCheck(viewType, primaryDataset);

const {
  showCopyModal,
  selectedCopySource,
  configToCopy,
  secondaryDatasetToCopy,
  otherCopySources,
  handleOpenCopyModal,
  handleConfirmCopy,
  handleCancelCopy,
} = useCopyConfig(viewRows, primaryDataset, viewType);

const saveEnabled = computed(
  () =>
    primaryDataset.value.trim() !== "" &&
    !isDuplicate.value &&
    !isChecking.value &&
    !isSaving.value,
);

const showsSecondaryDataset = computed(
  () => viewType.value === "map" || viewType.value === "alerts",
);

watch(primaryDataset, (primary) => {
  if (primary && secondaryDataset.value?.trim() === primary.trim()) {
    secondaryDataset.value = null;
  }
});

// Apply companion table from the copied view (alerts/map secondary).
watch(secondaryDatasetToCopy, (copiedSecondary) => {
  if (configToCopy.value) {
    secondaryDataset.value = copiedSecondary;
  }
});

const handleSecondaryDatasetUpdate = (value: string) => {
  secondaryDataset.value = value.trim() === "" ? null : value;
};

/**
 * Creates the view with the form config, then opens its edit page.
 *
 * @param {{ config: ViewConfig; secondaryDataset?: string | null; tableName: string }} payload
 * @returns {Promise<void>}
 */
const submitConfig = async ({
  config,
  secondaryDataset: submittedSecondaryDataset,
  tableName,
}: {
  config: ViewConfig;
  secondaryDataset?: string | null;
  tableName: string;
}) => {
  if (!saveEnabled.value) return;

  errorMessage.value = null;
  isSaving.value = true;
  try {
    await $fetch(`/api/config/new_table/${tableName}`, {
      method: "POST",
      query: { view_type: viewType.value },
      body: JSON.stringify({
        config,
        secondaryDataset: submittedSecondaryDataset,
      }),
    });
    await navigateTo({
      path: `/config/${tableName}`,
      query: { view_type: viewType.value },
    });
  } catch (err) {
    console.error("Error creating view:", err);
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 409) {
      errorMessage.value = t("duplicateViewWarning");
      await checkDuplicate();
    } else if (err instanceof Error) {
      errorMessage.value = err.message;
    } else {
      errorMessage.value = t("errorCouldNotAddDataset");
    }
    showErrorToast(t("errorCouldNotAddDataset"));
  } finally {
    isSaving.value = false;
  }
};

useHead({
  title: "GuardianConnector Explorer: " + t("addNewTable"),
});

definePageMeta({ layout: "explorer" });
</script>

<template>
  <div class="max-w-4xl mx-auto p-3 sm:p-6 w-full">
    <NuxtLink
      to="/config/new"
      class="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 font-medium mb-4 transition-colors"
    >
      <ChevronLeft class="w-5 h-5" />
      {{ $t("addNewTable") }}
    </NuxtLink>

    <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
      {{ $t("configureNewView") }}
    </h1>
    <p class="text-gray-600 mb-6">
      {{ $t(viewType) }} — {{ $t("primaryDatasetLabel") }}
    </p>

    <DataLoadError
      v-if="error"
      :title="$t('dataLoadErrorTitle')"
      :message="$t('dataLoadErrorMessage')"
      :retry="() => refresh()"
    />

    <template v-else-if="isValidViewType">
      <div
        class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
      >
        <div class="min-w-0 flex-1 space-y-6">
          <div>
            <label
              for="create-form-primary"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              {{ $t("primaryDatasetLabel") }}
            </label>
            <select
              id="create-form-primary"
              v-model="primaryDataset"
              data-testid="create-form-primary-select"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
            >
              <option value="">{{ $t("selectPrimaryDataset") }}</option>
              <option
                v-for="table in availableTables"
                :key="table"
                :value="table"
              >
                {{ table }}
              </option>
            </select>
          </div>

          <SecondaryDatasetFields
            v-if="showsSecondaryDataset"
            table-name="create-view"
            :secondary-dataset="secondaryDataset"
            :available-tables="availableTables"
            :primary-dataset="primaryDataset"
            @update-secondary-dataset="handleSecondaryDatasetUpdate"
          />
        </div>

        <div v-if="otherCopySources.length > 0" class="flex-shrink-0 sm:pt-7">
          <button
            type="button"
            data-testid="copy-config-button"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            @click="handleOpenCopyModal"
          >
            <Copy class="w-4 h-4" />
            {{ $t("copyConfigFromDataset") }}
          </button>
        </div>
      </div>

      <div
        v-if="isDuplicate && existingView"
        data-testid="create-duplicate-warning"
        class="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg"
      >
        <p class="mb-2">{{ $t("duplicateViewWarning") }}</p>
        <NuxtLink
          :to="{
            path: `/config/${existingView.primaryDataset}`,
            query: { view_type: existingView.viewType },
          }"
          data-testid="create-duplicate-edit-link"
          class="font-medium text-violet-700 hover:text-violet-900 underline"
        >
          {{ $t("editExistingView") }}
        </NuxtLink>
      </div>

      <div
        v-if="errorMessage"
        class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
      >
        {{ errorMessage }}
      </div>

      <ConfigCard
        :table-name="primaryDataset"
        :view-type="viewType"
        :view-config="viewConfig"
        :secondary-dataset="secondaryDataset"
        :config-to-copy="configToCopy"
        :allow-save-without-changes="true"
        :show-remove="false"
        :save-enabled="saveEnabled"
        :secondary-editable="true"
        @submit-config="submitConfig"
        @update-secondary-dataset="handleSecondaryDatasetUpdate"
      />
    </template>

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
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors mb-4"
        >
          <option value="" disabled>
            {{ $t("selectView") }}
          </option>
          <option
            v-for="source in otherCopySources"
            :key="source.key"
            :value="source.key"
          >
            {{ source.label }}
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
              'bg-violet-700 hover:bg-violet-800 text-white':
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
  </div>
</template>
