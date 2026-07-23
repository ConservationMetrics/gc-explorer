<script setup lang="ts">
import ConfigCard from "@/components/config/ConfigCard.vue";
import CopyConfigControl from "@/components/config/CopyConfigControl.vue";
import SavedModal from "@/components/config/SavedModal.vue";
import SelectDatasetField from "@/components/config/SelectDatasetField.vue";
import ViewTypePill from "@/components/config/ViewTypePill.vue";
import DataLoadError from "@/components/shared/DataLoadError.vue";
import { useCopyConfig } from "@/composables/useCopyConfig";
import { useDuplicateViewCheck } from "@/composables/useDuplicateViewCheck";
import type { ViewConfig, ViewConfigRow, ViewType } from "@/types";
import { supportsSecondaryDataset, VIEW_TYPES } from "@/utils/viewTypes";
import { ChevronLeft } from "lucide-vue-next";

const route = useRoute();
const { t } = useI18n();
const { error: showErrorToast } = useToast();

const viewTypeParam = computed(() => {
  const raw = route.params.view_type;
  return Array.isArray(raw) ? raw[0] : String(raw || "");
});

const viewType = computed(() => viewTypeParam.value as ViewType);
const isValidViewType = computed(() =>
  VIEW_TYPES.some((type) => type === viewType.value),
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
const showSavedModal = ref(false);

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

const showsSecondaryDataset = computed(() =>
  supportsSecondaryDataset(viewType.value),
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
 * Creates the view, shows the same saved confirmation as edit, then opens edit.
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
    showSavedModal.value = true;
    setTimeout(async () => {
      showSavedModal.value = false;
      await navigateTo({
        path: `/config/${tableName}`,
        query: { view_type: viewType.value },
      });
    }, 2000);
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
    <div class="mb-6">
      <p class="text-sm text-gray-500 mb-1">{{ $t("view") }}</p>
      <ViewTypePill :view-type="viewType" />
    </div>

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
          <SelectDatasetField
            id="create-form-primary"
            v-model="primaryDataset"
            :label="$t('primaryDatasetRequired')"
            :options="availableTables"
            :placeholder="$t('selectPrimaryDataset')"
            test-id="create-form-primary-select"
            required
          />

          <SelectDatasetField
            v-if="showsSecondaryDataset"
            id="create-view-secondaryDataset-select"
            :model-value="secondaryDataset"
            :label="$t('secondaryDatasetOptional')"
            :options="availableTables"
            :placeholder="$t('selectSecondaryDataset')"
            test-id="secondary-dataset-select"
            :exclude-value="primaryDataset"
            @update:model-value="handleSecondaryDatasetUpdate"
          />
        </div>

        <CopyConfigControl
          :sources="otherCopySources"
          :show-modal="showCopyModal"
          :selected-source="selectedCopySource"
          button-container-class="flex-shrink-0 sm:pt-7"
          @open="handleOpenCopyModal"
          @confirm="handleConfirmCopy"
          @cancel="handleCancelCopy"
          @update:selected-source="selectedCopySource = $event"
        />
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

    <SavedModal :show="showSavedModal" />
  </div>
</template>
