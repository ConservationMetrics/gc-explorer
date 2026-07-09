<script setup lang="ts">
import type { ViewConfig, ViewConfigRow, ViewType, User } from "@/types";
import { Role } from "@/types";
import DataLoadError from "@/components/shared/DataLoadError.vue";
import EmptyStateIllustration from "@/components/shared/EmptyStateIllustration.vue";
import DatasetCard from "@/components/index/DatasetCard.vue";
import { Images, Map, Search, TriangleAlert } from "lucide-vue-next";

/** A dataset grouped from one or more view rows sharing the same primaryDataset. */
interface DatasetGroup {
  tableName: string;
  viewName: string;
  config: ViewConfig;
  viewTypes: ViewType[];
}

const viewRows = ref<ViewConfigRow[]>([]);
const availableTables = ref<string[]>([]);

const {
  public: { authStrategy },
} = useRuntimeConfig();

const { loggedIn, user } = useUserSession();
const { error: showErrorToast } = useToast();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const { data, error, refresh } = await useFetch("/api/config");

if (data.value && !error.value) {
  viewRows.value = data.value.views ?? [];
  availableTables.value = data.value.availableTables ?? [];
} else {
  console.error("Error fetching data:", error.value);
}

/**
 * Determines whether the current user may access a given view based on its route-level permission.
 *
 * @param {ViewConfig} config - The view config whose permission level is checked.
 * @returns {boolean} True when the user's role satisfies the config's permission requirement.
 */
const canAccessConfig = (config: ViewConfig) => {
  if (process.env.CI) return true;

  const typedUser = user.value as User | null;
  const userRole = typedUser?.userRole ?? Role.SignedIn;

  if (config.ROUTE_LEVEL_PERMISSION === "guest" && userRole < Role.Guest) {
    return false;
  }
  if (config.ROUTE_LEVEL_PERMISSION === "member" && userRole < Role.Member) {
    return false;
  }
  if (config.ROUTE_LEVEL_PERMISSION === "admin" && userRole < Role.Admin) {
    return false;
  }
  if (config.ROUTE_LEVEL_PERMISSION === undefined && userRole < Role.SignedIn) {
    return false;
  }

  return true;
};

/**
 * Groups permission-filtered view rows by their primaryDataset.
 * The first row's viewConfig is used as the representative config because dataset-level
 * display fields (DATASET_TABLE/VIEW_DESCRIPTION/ROUTE_LEVEL_PERMISSION) are shared.
 *
 * @returns {DatasetGroup[]} Datasets sorted by table name, each with deduped, sorted view types.
 */
