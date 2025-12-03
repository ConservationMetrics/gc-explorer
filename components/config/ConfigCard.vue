<script setup lang="ts">
import type { ViewConfig } from "@/types/types";
import ConfigPermissions from "./ConfigPermissions.vue";

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
const otherKeys = computed(() => ["LOGO_URL"]);

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
const shouldShowConfigOther = computed(() =>
  hasView(["map", "gallery", "alerts"]),
);

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
  emit("submitConfig", {
    tableName: props.tableName,
    config: localConfig.value,
  });
};
</script>

<template>
  <div class="table-item card">
    <h2 class="card-header">
      <p class="table-name">{{ tableName }}</p>
    </h2>
    <div class="card-body">
      <form @submit.prevent="handleSubmit">
        <ConfigViews
          :table-name="tableName"
          :config="localConfig"
          :views="availableViews"
          :keys="viewsKeys"
          @update:views="handleViewUpdate"
        />
        <ConfigMap
          v-if="shouldShowConfigMap"
          :table-name="tableName"
          :views="availableViews"
          :config="localConfig"
          :keys="mapConfigKeys"
          @update-config="handleConfigUpdate"
        />
        <ConfigMedia
          v-if="shouldShowConfigMedia"
          :table-name="tableName"
          :views="availableViews"
          :config="localConfig"
          :keys="mediaKeys"
          @update-config="handleConfigUpdate"
        />
        <ConfigAlerts
          v-if="shouldShowConfigAlerts"
          :table-name="tableName"
          :views="availableViews"
          :config="localConfig"
          :keys="alertKeys"
          @update-config="handleConfigUpdate"
        />
        <ConfigFilters
          v-if="shouldShowConfigFilters"
          :table-name="tableName"
          :views="availableViews"
          :config="localConfig"
          :keys="filterKeys"
          @update-config="handleConfigUpdate"
        />
        <ConfigOther
          v-if="shouldShowConfigOther"
          :table-name="tableName"
          :views="availableViews"
          :config="localConfig"
          :keys="otherKeys"
          @update-config="handleConfigUpdate"
        />
        <ConfigPermissions
          :table-name="tableName"
          :view-config="localConfig"
          @update-config="handleConfigUpdate"
          @update-validation="handlePermissionValidation"
        />
        <button
          type="submit"
          :disabled="!isChanged || !isFormValid"
          :class="[
            'submit-button',
            {
              'bg-gray-500 cursor-not-allowed': !isChanged || !isFormValid,
              'bg-blue-500 hover:bg-blue-700': isChanged && isFormValid,
            },
          ]"
          class="text-white font-bold py-2 px-4 rounded transition-colors duration-200 mr-2 mb-2 md:mb-0"
        >
          {{ $t("submit") }}
        </button>
        <button
          type="button"
          class="remove-button text-white font-bold bg-red-500 hover:bg-red-700 py-2 px-4 rounded transition-colors duration-200"
          @click="$emit('removeTableFromConfig', tableName)"
        >
          {{ $t("removeTable") }}
        </button>
      </form>
    </div>
  </div>
</template>

<style>
.table-item.card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1em;
  width: 100%;
  max-width: 1200px;
}

.card-header {
  background-color: #d3bce3;
  border-bottom: 1px solid #b399c1;
  padding: 0.75em 1em;
  font-size: 1.25em;
  font-weight: bold;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.card-body {
  margin-top: 2em;
}

.table-name {
  margin: 0;
}

.config-section {
  background-color: #f1f1f1;
  margin-bottom: 1.5em;
  padding: 1em;
  border: 1px dashed #ccc;
  border-radius: 8px;
}

.config-header {
  margin-bottom: 1em;
}

.config-header h3 {
  margin: 0;
  padding: 0.5em 0;
  font-size: 1.15em;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
  color: #333;
}

.config-field {
  margin-bottom: 1em;
}

.config-field label {
  display: block;
  margin-bottom: 0.5em;
  font-weight: bold;
}

.config-field .input-field {
  width: 100%;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.views-checkboxes {
  display: flex;
  gap: 1em;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: normal !important;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 0.5em;
}

select {
  background-color: #fff;
}

.tag-field {
  min-width: 100%;
}

.table-item {
  background-color: #f9f9f9;
  border-radius: 5px;
  padding: 1em;
  margin-bottom: 1em;
  width: 50%;
}

.table-item h2 {
  color: #333;
  margin-bottom: 0.5em;
}

.table-item ul {
  list-style: none;
  padding: 0;
}

.table-item ul li {
  margin-bottom: 0.5em;
}

.table-item ul li a {
  color: #007bff;
  text-decoration: none;
}

.table-item ul li a:hover {
  color: #0056b3;
  text-decoration: underline;
}
</style>
