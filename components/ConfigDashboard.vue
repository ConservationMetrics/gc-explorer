<script setup lang="ts">
import type { ViewConfigRow, ViewType } from "@/types";
import { CONFIG_LIMITS } from "@/utils";
import SearchBar from "@/components/shared/SearchBar.vue";
import ViewTypeFilter from "@/components/shared/ViewTypeFilter.vue";
import { matchesSearchQuery, matchesViewTypeFilter } from "@/utils/viewFilters";
import {
  ChevronLeft,
  Images,
  Map,
  Pencil,
  Plus,
  TriangleAlert,
} from "lucide-vue-next";

const props = defineProps<{
  viewRows: ViewConfigRow[];
}>();

const route = useRoute();
const router = useRouter();

const sortedViewsConfig = computed(() => {
  return [...props.viewRows].sort((first, second) => {
    return `${first.viewName}-${first.viewType}`.localeCompare(
      `${second.viewName}-${second.viewType}`,
    );
  });
});

const availableViewTypes = computed<ViewType[]>(() => {
  const types = new Set<ViewType>();
  sortedViewsConfig.value.forEach((row) => {
    types.add(row.viewType);
  });
  return Array.from(types).sort();
});

const activeViewFilter = ref<string>(
  typeof route.query.view === "string" ? route.query.view : "all",
);

watch(activeViewFilter, (value) => {
  const query = { ...route.query };
  if (value === "all") {
    delete query.view;
  } else {
    query.view = value;
  }
  router.replace({ path: route.path, query });
});

const searchQuery = ref<string>(
  typeof route.query.q === "string" ? route.query.q : "",
);

watch(searchQuery, (value) => {
  const query = { ...route.query };
  if (value) {
    query.q = value;
  } else {
    delete query.q;
  }
  router.replace({ path: route.path, query });
});

const filteredViewsConfig = computed(() => {
  return sortedViewsConfig.value.filter(
    (row) =>
      matchesViewTypeFilter(activeViewFilter.value, row.viewType) &&
      matchesSearchQuery(searchQuery.value, row.viewName, row.primaryDataset),
  );
});

/**
 * Truncates the display name if it exceeds the character limit
 *
 * @param {string} name - The display name to truncate
 * @returns {string} The truncated display name with ellipsis if needed
 */
const truncateDisplayName = (name: string): string => {
  if (!name) return "";
  return name.length > CONFIG_LIMITS.DATASET_TABLE
    ? name.substring(0, CONFIG_LIMITS.DATASET_TABLE) + "..."
    : name;
};

/**
 * Truncates the description if it exceeds the character limit
 *
 * @param {string} desc - The description to truncate
 * @returns {string} The truncated description with ellipsis if needed
 */
const truncateDescription = (desc: string): string => {
  if (!desc) return "";
  return desc.length > CONFIG_LIMITS.VIEW_DESCRIPTION
    ? desc.substring(0, CONFIG_LIMITS.VIEW_DESCRIPTION) + "..."
    : desc;
};
</script>

<template>
  <div class="max-w-7xl mx-auto p-3 sm:p-6 w-full">
    <div class="mb-6 sm:mb-8">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 font-medium mb-4 transition-colors"
      >
        <ChevronLeft class="w-5 h-5" />
        {{ $t("availableViews") }}
      </NuxtLink>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        {{ $t("datasetViewManagement") }}
      </h1>
    </div>

    <SearchBar
      v-if="sortedViewsConfig.length"
      v-model="searchQuery"
      :placeholder="$t('searchDatasets')"
    />

    <div
      v-if="sortedViewsConfig.length"
      class="flex flex-wrap items-center justify-between gap-3 mb-4"
    >
      <ViewTypeFilter
        v-model="activeViewFilter"
        :view-types="availableViewTypes"
      />
      <NuxtLink
        to="/config/new"
        data-testid="add-new-dataset-view-button"
        class="flex items-center gap-2 px-4 py-2 sm:py-3 bg-violet-700 hover:bg-violet-800 text-white font-medium rounded-lg transition-colors duration-200"
      >
        <Plus class="w-5 h-5" />
        {{ $t("addNewTable") }}
      </NuxtLink>
    </div>

    <div
      v-if="filteredViewsConfig.length"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch mb-6"
    >
      <div
        v-for="row in filteredViewsConfig"
        :key="row.viewId"
        data-testid="config-dataset-card"
        class="bg-violet-50 rounded-lg p-4 sm:p-6 shadow-sm border border-violet-100 overflow-hidden flex flex-col h-full"
      >
        <div class="flex items-start mb-3">
          <div
            class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-violet-200 flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3 flex-shrink-0"
          >
            {{ String(row.primaryDataset).charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0 max-w-full overflow-hidden">
            <h2
              class="text-lg sm:text-xl font-semibold text-gray-800 break-words max-w-full mb-2"
              style="
                overflow-wrap: anywhere;
                word-break: break-word;
                hyphens: auto;
              "
            >
              {{ truncateDisplayName(row.viewName) }}
            </h2>
            <div class="h-10 mb-4">
              <p
                v-if="row.viewConfig.VIEW_DESCRIPTION"
                class="text-sm sm:text-base text-gray-600 line-clamp-2"
                style="
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "
              >
                {{ truncateDescription(row.viewConfig.VIEW_DESCRIPTION) }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 mb-4 overflow-hidden">
          <span
            :data-testid="`config-view-tag-${row.viewType}`"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-violet-100 text-violet-800 rounded-full flex-shrink-0"
          >
            <Map v-if="row.viewType === 'map'" class="w-3 h-3" />
            <Images v-else-if="row.viewType === 'gallery'" class="w-3 h-3" />
            <TriangleAlert
              v-else-if="row.viewType === 'alerts'"
              class="w-3 h-3"
            />
            {{ $t(row.viewType) }}
          </span>
        </div>

        <NuxtLink
          :to="{
            path: `/config/${row.primaryDataset}`,
            query: { view_type: row.viewType },
          }"
          data-testid="edit-dataset-view-link"
          class="mt-auto flex items-center justify-center gap-2 w-full text-center px-4 py-2 sm:py-3 bg-violet-700 hover:bg-violet-800 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <Pencil class="w-4 h-4" />
          {{ $t("editDataset") }}
        </NuxtLink>
      </div>
    </div>

    <div v-else-if="sortedViewsConfig.length" class="text-center py-12 mb-6">
      <p class="text-gray-500 text-sm sm:text-base">
        {{ $t("noResultsFound") }}
      </p>
    </div>

    <div v-else-if="!sortedViewsConfig.length" class="flex justify-end mb-6">
      <NuxtLink
        to="/config/new"
        data-testid="add-new-dataset-view-button"
        class="flex items-center gap-2 px-4 py-2 sm:py-3 bg-violet-700 hover:bg-violet-800 text-white font-medium rounded-lg transition-colors duration-200"
      >
        <Plus class="w-5 h-5" />
        {{ $t("addNewTable") }}
      </NuxtLink>
    </div>
  </div>
</template>