const groupedDatasets = computed<DatasetGroup[]>(() => {
  const groups: Record<string, DatasetGroup> = {};

  viewRows.value
    .filter((row) => canAccessConfig(row.viewConfig))
    .forEach((row) => {
      const existing = groups[row.primaryDataset];
      if (existing) {
        if (!existing.viewTypes.includes(row.viewType)) {
          existing.viewTypes.push(row.viewType);
        }
      } else {
        groups[row.primaryDataset] = {
          tableName: row.primaryDataset,
          viewName: row.viewName || row.primaryDataset,
          config: row.viewConfig,
          viewTypes: [row.viewType],
        };
      }
    });

  return Object.values(groups)
    .map((group) => ({ ...group, viewTypes: [...group.viewTypes].sort() }))
    .sort((first, second) => first.tableName.localeCompare(second.tableName));
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

/**
 * All distinct view types present across the permission-filtered datasets.
 *
 * @returns {ViewType[]} Sorted array of unique view types (e.g. ["alerts", "gallery", "map"]).
 */
const availableViewTypes = computed<ViewType[]>(() => {
  const types = new Set<ViewType>();
  groupedDatasets.value.forEach((group) => {
    group.viewTypes.forEach((type) => types.add(type));
  });
  return Array.from(types).sort();
});

/**
 * Applies the active view-type filter on top of the already permission-filtered datasets.
 *
 * @returns {DatasetGroup[]} Datasets whose view types include the active filter.
 */
const displayedDatasets = computed<DatasetGroup[]>(() => {
  if (activeViewFilter.value === "all") {
    return groupedDatasets.value;
  }
  return groupedDatasets.value.filter((group) =>
    group.viewTypes.includes(activeViewFilter.value as ViewType),
  );
});

/**
 * Applies search filtering on top of the view-type-filtered datasets.
 * Matches case-insensitively against display name (DATASET_TABLE or table name) and description.
 *
 * @returns {DatasetGroup[]} The search-filtered datasets.
 */
const searchedDatasets = computed<DatasetGroup[]>(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return displayedDatasets.value;

  return displayedDatasets.value.filter((group) => {
    const displayName = group.viewName.toLowerCase();
    const description = (group.config.VIEW_DESCRIPTION || "").toLowerCase();
    return displayName.includes(q) || description.includes(q);
  });
});

// Check if user should see config link
const shouldShowConfigLink = computed(() => {
  // Show config link in CI environment
  if (process.env.CI) {
    return true;
  }

  if (authStrategy === "none") {
    return true;
  }

  if (authStrategy === "auth0" && loggedIn.value && user.value) {
    const typedUser = user.value as User | null;
    const userRole = typedUser?.userRole ?? Role.SignedIn;
    return userRole >= Role.Admin;
  }

  return false;
});

// Handle unauthorized access toast
onMounted(async () => {
  if (route.query.reason === "unauthorized") {
    // Small delay to ensure locale is loaded from session storage
    setTimeout(() => {
      showErrorToast(
        t("accessDenied"),
        t("accessDeniedMessage"),
        8000,
        "top-center",
      );
    }, 200);
    router.replace({ path: route.path, query: {} });
  }
});

useHead({
  title: "GuardianConnector Explorer",
});

definePageMeta({ layout: "explorer" });
</script>

<template>
  <main class="max-w-7xl mx-auto p-3 sm:p-6 w-full">
    <DataLoadError
      v-if="error"
      :title="$t('dataLoadErrorTitle')"
      :message="$t('dataLoadErrorMessage')"
      :retry="() => refresh()"
    />
    <template v-else>
      <!-- Page Title and Description -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {{ $t("availableViews") }}
        </h1>
      </div>

      <!-- Search Bar -->
      <div class="relative flex items-center mb-4">
        <Search
          class="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none"
        />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('searchDatasets')"
          class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
        />
      </div>

      <!-- View Type Filter & Manage Datasets -->
      <div
        v-if="groupedDatasets.length"
        class="flex flex-wrap items-center justify-between gap-3 mb-4"
      >
        <div class="flex flex-wrap gap-2">
          <button
            class="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors"
            :class="
              activeViewFilter === 'all'
                ? 'bg-violet-700 text-white border-violet-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            "
            @click="activeViewFilter = 'all'"
          >
            {{ $t("all") }}
          </button>
          <button
            v-for="viewType in availableViewTypes"
            :key="viewType"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors capitalize"
            :class="
              activeViewFilter === viewType
                ? 'bg-violet-700 text-white border-violet-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            "
            @click="activeViewFilter = viewType"
          >
            <Map v-if="viewType === 'map'" class="w-3.5 h-3.5" />
            <Images v-else-if="viewType === 'gallery'" class="w-3.5 h-3.5" />
            <TriangleAlert
              v-else-if="viewType === 'alerts'"
              class="w-3.5 h-3.5"
            />
            {{ $t(viewType) }}
          </button>
        </div>
        <!-- NuxtLink messes up the layout, hence the use of a regular anchor tag -->
        <a
          v-if="shouldShowConfigLink"
          href="/config"
          class="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
        >
          {{ $t("manageDatasets") }}
        </a>
      </div>

      <!-- Project Cards Grid -->
      <div
        v-if="searchedDatasets.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch"
      >
        <DatasetCard
          v-for="dataset in searchedDatasets"
          :key="dataset.tableName"
          :table-name="dataset.tableName"
          :view-name="dataset.viewName"
          :config="dataset.config"
          :view-types="dataset.viewTypes"
        />
      </div>

      <!-- No Results State -->
      <div v-else-if="searchQuery.trim()" class="text-center py-12">
        <EmptyStateIllustration variant="indexSearchNoResults" />
        <p class="text-gray-500 text-sm sm:text-base">
          {{ $t("noResultsFound") }}
        </p>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <EmptyStateIllustration variant="indexNoDatasets" />
        <p class="text-gray-500 text-sm sm:text-base">
          {{ $t("noDatasetViewsAvailable") || "No dataset views available" }}
        </p>
      </div>
    </template>
  </main>
</template>
