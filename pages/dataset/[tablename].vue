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
const isTitleExpanded = ref(false);
const isDescriptionExpanded = ref(false);

const {
  public: { appApiKey, authStrategy },
} = useRuntimeConfig();

const { loggedIn, user } = useUserSession();

const headers = {
  "x-api-key": appApiKey,
};

const { data, error } = await useFetch("/api/config", {
  headers,
});

if (data.value && !error.value) {
  const fetchedViewsData = data.value[0] as Views;
  viewsConfig.value = fetchedViewsData;

  if (fetchedViewsData[tableName]) {
    datasetConfig.value = fetchedViewsData[tableName];
    dataFetched.value = true;
  } else {
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
      console.warn(`Dataset "${tableName}" not found in config`);
      await navigateTo("/");
    }
  }
} else {
  console.error("Error fetching data:", error.value);
}

const canViewDataset = computed(() => {
  if (!datasetConfig.value) return false;

  if (process.env.CI) return true;

  const config = datasetConfig.value;
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
});

const enabledViews = computed(() => {
  if (!datasetConfig.value?.VIEWS) return [];
  return datasetConfig.value.VIEWS.split(",").map((v) => v.trim());
});

const PAGE_TITLE_LIMIT = 70;
const PAGE_DESCRIPTION_LIMIT = 300;

const fullDisplayName = computed(() => {
  return (
    datasetConfig.value?.DATASET_TABLE ||
    String(tableName).charAt(0).toUpperCase() +
      String(tableName).slice(1).replace(/_/g, " ")
  );
});

const isTitleTruncated = computed(() => {
  return fullDisplayName.value.length > PAGE_TITLE_LIMIT;
});

const displayName = computed(() => {
  if (isTitleExpanded.value || !isTitleTruncated.value) {
    return fullDisplayName.value;
  }
  return fullDisplayName.value.substring(0, PAGE_TITLE_LIMIT) + "...";
});

const fullDescription = computed(() => {
  return datasetConfig.value?.VIEW_DESCRIPTION || "";
});

const isDescriptionTruncated = computed(() => {
  return fullDescription.value.length > PAGE_DESCRIPTION_LIMIT;
});

const description = computed(() => {
  if (isDescriptionExpanded.value || !isDescriptionTruncated.value) {
    return fullDescription.value;
  }
  return fullDescription.value.substring(0, PAGE_DESCRIPTION_LIMIT) + "...";
});

const headerImage = computed(() => {
  return datasetConfig.value?.VIEW_HEADER_IMAGE || "";
});

const isAdmin = computed(() => {
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
  title: `${fullDisplayName.value} - GuardianConnector Explorer`,
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <AppHeader />

    <main v-if="dataFetched && canViewDataset" class="w-full">
      <div class="w-5/6 mx-auto mb-4 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {{ $t("availableViews") }}
        </NuxtLink>
        <NuxtLink
          v-if="isAdmin"
          :to="`/config/${tableName}`"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {{ $t("editConfiguration") }}
        </NuxtLink>
      </div>

      <div
        v-if="headerImage"
        data-testid="dataset-header-with-image"
        class="relative w-5/6 mx-auto overflow-hidden rounded-xl"
      >
        <div class="relative h-64 sm:h-80 md:h-96">
          <img
            :src="headerImage"
            :alt="displayName"
            class="w-full h-full object-cover"
          />
          <div
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 sm:p-8"
          >
            <div class="flex items-start gap-2">
              <h1
                class="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 break-words flex-1"
                style="
                  overflow-wrap: anywhere;
                  word-break: break-word;
                  hyphens: auto;
                "
              >
                {{ displayName }}
              </h1>
              <button
                v-if="isTitleTruncated"
                class="text-white/80 hover:text-white text-sm font-medium underline flex-shrink-0 mt-1"
                @click="isTitleExpanded = !isTitleExpanded"
              >
                {{ isTitleExpanded ? "Show less" : "Show more" }}
              </button>
            </div>
          </div>
        </div>

        <div class="relative p-6 sm:p-8">
          <div class="mb-6 sm:mb-8">
            <div v-if="description || isDescriptionTruncated">
              <p class="text-base sm:text-lg text-gray-700 leading-relaxed">
                {{ description }}
              </p>
              <button
                v-if="isDescriptionTruncated"
                class="text-purple-600 hover:text-purple-800 text-sm font-medium underline mt-2"
                @click="isDescriptionExpanded = !isDescriptionExpanded"
              >
                {{ isDescriptionExpanded ? "Show less" : "Show more" }}
              </button>
            </div>
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
                Please contact an admin to add a description.
              </span>
            </div>
          </div>

          <div v-if="enabledViews.length > 0">
            <div
              data-testid="view-cards-container"
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

          <div v-else class="text-center py-8">
            <p class="text-gray-500 text-sm sm:text-base">
              {{
                $t("noDatasetViewsAvailable") ||
                "No views available for this dataset"
              }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-else
        data-testid="dataset-header-fallback"
        class="w-5/6 mx-auto bg-gradient-to-r from-purple-100 to-purple-50 rounded-xl overflow-hidden mt-4"
      >
        <div class="p-6 sm:p-8">
          <div class="flex items-start gap-2 mb-6 sm:mb-8">
            <h1
              class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 break-words flex-1"
              style="
                overflow-wrap: anywhere;
                word-break: break-word;
                hyphens: auto;
              "
            >
              {{ displayName }}
            </h1>
            <button
              v-if="isTitleTruncated"
              class="text-purple-600 hover:text-purple-800 text-sm font-medium underline flex-shrink-0 mt-1"
              @click="isTitleExpanded = !isTitleExpanded"
            >
              {{ isTitleExpanded ? "Show less" : "Show more" }}
            </button>
          </div>

          <div class="mb-6 sm:mb-8">
            <div v-if="description || isDescriptionTruncated">
              <p class="text-base sm:text-lg text-gray-700 leading-relaxed">
                {{ description }}
              </p>
              <button
                v-if="isDescriptionTruncated"
                class="text-purple-600 hover:text-purple-800 text-sm font-medium underline mt-2"
                @click="isDescriptionExpanded = !isDescriptionExpanded"
              >
                {{ isDescriptionExpanded ? "Show less" : "Show more" }}
              </button>
            </div>
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
                Please contact an admin to add a description.
              </span>
            </div>
          </div>

          <div v-if="enabledViews.length > 0">
            <div
              data-testid="view-cards-container"
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

          <div v-else class="text-center py-8">
            <p class="text-gray-500 text-sm sm:text-base">
              {{
                $t("noDatasetViewsAvailable") ||
                "No views available for this dataset"
              }}
            </p>
          </div>
        </div>
      </div>
    </main>

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
