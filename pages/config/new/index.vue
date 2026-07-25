<script setup lang="ts">
import DataLoadError from "@/components/shared/DataLoadError.vue";
import type { ViewType } from "@/types";
import { ChevronLeft, Images, Map, TriangleAlert } from "lucide-vue-next";

const VIEW_TYPE_OPTIONS: {
  type: ViewType;
  icon: typeof Map;
  descriptionKey: string;
}[] = [
  {
    type: "map",
    icon: Map,
    descriptionKey: "viewDescriptionMap",
  },
  {
    type: "gallery",
    icon: Images,
    descriptionKey: "viewDescriptionGallery",
  },
  {
    type: "alerts",
    icon: TriangleAlert,
    descriptionKey: "viewDescriptionAlerts",
  },
];

const { t } = useI18n();
const selectedViewType = ref<ViewType | null>(null);
const selectedPrimary = ref("");

const { data, error, refresh } = await useFetch<{
  availableTables: string[];
}>("/api/config");

const availableTables = computed(() => data.value?.availableTables ?? []);

/**
 * Continues to the create form for the chosen view type.
 *
 * @returns {Promise<void>}
 */
const handleContinue = async () => {
  if (!selectedViewType.value) return;
  await navigateTo({
    path: `/config/new/${selectedViewType.value}`,
    query: selectedPrimary.value
      ? { primary: selectedPrimary.value }
      : undefined,
  });
};

useHead({
  title: "GuardianConnector Explorer: " + t("addNewTable"),
});

definePageMeta({ layout: "explorer" });
</script>

<template>
  <div class="max-w-3xl mx-auto p-3 sm:p-6 w-full">
    <NuxtLink
      to="/config"
      class="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 font-medium mb-4 transition-colors"
    >
      <ChevronLeft class="w-5 h-5" />
      {{ $t("datasetViewManagement") }}
    </NuxtLink>

    <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
      {{ $t("addNewTable") }}
    </h1>
    <p class="text-gray-600 mb-8">{{ $t("createViewTypeDescription") }}</p>

    <DataLoadError
      v-if="error"
      :title="$t('dataLoadErrorTitle')"
      :message="$t('dataLoadErrorMessage')"
      :retry="() => refresh()"
    />

    <template v-else>
      <fieldset class="mb-8">
        <legend class="text-sm font-medium text-gray-700 mb-3">
          {{ $t("selectViewType") }}
        </legend>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            v-for="option in VIEW_TYPE_OPTIONS"
            :key="option.type"
            type="button"
            :data-testid="`create-view-type-${option.type}`"
            class="flex flex-col items-start gap-3 p-5 rounded-lg border-2 text-left transition-colors"
            :class="
              selectedViewType === option.type
                ? 'border-violet-600 bg-violet-50'
                : 'border-gray-200 hover:border-violet-300 bg-white'
            "
            @click="selectedViewType = option.type"
          >
            <component :is="option.icon" class="w-8 h-8 text-violet-700" />
            <span class="font-semibold text-gray-900">{{
              $t(option.type)
            }}</span>
            <span class="text-sm text-gray-600">{{
              $t(option.descriptionKey)
            }}</span>
          </button>
        </div>
      </fieldset>

      <div class="mb-8">
        <label
          for="create-primary-dataset"
          class="block text-sm font-medium text-gray-700 mb-2"
        >
          {{ $t("primaryDatasetOptional") }}
        </label>
        <select
          id="create-primary-dataset"
          v-model="selectedPrimary"
          data-testid="create-primary-select"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
        >
          <option value="">{{ $t("selectPrimaryDatasetOptional") }}</option>
          <option v-for="table in availableTables" :key="table" :value="table">
            {{ table }}
          </option>
        </select>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="create-view-continue"
          :disabled="!selectedViewType"
          class="px-6 py-3 font-medium rounded-lg transition-colors"
          :class="
            selectedViewType
              ? 'bg-violet-700 hover:bg-violet-800 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          "
          @click="handleContinue"
        >
          {{ $t("continue") }}
        </button>
        <NuxtLink
          to="/config"
          data-testid="create-view-cancel"
          class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
        >
          {{ $t("cancel") }}
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
