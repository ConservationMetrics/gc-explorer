<script setup lang="ts">
import { ref, computed } from "vue";
import { useHead, useFetch, useRuntimeConfig } from "#app";

// Refs to store the fetched data
const viewsConfig = ref([]);

// API request to fetch the data
const {
  public: { appApiKey },
} = useRuntimeConfig();
const headers = {
  "x-api-key": appApiKey,
};
const { data, error } = await useFetch("/api/config", {
  headers,
});

if (data.value && !error.value) {
  viewsConfig.value = data.value[0];
} else {
  console.error("Error fetching data:", error.value);
}

// Filter and sort the views config
const filteredSortedViewsConfig = computed(() => {
  return Object.keys(viewsConfig.value)
    .filter((key) => Object.keys(viewsConfig.value[key]).length > 0)
    .sort()
    .reduce((acc, key) => {
      acc[key] = viewsConfig.value[key];
      return acc;
    }, {});
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
          <li v-for="view in config.VIEWS.split(',')" :key="view" class="mb-2">
            <NuxtLink
              :to="`/${view}/${tableName}`"
              class="text-blue-500 no-underline hover:text-blue-700 hover:underline"
              >{{ $t(view) }}</NuxtLink
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
