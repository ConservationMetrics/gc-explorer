<script setup lang="ts">
import type { ViewConfig, ViewType } from "@/types";
import { formatDisplayName, CONFIG_LIMITS } from "@/utils";
import { Images, Map, Settings, TriangleAlert } from "lucide-vue-next";

interface Props {
  tableName: string | number;
  viewName: string;
  config: ViewConfig;
  viewType: ViewType;
  showAdminGear?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAdminGear: false,
});

const isDescriptionExpanded = ref(false);

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

const fullDescription = computed(() => props.config.VIEW_DESCRIPTION || "");

/** Preview length for collapsed card descriptions (~two lines). Not the config field max. */
const CARD_DESCRIPTION_PREVIEW = 120;

const isDescriptionTruncated = computed(() => {
  return fullDescription.value.length > CARD_DESCRIPTION_PREVIEW;
});

/**
 * Description shown on the card — short preview when collapsed, full text when expanded.
 *
 * @returns {string} Description text for display.
 */
const displayDescription = computed(() => {
  if (!fullDescription.value) return "";
  if (isDescriptionExpanded.value || !isDescriptionTruncated.value) {
    return fullDescription.value;
  }
  return (
    fullDescription.value.substring(0, CARD_DESCRIPTION_PREVIEW).trimEnd() + "…"
  );
});

const headerImage = computed(() => props.config.VIEW_HEADER_IMAGE || "");

const configEditPath = computed(() => ({
  path: `/config/${String(props.tableName)}`,
  query: { view_type: props.viewType },
}));
</script>

<template>
  <div
    data-testid="dataset-card"
    class="bg-violet-50 rounded-lg shadow-sm border border-violet-100 overflow-hidden flex flex-col h-full"
  >
    <div
      v-if="headerImage"
      data-testid="dataset-card-header-image"
      class="relative w-full h-32 sm:h-40 overflow-hidden"
    >
      <img
        :src="headerImage"
        :alt="truncateDisplayName(viewName || String(tableName))"
        class="w-full h-full object-cover"
      />
    </div>

    <div class="p-4 sm:p-6 flex flex-col flex-1">
      <div class="flex items-start mb-3">
        <div
          class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-violet-200 flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3 flex-shrink-0"
        >
          {{ String(tableName).charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0 max-w-full overflow-hidden">
          <div class="flex items-start gap-2 mb-2">
            <h2
              class="text-lg sm:text-xl font-semibold text-gray-800 break-words max-w-full flex-1"
              style="
                overflow-wrap: anywhere;
                word-break: break-word;
                hyphens: auto;
              "
            >
              {{ truncateDisplayName(viewName || String(tableName)) }}
            </h2>
            <NuxtLink
              v-if="showAdminGear"
              :to="configEditPath"
              data-testid="dataset-card-config-gear"
              class="flex-shrink-0 p-1.5 text-gray-500 hover:text-violet-700 hover:bg-violet-100 rounded-lg transition-colors"
              :aria-label="$t('editConfiguration')"
              @click.stop
            >
              <Settings class="w-4 h-4" />
            </NuxtLink>
          </div>
          <div class="mb-4">
            <template v-if="fullDescription">
              <p
                class="text-sm sm:text-base text-gray-600"
                data-testid="dataset-card-description"
              >
                {{ displayDescription }}
              </p>
              <button
                v-if="isDescriptionTruncated"
                type="button"
                data-testid="dataset-card-description-toggle"
                class="text-violet-600 hover:text-violet-800 text-sm font-medium underline mt-1"
                @click="isDescriptionExpanded = !isDescriptionExpanded"
              >
                {{ isDescriptionExpanded ? $t("showLess") : $t("showMore") }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-1.5 mb-4 overflow-hidden">
        <span
          :data-testid="`view-tag-${viewType}`"
          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-violet-100 text-violet-800 rounded-full flex-shrink-0"
        >
          <Map v-if="viewType === 'map'" class="w-3 h-3" />
          <Images v-else-if="viewType === 'gallery'" class="w-3 h-3" />
          <TriangleAlert v-else-if="viewType === 'alerts'" class="w-3 h-3" />
          {{ $t(viewType) }}
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
        :to="`/${viewType}/${String(tableName)}`"
        data-testid="open-dataset-view-link"
        class="mt-auto block w-full text-center px-4 py-2 sm:py-3 bg-violet-700 hover:bg-violet-800 text-white font-medium rounded-lg transition-colors duration-200"
      >
        {{ $t("openProject") }}
      </NuxtLink>
    </div>
  </div>
</template>
