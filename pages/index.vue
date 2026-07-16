<script setup lang="ts">
import type { ViewConfig, ViewConfigRow, ViewType, User } from "@/types";
import { Role } from "@/types";
import DataLoadError from "@/components/shared/DataLoadError.vue";
import EmptyStateIllustration from "@/components/shared/EmptyStateIllustration.vue";
import SearchBar from "@/components/shared/SearchBar.vue";
import ViewTypeFilter from "@/components/shared/ViewTypeFilter.vue";
import DatasetCard from "@/components/index/DatasetCard.vue";
import { matchesSearchQuery, matchesViewTypeFilter } from "@/utils/viewFilters";

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
 * Permission-filtered view rows, one card per view (not grouped by dataset).
 * Sorted by view name then type, matching the config dashboard.
 *
 * @returns {ViewConfigRow[]} Accessible views ready for filtering and display.
 */
const accessibleViews = computed<ViewConfigRow[]>(() => {
  return viewRows.value
    .filter((row) => canAccessConfig(row.viewConfig))
    .sort((first, second) =>
      `${first.viewName}-${first.viewType}`.localeCompare(
        `${second.viewName}-${second.viewType}`,
      ),
    );
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
 * All distinct view types present across the permission-filtered views.
 *
 * @returns {ViewType[]} Sorted array of unique view types (e.g. ["alerts", "gallery", "map"]).
 */
const availableViewTypes = computed<ViewType[]>(() => {
  const types = new Set<ViewType>();
  accessibleViews.value.forEach((row) => types.add(row.viewType));
  return Array.from(types).sort();
});

/**
 * Applies the active view-type filter on top of the already permission-filtered views.
 *
 * @returns {ViewConfigRow[]} Views whose type matches the active filter.
 */
const displayedViews = computed<ViewConfigRow[]>(() => {
  return accessibleViews.value.filter((row) =>
    matchesViewTypeFilter(activeViewFilter.value, row.viewType),
  );
});

/**
 * Applies search filtering on top of the view-type-filtered views.
 * Matches case-insensitively against view name, primary dataset, and description.
 *
 * @returns {ViewConfigRow[]} The search-filtered views.
 */
const searchedViews = computed<ViewConfigRow[]>(() => {
  return displayedViews.value.filter((row) =>
    matchesSearchQuery(
      searchQuery.value,
      row.viewName,
      row.primaryDataset,
      row.viewConfig.VIEW_DESCRIPTION,
    ),
  );
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
      <SearchBar v-model="searchQuery" :placeholder="$t('searchDatasets')" />

      <!-- View Type Filter & Manage Datasets -->
      <div
        v-if="accessibleViews.length"
        class="flex flex-wrap items-center justify-between gap-3 mb-4"
      >
        <ViewTypeFilter
          v-model="activeViewFilter"
          :view-types="availableViewTypes"
        />
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
        v-if="searchedViews.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch"
      >
        <DatasetCard
          v-for="row in searchedViews"
          :key="`${row.primaryDataset}-${row.viewType}`"
          :table-name="row.primaryDataset"
          :view-name="row.viewName"
          :config="row.viewConfig"
          :view-type="row.viewType"
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
