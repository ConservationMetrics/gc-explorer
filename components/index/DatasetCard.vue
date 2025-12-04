<script setup lang="ts">
import type { ViewConfig } from "@/types/types";
import { formatDisplayName } from "@/utils/index";

interface Props {
  tableName: string | number;
  config: ViewConfig;
}

const props = defineProps<Props>();

/**
 * Gets the formatted permission level for a table to display in the UI
 * Returns null in CI environment, otherwise shows all permission levels
 *
 * @returns {string | null} The formatted permission level or null if not applicable
 */
const getPermissionLevel = () => {
  // No restrictions in CI environment
  if (process.env.CI) return null;

  const permission = props.config.ROUTE_LEVEL_PERMISSION;

  // Show pill for all permission levels
  if (permission) {
    return formatDisplayName(permission);
  }

  return null;
};
</script>

<template>
  <div
    class="bg-purple-50 rounded-lg p-4 sm:p-6 shadow-sm border border-purple-100 overflow-hidden"
  >
    <!-- Card Icon/Initial -->
    <div class="flex items-start mb-3">
      <div
        class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-200 flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3 flex-shrink-0"
      >
        {{ String(tableName).charAt(0).toUpperCase() }}
      </div>
      <div class="flex-1 min-w-0 max-w-full overflow-hidden">
        <h2
          class="text-lg sm:text-xl font-semibold text-gray-800 break-words max-w-full mb-2"
          style="overflow-wrap: anywhere; word-break: break-word; hyphens: auto"
        >
          {{ config.DATASET_TABLE || String(tableName) }}
        </h2>
        <p
          v-if="config.VIEW_DESCRIPTION"
          class="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2"
        >
          {{ config.VIEW_DESCRIPTION }}
        </p>
      </div>
    </div>

    <!-- View Pills -->
    <div class="flex flex-wrap gap-1.5 mb-4 overflow-hidden">
      <span
        v-for="view in config.VIEWS ? config.VIEWS.split(',') : []"
        :key="view"
        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex-shrink-0"
      >
        <!-- Map Icon -->
        <svg
          v-if="view === 'map'"
          class="w-3 h-3"
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
          class="w-3 h-3"
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
          class="w-3 h-3"
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
      </span>
    </div>

    <!-- Permission Level -->
    <div v-if="getPermissionLevel()" class="flex items-center gap-2 mb-4">
      <span class="text-sm text-gray-600 font-medium">
        {{ $t("permissionLevel") }}:
      </span>
      <span
        class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 whitespace-nowrap"
      >
        {{ getPermissionLevel() }}
      </span>
    </div>

    <!-- Open Project Button -->
    <NuxtLink
      :to="`/dataset/${String(tableName)}`"
      class="block w-full text-center px-4 py-2 sm:py-3 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-lg transition-colors duration-200"
    >
      {{ $t("openProject") }}
    </NuxtLink>
  </div>
</template>
