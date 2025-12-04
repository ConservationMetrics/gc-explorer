<script setup lang="ts">
import type { Views, ViewConfig, User } from "@/types/types";
import { Role } from "@/types/types";
import AppHeader from "@/components/shared/AppHeader.vue";
import ViewCard from "@/components/dataset/ViewCard.vue";

const route = useRoute();
const tableRaw = route.params.tablename;
const tableName = Array.isArray(tableRaw)
  ? tableRaw.join("/")
  : String(tableRaw);

const viewsConfig = ref<Views>({});
const datasetConfig = ref<ViewConfig | null>(null);
const dataFetched = ref(false);

const {
  public: { appApiKey, authStrategy },
} = useRuntimeConfig();

const { loggedIn, user } = useUserSession();
const { t } = useI18n();

const headers = {
  "x-api-key": appApiKey,
};

const { data, error } = await useFetch("/api/config", {
  headers,
});

if (data.value && !error.value) {
  const fetchedViewsData = data.value[0] as Views;
  viewsConfig.value = fetchedViewsData;

  // Get the specific dataset config
  if (fetchedViewsData[tableName]) {
    datasetConfig.value = fetchedViewsData[tableName];
    dataFetched.value = true;
  } else {
    // Try to find by matching keys (in case of URL encoding issues)
    const matchingKey = Object.keys(fetchedViewsData).find(
      (key) =>
        key === tableName ||
        decodeURIComponent(key) === tableName ||
        key === decodeURIComponent(tableName),
    );
    if (matchingKey) {
      datasetConfig.value = fetchedViewsData[matchingKey];
      dataFetched.value = true;
    } else {
      // Dataset not found, redirect to index
      console.warn(`Dataset "${tableName}" not found in config`);
      await navigateTo("/");
    }
  }
} else {
  console.error("Error fetching data:", error.value);
}

// Check if user has permission to view this dataset
const canViewDataset = computed(() => {
  if (!datasetConfig.value) return false;

  // Skip permission check in CI environment
  if (process.env.CI) return true;

  const config = datasetConfig.value;
  const typedUser = user.value as User | null;
  const userRole = typedUser?.userRole ?? Role.SignedIn;

  // Check permission level
  if (config.ROUTE_LEVEL_PERMISSION === "guest" && userRole < Role.Guest) {
    return false;
  }
  if (config.ROUTE_LEVEL_PERMISSION === "member" && userRole < Role.Member) {
    return false;
  }
  if (config.ROUTE_LEVEL_PERMISSION === "admin" && userRole < Role.Admin) {
    return false;
  }
  // base case for when ROUTE_LEVEL_PERMISSION is undefined
  if (config.ROUTE_LEVEL_PERMISSION === undefined && userRole < Role.SignedIn) {
    return false;
  }

  return true;
});

// Get enabled views for this dataset
const enabledViews = computed(() => {
  if (!datasetConfig.value?.VIEWS) return [];
  return datasetConfig.value.VIEWS.split(",").map((v) => v.trim());
});

// Get display name
const displayName = computed(() => {
  return (
    datasetConfig.value?.DATASET_TABLE ||
    String(tableName).charAt(0).toUpperCase() +
      String(tableName).slice(1).replace(/_/g, " ")
  );
});

// Get description
const description = computed(() => {
  return datasetConfig.value?.VIEW_DESCRIPTION || "";
});

// Get header image
const headerImage = computed(() => {
  return datasetConfig.value?.VIEW_HEADER_IMAGE || "";
});

// Check if user is admin
const isAdmin = computed(() => {
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

useHead({
  title: `${displayName.value} - GuardianConnector Explorer`,
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <AppHeader />

    <main v-if="dataFetched && canViewDataset" class="w-full">
      <!-- Header Image with Dataset Name Overlay -->
      <div
        v-if="headerImage"
        class="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden"
      >
        <img
          :src="headerImage"
          :alt="displayName"
          class="w-full h-full object-cover"
        />
        <div
          class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 sm:p-8"
        >
          <h1
            class="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2"
          >
            {{ displayName }}
          </h1>
        </div>
      </div>

      <!-- Fallback Header (no image) -->
      <div
        v-else
        class="w-full bg-gradient-to-r from-purple-100 to-purple-50 p-6 sm:p-8"
      >
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          {{ displayName }}
        </h1>
      </div>

      <!-- Description -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <p
          v-if="description"
          class="text-base sm:text-lg text-gray-700 leading-relaxed"
        >
          {{ description }}
        </p>
        <!-- Fallback description message -->
        <div v-else class="text-base sm:text-lg text-gray-500 italic">
          <span>{{ $t("noDescriptionProvidedYet") }}</span>
          <NuxtLink
            v-if="isAdmin"
            :to="`/config/${tableName}`"
            class="ml-1 text-purple-600 hover:text-purple-800 underline"
          >
            {{ $t("addDescription") }}
          </NuxtLink>
          <span v-else class="ml-1">
            {{ $t("contactAdminToAddDescription") }}
          </span>
        </div>
      </div>

      <!-- View Cards Grid -->
      <div
        v-if="enabledViews.length > 0"
        class="max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12"
      >
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <ViewCard
            v-for="view in enabledViews"
            :key="view"
            :view="view"
            :table-name="tableName"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p class="text-gray-500 text-sm sm:text-base">
          {{
            $t("noDatasetViewsAvailable") ||
            "No views available for this dataset"
          }}
        </p>
      </div>
    </main>

    <!-- Unauthorized or Not Found -->
    <div
      v-else-if="dataFetched && !canViewDataset"
      class="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center"
    >
      <p class="text-gray-500 text-sm sm:text-base">
        {{ $t("accessDeniedMessage") }}
      </p>
    </div>
  </div>
</template>
