<script setup lang="ts">
import type { ViewConfig, ViewType } from "@/types";
import { formatDisplayName, CONFIG_LIMITS } from "@/utils";
import { encodeDatasetNameForUrl } from "@/utils/identifierUtils";
import {
  Globe2,
  Images,
  Map,
  Settings,
  Shield,
  TriangleAlert,
  Users,
} from "lucide-vue-next";

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

const datasetPathSegment = computed(() =>
  encodeDatasetNameForUrl(String(props.tableName)),
);

const getPermissionLevel = () => {
  if (process.env.CI) return null;
  const permission = props.config.ROUTE_LEVEL_PERMISSION;
  return permission ? formatDisplayName(permission) : null;
};

const permissionIcon = computed(() => {
  switch (props.config.ROUTE_LEVEL_PERMISSION) {
    case "anyone":
    case "guest":
      return Globe2;
    case "member":
      return Users;
    case "admin":
      return Shield;
    default:
      return null;
  }
});

const truncateDisplayName = (name: string): string => {
  if (!name) return "";
  return name.length > CONFIG_LIMITS.DATASET_TABLE
    ? name.substring(0, CONFIG_LIMITS.DATASET_TABLE) + "..."
    : name;
};

const fullDescription = computed(() => props.config.VIEW_DESCRIPTION || "");
const CARD_DESCRIPTION_PREVIEW = 120;
const displayDescription = computed(() => {
  if (fullDescription.value.length <= CARD_DESCRIPTION_PREVIEW) {
    return fullDescription.value;
  }
  return (
    fullDescription.value.substring(0, CARD_DESCRIPTION_PREVIEW).trimEnd() + "…"
  );
});

const headerImage = computed(() => props.config.VIEW_HEADER_IMAGE || "");
const viewPath = computed(
  () => `/${props.viewType}/${datasetPathSegment.value}`,
);
const configEditPath = computed(() => ({
  path: `/config/${datasetPathSegment.value}`,
  query: { view_type: props.viewType },
}));
</script>

<template>
  <article
    data-testid="dataset-card"
    class="relative bg-violet-50 rounded-lg shadow-sm border border-violet-100 overflow-hidden h-full hover:shadow-md transition-shadow"
  >
    <NuxtLink
      :to="viewPath"
      data-testid="open-dataset-view-link"
      class="block h-full focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-700"
    >
      <div
        data-testid="dataset-card-header-image"
        class="relative w-full h-32 sm:h-40 overflow-hidden bg-violet-100"
      >
        <img
          v-if="headerImage"
          :src="headerImage"
          :alt="truncateDisplayName(viewName || String(tableName))"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          data-testid="dataset-card-placeholder"
          class="w-full h-full flex items-center justify-center text-violet-400"
          aria-hidden="true"
        >
          <Map
            v-if="viewType === 'map'"
            class="w-20 h-20"
            :stroke-width="1.5"
          />
          <Images
            v-else-if="viewType === 'gallery'"
            class="w-20 h-20"
            :stroke-width="1.5"
          />
          <TriangleAlert
            v-else-if="viewType === 'alerts'"
            class="w-20 h-20"
            :stroke-width="1.5"
          />
        </div>
        <div class="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          <span
            :data-testid="`view-tag-${viewType}`"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/95 text-violet-800 rounded-full shadow-sm"
          >
            <Map v-if="viewType === 'map'" class="w-3 h-3" />
            <Images v-else-if="viewType === 'gallery'" class="w-3 h-3" />
            <TriangleAlert v-else-if="viewType === 'alerts'" class="w-3 h-3" />
            {{ $t(viewType) }}
          </span>
          <span
            v-if="getPermissionLevel()"
            class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100/95 text-blue-800 shadow-sm whitespace-nowrap"
          >
            <component
              :is="permissionIcon"
              class="w-3 h-3"
              aria-hidden="true"
            />
            {{ getPermissionLevel() }}
          </span>
        </div>
      </div>

      <div class="p-4 sm:p-6 flex flex-col min-h-44">
        <h2
          class="text-lg sm:text-xl font-semibold text-gray-800 break-words mb-2 line-clamp-2 min-h-14"
          style="overflow-wrap: anywhere; word-break: break-word; hyphens: auto"
        >
          {{ truncateDisplayName(viewName || String(tableName)) }}
        </h2>
        <p
          class="text-sm sm:text-base text-gray-600 line-clamp-3 min-h-[4.5rem]"
          data-testid="dataset-card-description"
        >
          {{ displayDescription }}
        </p>
      </div>
    </NuxtLink>

    <NuxtLink
      v-if="showAdminGear"
      :to="configEditPath"
      data-testid="dataset-card-config-gear"
      class="absolute right-2 top-2 z-20 p-2.5 text-gray-700 bg-white/90 hover:text-violet-900 hover:bg-violet-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-700"
      :aria-label="$t('accessConfig')"
      :title="$t('accessConfig')"
      @click.stop
    >
      <Settings class="w-5 h-5" />
    </NuxtLink>
  </article>
</template>
