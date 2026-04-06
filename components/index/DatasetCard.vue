<script setup lang="ts">
import type { ViewConfig } from "@/types";
import { formatDisplayName, CONFIG_LIMITS } from "@/utils";
import { faImages, faMap, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

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
  if (process.env.CI) return null;

  const permission = props.config.ROUTE_LEVEL_PERMISSION;

  if (permission) {
    return formatDisplayName(permission);
  }

  return null;
};

/**
 * Truncates the display name if it exceeds the character limit
 *
 * @param {string} name - The display name to truncate
 * @returns {string} The truncated display name with ellipsis if needed
 */
const truncateDisplayName = (name: string): string => {
  if (!name) return "";
  return name.length > CONFIG_LIMITS.DATASET_TABLE
    ? name.substring(0, CONFIG_LIMITS.DATASET_TABLE) + "..."
    : name;
};

/**
 * Truncates the description if it exceeds the character limit
 *
 * @param {string} desc - The description to truncate
 * @returns {string} The truncated description with ellipsis if needed
 */
const truncateDescription = (desc: string): string => {
  if (!desc) return "";
  return desc.length > CONFIG_LIMITS.VIEW_DESCRIPTION
    ? desc.substring(0, CONFIG_LIMITS.VIEW_DESCRIPTION) + "..."
    : desc;
};
</script>

<template>
  <div
    data-testid="dataset-card"
    class="bg-purple-50 rounded-lg p-4 sm:p-6 shadow-sm border border-purple-100 overflow-hidden flex flex-col h-full"
  >
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
          {{ truncateDisplayName(config.DATASET_TABLE || String(tableName)) }}
        </h2>
        <div class="h-10 mb-4">
          <p
            v-if="config.VIEW_DESCRIPTION"
            class="text-sm sm:text-base text-gray-600 line-clamp-2"
            style="
              display: -webkit-box;
              -webkit-line-clamp: 2;
              line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              text-overflow: ellipsis;
            "
          >
            {{ truncateDescription(config.VIEW_DESCRIPTION) }}
          </p>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-1.5 mb-4 overflow-hidden">
      <span
        v-for="view in config.VIEWS
          ? config.VIEWS.split(',')
              .map((v) => v.trim())
              .sort()
          : []"
        :key="view"
        :data-testid="`view-tag-${view}`"
        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex-shrink-0"
      >
        <FontAwesomeIcon
          v-if="view === 'map'"
          :icon="faMap"
          class="w-3 h-3"
        />
        <FontAwesomeIcon
          v-else-if="view === 'gallery'"
          :icon="faImages"
          class="w-3 h-3"
        />
        <FontAwesomeIcon
          v-else-if="view === 'alerts'"
          :icon="faTriangleExclamation"
          class="w-3 h-3"
        />
        {{ $t(view) }}
      </span>
    </div>

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

    <NuxtLink
      :to="`/dataset/${String(tableName)}`"
      data-testid="open-dataset-view-link"
      class="mt-auto block w-full text-center px-4 py-2 sm:py-3 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-lg transition-colors duration-200"
    >
      {{ $t("openProject") }}
    </NuxtLink>
  </div>
</template>
