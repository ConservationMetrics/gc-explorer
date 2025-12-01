<script setup lang="ts">
import type { Views, User } from "@/types/types";
import { Role } from "@/types/types";
import AppHeader from "@/components/shared/AppHeader.vue";

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
        v-if="viewsConfig"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        <div
          v-for="(config, tableName) in filteredSortedViewsConfig"
          :key="tableName"
          class="bg-purple-50 rounded-lg p-4 sm:p-6 shadow-sm border border-purple-100"
        >
          <!-- Card Icon/Initial -->
          <div class="flex items-start mb-3">
            <div
              class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-200 flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3"
            >
              {{ String(tableName).charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <h2
                class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 truncate"
              >
                {{ tableName }}
              </h2>
              <!-- Description placeholder - to be populated with actual project descriptions -->
              <!-- <p class="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2">
              Description lorem ipsum dolor sit amet, consectetur adipiscing
              elit, sed do eiusmod tempor incididunt ut labore et dolore magna
              aliqua.
            </p> -->
            </div>
          </div>

          <!-- View Pills -->
          <div class="flex flex-wrap gap-2 mb-4">
            <NuxtLink
              v-for="view in config.VIEWS ? config.VIEWS.split(',') : []"
              :key="view"
              :to="`/${view}/${tableName}`"
              class="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors"
            >
              <!-- Map Icon -->
              <svg
                v-if="view === 'map'"
                class="w-3 h-3 sm:w-4 sm:h-4"
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
              <!-- Gallery Icon -->
              <svg
                v-else-if="view === 'gallery'"
                class="w-3 h-3 sm:w-4 sm:h-4"
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
              <!-- Alerts Icon -->
              <svg
                v-else-if="view === 'alerts'"
                class="w-3 h-3 sm:w-4 sm:h-4"
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
              {{ $t(view) }}
            </NuxtLink>
          </div>

          <!-- Open Project Button -->
          <a
            href="#"
            class="block w-full text-center px-4 py-2 sm:py-3 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-lg transition-colors duration-200 cursor-pointer"
          >
            {{ $t("openProject") }}
          </a>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <p class="text-gray-500 text-sm sm:text-base">
          {{ $t("noDatasetViewsAvailable") || "No dataset views available" }}
        </p>
      </div>
    </main>
  </div>
</template>
