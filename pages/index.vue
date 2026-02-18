<script setup lang="ts">
import type { Views, User } from "@/types/types";
import { Role } from "@/types/types";
import AppHeader from "@/components/shared/AppHeader.vue";
import DatasetCard from "@/components/index/DatasetCard.vue";

const viewsConfig = ref<Views>({});

const {
  public: { appApiKey, authStrategy },
} = useRuntimeConfig();

const { loggedIn, user } = useUserSession();
const { error: showErrorToast } = useToast();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const headers = {
  "x-api-key": appApiKey,
};
const { data, error } = await useFetch("/api/config", {
  headers,
});

if (data.value && !error.value) {
  const fetchedViewsData = data.value[0] as Views;
  viewsConfig.value = fetchedViewsData;
} else {
  console.error("Error fetching data:", error.value);
}

/** Filter and sort the views config */
const filteredSortedViewsConfig = computed(() => {
  // Skip filtering in CI environment - show everything
  if (process.env.CI) {
    return Object.keys(viewsConfig.value)
      .filter((key) => {
        const config = viewsConfig.value[key];
        // Filter out empty configs
        return Object.keys(config).length > 0;
      })
      .sort()
      .reduce((accumulator: Views, key: string) => {
        accumulator[key] = viewsConfig.value[key];
        return accumulator;
      }, {});
  }

  const typedUser = user.value as User | null;
  const userRole = typedUser?.userRole ?? Role.SignedIn;

  return Object.keys(viewsConfig.value)
    .filter((key) => {
      const config = viewsConfig.value[key];
      // Filter out empty configs
      if (Object.keys(config).length === 0) return false;
      // Filter views based on user role and permission level
      // Hide view if user role is lower than what's required
      if (config.ROUTE_LEVEL_PERMISSION === "guest" && userRole < Role.Guest) {
        return false;
      }
      if (
        config.ROUTE_LEVEL_PERMISSION === "member" &&
        userRole < Role.Member
      ) {
        return false;
      }
      if (config.ROUTE_LEVEL_PERMISSION === "admin" && userRole < Role.Admin) {
        return false;
      }
      // base case for when ROUTE_LEVEL_PERMISSION is undefined i.e. it has never been set and user role is lower than SignedIn
      if (
        config.ROUTE_LEVEL_PERMISSION === undefined &&
        userRole < Role.SignedIn
      ) {
        return false;
      }

      return true;
    })
    .sort()
    .reduce((accumulator: Views, key: string) => {
      accumulator[key] = viewsConfig.value[key];
      return accumulator;
    }, {});
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
 * @returns {string[]} Sorted array of unique view type strings (e.g. ["alerts", "gallery", "map"]).
 */
const availableViewTypes = computed(() => {
  const types = new Set<string>();
  Object.values(filteredSortedViewsConfig.value).forEach((config) => {
    if (config.VIEWS) {
      config.VIEWS.split(",")
        .map((v) => v.trim())
        .forEach((v) => types.add(v));
    }
  });
  return Array.from(types).sort();
});

/**
 * Applies the active view-type filter on top of the already permission-filtered config.
 *
 * @returns {Views} The filtered views config object.
 */
const displayedViewsConfig = computed(() => {
  if (activeViewFilter.value === "all") {
    return filteredSortedViewsConfig.value;
  }
  return Object.keys(filteredSortedViewsConfig.value)
    .filter((key) => {
      const config = filteredSortedViewsConfig.value[key];
      if (!config.VIEWS) return false;
      const views = config.VIEWS.split(",").map((v) => v.trim());
      return views.includes(activeViewFilter.value);
    })
    .reduce((acc: Views, key: string) => {
      acc[key] = filteredSortedViewsConfig.value[key];
      return acc;
    }, {});
});

/**
 * Applies search filtering on top of the view-type-filtered config.
 * Matches case-insensitively against display name (DATASET_TABLE or key) and description.
 *
 * @returns {Views} The search-filtered views config object.
 */
const searchedViewsConfig = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return displayedViewsConfig.value;

  return Object.keys(displayedViewsConfig.value)
    .filter((key) => {
      const config = displayedViewsConfig.value[key];
      const displayName = (config.DATASET_TABLE || key).toLowerCase();
      const description = (config.VIEW_DESCRIPTION || "").toLowerCase();
      return displayName.includes(q) || description.includes(q);
    })
    .reduce((acc: Views, key: string) => {
      acc[key] = displayedViewsConfig.value[key];
      return acc;
    }, {});
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
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <AppHeader />

    <main class="max-w-7xl mx-auto p-3 sm:p-6 w-full">
      <!-- Page Title and Description -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {{ $t("availableViews") }}
        </h1>
      </div>

      <!-- Search Bar -->
      <div class="relative flex items-center mb-4">
        <svg
          class="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('searchDatasets')"
          class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        />
      </div>

      <!-- View Type Filter & Manage Datasets -->
      <div
        v-if="viewsConfig"
        class="flex flex-wrap items-center justify-between gap-3 mb-4"
      >
        <div class="flex flex-wrap gap-2">
          <button
            class="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors"
            :class="
              activeViewFilter === 'all'
                ? 'bg-purple-700 text-white border-purple-700'
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
                ? 'bg-purple-700 text-white border-purple-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            "
            @click="activeViewFilter = viewType"
          >
            <svg
              v-if="viewType === 'map'"
              class="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else-if="viewType === 'gallery'"
              class="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else-if="viewType === 'alerts'"
              class="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
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
        v-if="viewsConfig && Object.keys(searchedViewsConfig).length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch"
      >
        <DatasetCard
          v-for="(config, tableName) in searchedViewsConfig"
          :key="tableName"
          :table-name="tableName"
          :config="config"
        />
      </div>

      <!-- No Results State -->
      <div
        v-else-if="viewsConfig && searchQuery.trim()"
        class="text-center py-12"
      >
        <p class="text-gray-500 text-sm sm:text-base">
          {{ $t("noResultsFound") }}
        </p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!viewsConfig" class="text-center py-12">
        <p class="text-gray-500 text-sm sm:text-base">
          {{ $t("noDatasetViewsAvailable") || "No dataset views available" }}
        </p>
      </div>
    </main>
  </div>
</template>
