<script setup lang="ts">
import type { ViewConfig } from "@/types/types";
import { CONFIG_LIMITS } from "@/utils";
import ConfigPermissions from "./ConfigPermissions.vue";
import ConfigCollapsibleSection from "./ConfigCollapsibleSection.vue";

const props = defineProps<{
  tableName: string;
  viewConfig: ViewConfig;
}>();

const emit = defineEmits(["submitConfig", "removeTableFromConfig"]);

// Set keys for the different sections of the config
const availableViews = ref<string[]>([]);
const viewsKeys = computed(() => ["VIEWS"]);
const mapConfigKeys = computed(() => [
  "MAPBOX_STYLE",
  "MAPBOX_ACCESS_TOKEN",
  "MAPBOX_ZOOM",
  "MAPBOX_CENTER_LATITUDE",
  "MAPBOX_CENTER_LONGITUDE",
  "MAPBOX_PROJECTION",
  "MAPBOX_BEARING",
  "MAPBOX_PITCH",
  "MAPBOX_3D",
  "MAPBOX_3D_TERRAIN_EXAGGERATION",
  "MAP_LEGEND_LAYER_IDS",
  "PLANET_API_KEY",
  "COLOR_COLUMN",
  "ICON_COLUMN",
]);
const mediaKeys = computed(() => [
  "MEDIA_BASE_PATH",
  "MEDIA_BASE_PATH_ALERTS",
  "MEDIA_BASE_PATH_ICONS",
  "MEDIA_COLUMN",
]);
const alertKeys = computed(() => ["MAPEO_CATEGORY_IDS", "MAPEO_TABLE"]);
const filterKeys = computed(() => [
  "FILTER_OUT_VALUES_FROM_COLUMN",
  "FRONT_END_FILTER_COLUMN",
  "UNWANTED_COLUMNS",
  "UNWANTED_SUBSTRINGS",
]);
const datasetInfoKeys = computed(() => [
  "LOGO_URL",
  "DATASET_TABLE",
  "VIEW_HEADER_IMAGE",
  "VIEW_DESCRIPTION",
]);

// On mounted, set localConfig to props.config
const originalConfig = ref<ViewConfig>({});
const localConfig = ref<ViewConfig>({});
onMounted(() => {
  if (props.viewConfig) {
    localConfig.value = JSON.parse(JSON.stringify(props.viewConfig));
  }
  originalConfig.value = JSON.parse(JSON.stringify(localConfig.value));
  availableViews.value = localConfig.value?.VIEWS
    ? localConfig.value.VIEWS.split(",")
    : [];
});

// Form validations and helpers
const isChanged = computed(() => {
  const localConfigFiltered = Object.fromEntries(
    Object.entries(localConfig.value).filter(([value]) => value !== ""),
  );
  const originalConfigFiltered = Object.fromEntries(
    Object.entries(originalConfig.value).filter(([value]) => value !== ""),
  );
  return (
    JSON.stringify(localConfigFiltered) !==
    JSON.stringify(originalConfigFiltered)
  );
});

// Track permission validation state
const isPermissionValid = ref(true);

const isFormValid = computed(() => {
  const isMapConfigValid = shouldShowConfigMap.value
    ? localConfig.value.MAPBOX_ACCESS_TOKEN?.trim() !== "" &&
      localConfig.value.MAPBOX_ACCESS_TOKEN != null
    : true;

  return isMapConfigValid && isPermissionValid.value;
});

const shouldShowConfigMap = computed(() => hasView(["alerts", "map"]));
const shouldShowConfigMedia = computed(() =>
  hasView(["map", "gallery", "alerts"]),
);
const shouldShowConfigAlerts = computed(() => hasView(["alerts"]));
const shouldShowConfigFilters = computed(() => hasView(["map", "gallery"]));

const hasView = (viewsArray: Array<string>) => {
  if (!availableViews.value || availableViews.value.length === 0) {
    return false;
  }
  return viewsArray.some((view) => availableViews.value.includes(view));
};

// Handlers for updating config and form submission
const handleViewUpdate = (newViews: Array<string>) => {
  availableViews.value = newViews;
  localConfig.value.VIEWS = newViews.join(",");
};

const handleConfigUpdate = (partialUpdate: Partial<ViewConfig>) => {
  Object.assign(localConfig.value, partialUpdate);
};

const handlePermissionValidation = (isValid: boolean) => {
  isPermissionValid.value = isValid;
};

