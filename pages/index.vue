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
 * Applies search filtering on the permission-filtered config.
 * Matches case-insensitively against display name (DATASET_TABLE or key) and description.
 *
 * @returns {Views} The search-filtered views config object.
 */
const searchedViewsConfig = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return filteredSortedViewsConfig.value;

  return Object.keys(filteredSortedViewsConfig.value)
    .filter((key) => {
      const config = filteredSortedViewsConfig.value[key];
      const displayName = (config.DATASET_TABLE || key).toLowerCase();
      const description = (config.VIEW_DESCRIPTION || "").toLowerCase();
      return displayName.includes(q) || description.includes(q);
    })
    .reduce((acc: Views, key: string) => {
      acc[key] = filteredSortedViewsConfig.value[key];
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

      <!-- Manage Datasets Button - Right above cards on RHS -->
      <div
        v-if="shouldShowConfigLink && viewsConfig"
        class="flex justify-end mb-4"
      >
        <a
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
