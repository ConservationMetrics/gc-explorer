<script setup lang="ts">
import type { Views, User } from "@/types/types";
import { Role } from "@/types/types";
import LanguagePicker from "@/components/shared/LanguagePicker.vue";

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
  const userRole = typedUser?.userRole || Role.Viewer;

  return Object.keys(viewsConfig.value)
    .filter((key) => {
      const config = viewsConfig.value[key];
      // Filter out empty configs
      if (Object.keys(config).length === 0) return false;

      // Filter views based on user role and permission level
      // Hide view if user role is lower than what's required
      if (
        config.ROUTE_LEVEL_PERMISSION === "member" &&
        userRole < Role.Member
      ) {
        return false;
      }
      if (config.ROUTE_LEVEL_PERMISSION === "admin" && userRole < Role.Admin) {
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

// Helper function to check if a view is restricted and apply the icon
const isViewRestricted = (tableName: string) => {
  // No restrictions in CI environment
  if (process.env.CI) return false;

  if (!user.value) return false;
  const permission = viewsConfig.value[tableName]?.ROUTE_LEVEL_PERMISSION;
  const typedUser = user.value as User | null;
  const userRole = typedUser?.userRole || Role.Viewer;

  return (
    userRole >= Role.Member &&
    (permission === "member" || permission === "admin")
  );
};

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
    const userRole = typedUser?.userRole || Role.Viewer;
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
  <div class="container flex flex-col items-center mt-8 relative w-full">
    <div class="absolute top-0 right-4 flex justify-end space-x-4 mb-4">
      <LanguagePicker />
    </div>
    <img
      src="/gcexplorer.png"
      alt="Guardian Connector Explorer Logo"
      class="w-48 h-auto mb-4 mx-auto"
      loading="eager"
    />
    <h1 class="text-4xl font-black text-gray-800 mb-4">
      {{ $t("availableViews") }}
    </h1>
    <div class="w-1/2">
      <!-- Config Link for Admins or when auth is disabled -->
      <div v-if="shouldShowConfigLink" class="flex justify-center mt-4 mb-4">
        <a
          href="/config"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-colors duration-200"
        >
          {{ $t("config") || "Configuration" }}
        </a>
        <!-- NuxtLink messes up the layout, hence the use of a regular anchor tag -->
      </div>

      <div v-if="viewsConfig" class="w-full">
        <div
          v-for="(config, tableName) in filteredSortedViewsConfig"
          :key="tableName"
          class="table-item bg-gray-100 rounded p-4 mb-4 w-full"
        >
          <h2 class="text-gray-800 mb-2 flex items-center gap-2">
            {{ tableName }}
            <span
              v-if="isViewRestricted(String(tableName))"
              class="text-gray-600"
              title="Restricted view - requires Member or Admin access"
            >
              🔒
            </span>
          </h2>
          <ul class="list-none p-0">
            <li
              v-for="view in config.VIEWS ? config.VIEWS.split(',') : []"
              :key="view"
              class="mb-2"
            >
              <NuxtLink
                :to="`/${view}/${tableName}`"
                class="text-blue-500 no-underline hover:text-blue-700 hover:underline flex items-center gap-2"
              >
                <!-- Map Icon -->
                <svg
                  v-if="view === 'map'"
                  class="w-4 h-4"
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
                  class="w-4 h-4"
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
                  class="w-4 h-4"
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
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