const handleSubmit = () => {
  // Client-side validation before submission
  if (localConfig.value.DATASET_TABLE) {
    const datasetTableValue = String(localConfig.value.DATASET_TABLE);
    if (datasetTableValue.length > CONFIG_LIMITS.DATASET_TABLE) {
      alert(
        `DATASET_TABLE must be at most ${CONFIG_LIMITS.DATASET_TABLE} characters (current: ${datasetTableValue.length})`,
      );
      return;
    }
  }

  if (localConfig.value.VIEW_DESCRIPTION) {
    const viewDescriptionValue = String(localConfig.value.VIEW_DESCRIPTION);
    if (viewDescriptionValue.length > CONFIG_LIMITS.VIEW_DESCRIPTION) {
      alert(
        `VIEW_DESCRIPTION must be at most ${CONFIG_LIMITS.VIEW_DESCRIPTION} characters (current: ${viewDescriptionValue.length})`,
      );
      return;
    }
  }

  emit("submitConfig", {
    tableName: props.tableName,
    config: localConfig.value,
  });
};
</script>

<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
  >
    <div
      class="bg-gradient-to-r from-purple-100 to-purple-50 border-b border-purple-200 px-6 py-4"
    >
      <h2 class="text-xl font-bold text-gray-800">{{ tableName }}</h2>
    </div>
    <div class="p-6">
      <form @submit.prevent="handleSubmit">
        <ConfigCollapsibleSection :title="$t('views')" :default-open="true">
          <ConfigViews
            :table-name="tableName"
            :config="localConfig"
            :views="availableViews"
            :keys="viewsKeys"
            @update:views="handleViewUpdate"
          />
        </ConfigCollapsibleSection>

        <ConfigCollapsibleSection
          v-if="shouldShowConfigMap"
          :title="$t('map')"
          :default-open="false"
        >
          <ConfigMap
            :table-name="tableName"
            :views="availableViews"
            :config="localConfig"
            :keys="mapConfigKeys"
            @update-config="handleConfigUpdate"
          />
        </ConfigCollapsibleSection>

        <ConfigCollapsibleSection
          v-if="shouldShowConfigMedia"
          :title="$t('media')"
          :default-open="false"
        >
          <ConfigMedia
            :table-name="tableName"
            :views="availableViews"
            :config="localConfig"
            :keys="mediaKeys"
            @update-config="handleConfigUpdate"
          />
        </ConfigCollapsibleSection>

        <ConfigCollapsibleSection
          v-if="shouldShowConfigAlerts"
          :title="$t('alerts')"
          :default-open="false"
        >
          <ConfigAlerts
            :table-name="tableName"
            :views="availableViews"
            :config="localConfig"
            :keys="alertKeys"
            @update-config="handleConfigUpdate"
          />
        </ConfigCollapsibleSection>

        <ConfigCollapsibleSection
          v-if="shouldShowConfigFilters"
          :title="$t('filtering')"
          :default-open="false"
        >
          <ConfigFilters
            :table-name="tableName"
            :views="availableViews"
            :config="localConfig"
            :keys="filterKeys"
            @update-config="handleConfigUpdate"
          />
        </ConfigCollapsibleSection>

        <ConfigCollapsibleSection :title="$t('dataset')" :default-open="true">
          <ConfigDatasetInfo
            :table-name="tableName"
            :views="availableViews"
            :config="localConfig"
            :keys="datasetInfoKeys"
            @update-config="handleConfigUpdate"
          />
        </ConfigCollapsibleSection>

        <ConfigCollapsibleSection
          :title="$t('visibility')"
          :default-open="true"
        >
          <ConfigPermissions
            :table-name="tableName"
            :view-config="localConfig"
            @update-config="handleConfigUpdate"
            @update-validation="handlePermissionValidation"
          />
        </ConfigCollapsibleSection>

        <div class="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            :disabled="!isChanged || !isFormValid"
            class="flex items-center gap-2 px-6 py-3 font-medium rounded-lg transition-colors duration-200"
            :class="{
              'bg-gray-300 text-gray-500 cursor-not-allowed':
                !isChanged || !isFormValid,
              'bg-purple-700 hover:bg-purple-800 text-white':
                isChanged && isFormValid,
            }"
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            {{ $t("submit") }}
          </button>
          <button
            type="button"
            class="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200"
            @click="$emit('removeTableFromConfig', tableName)"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {{ $t("removeTable") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
