<script setup lang="ts">
import type { Views, User } from "@/types/types";
import LanguagePicker from "@/components/shared/LanguagePicker.vue";

const viewsConfig = ref<Views>({});

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
} else {
  console.error("Error fetching data:", error.value);
}

/** Filter and sort the views config */
const filteredSortedViewsConfig = computed(() => {
  return Object.keys(viewsConfig.value)
    .filter((key) => Object.keys(viewsConfig.value[key]).length > 0)
    .sort()
    .reduce((accumulator: Views, key: string) => {
      accumulator[key] = viewsConfig.value[key];
      return accumulator;
    }, {});
});

// Check if user should see config link
const shouldShowConfigLink = computed(() => {
  if (authStrategy === "none") {
    return true;
  }

  if (authStrategy === "auth0" && loggedIn.value && user.value) {
    const typedUser = user.value as User;
    const userRoles = typedUser.roles || [];
    return userRoles.some((role: { name: string }) => role.name === "Admin");
  }

  return false;
});

useHead({
  title: "GuardianConnector Explorer",
});
</script>

<template>
  <div class="container flex flex-col items-center mt-8 relative">
    <div class="absolute top-0 right-0 flex justify-end space-x-4 mb-4">
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
    <div v-if="viewsConfig" class="w-1/2">
      <div
        v-for="(config, tableName) in filteredSortedViewsConfig"
        :key="tableName"
        class="table-item bg-gray-100 rounded p-4 mb-4"
      >
        <h2 class="text-gray-800 mb-2">
          <strong>{{ $t("table") }}:</strong> {{ tableName }}
        </h2>
        <ul class="list-none p-0">
          <li
            v-for="view in config.VIEWS ? config.VIEWS.split(',') : []"
            :key="view"
            class="mb-2"
          >
            <NuxtLink
              :to="`/${view}/${tableName}`"
              class="text-blue-500 no-underline hover:text-blue-700 hover:underline"
              >{{ $t(view) }}</NuxtLink
            >
          </li>
        </ul>
      </div>
    </div>

    <!-- Config Link for Admins or when auth is disabled -->
    <div v-if="shouldShowConfigLink" class="w-1/2">
      <div class="table-item bg-gray-100 rounded p-4 mb-4">
        <h2 class="text-gray-800 mb-2">
          <strong>{{ $t("administration") || "Administration" }}:</strong>
        </h2>
        <ul class="list-none p-0">
          <li class="mb-2">
            <NuxtLink
              to="/config"
              class="text-blue-500 no-underline hover:text-blue-700 hover:underline"
            >
              {{ $t("config") || "Configuration" }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
