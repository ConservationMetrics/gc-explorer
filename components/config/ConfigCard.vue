<script setup lang="ts">
import type { ViewConfig, ViewType } from "@/types";
import { CONFIG_LIMITS } from "@/utils";
import ConfigPermissions from "./ConfigPermissions.vue";
import ConfigCollapsibleSection from "./ConfigCollapsibleSection.vue";
import { Check, Trash2 } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    tableName: string;
    viewType: ViewType;
    viewConfig: ViewConfig;
    secondaryDataset?: string | null;
    configToCopy?: ViewConfig | null;
    /** Create flow: allow Save even when the form matches the empty baseline. */
    allowSaveWithoutChanges?: boolean;
    showRemove?: boolean;
    /** False when the parent blocks Save (e.g. missing primary or duplicate view). */
    saveEnabled?: boolean;
    /**
     * Create flow only: show/edit secondary (alerts Mapeo text). Edit pages keep
     * secondary read-only in metadata — see TODO on config/[dataset].vue.
     */
    secondaryEditable?: boolean;
  }>(),
  {
    configToCopy: null,
    allowSaveWithoutChanges: false,
    showRemove: true,
    saveEnabled: true,
    secondaryEditable: false,
  },
);

const emit = defineEmits([
  "submitConfig",
  "removeTableFromConfig",
  "updateSecondaryDataset",
]);

// Set keys for the different sections of the config
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
const alertKeys = computed(() => ["MAPEO_CATEGORY_IDS"]);
const filterKeys = computed(() => [
  "FILTER_OUT_VALUES_FROM_COLUMN",
  "FRONT_END_FILTER_COLUMN",
  "TIMESTAMP_COLUMN",
  "UNWANTED_COLUMNS",
  "UNWANTED_SUBSTRINGS",
]);
const viewInfoKeys = computed(() => [
  "LOGO_URL",
  "DATASET_TABLE",
  "VIEW_HEADER_IMAGE",
  "VIEW_DESCRIPTION",
]);

// The child config components expect a `views` array; wrap the single view type
const viewTypeList = computed(() => [props.viewType]);

/**
 * Creates an editable copy of a view configuration.
 *
 * @param {ViewConfig} config - Configuration to copy.
 * @returns {ViewConfig} A detached copy of the configuration.
 */
const cloneConfig = (config: ViewConfig): ViewConfig => {
  return JSON.parse(JSON.stringify(config)) as ViewConfig;
};

/**
 * Replaces a config object's contents without replacing its reactive identity.
 *
 * @param {ViewConfig} target - Existing reactive config object.
 * @param {ViewConfig} source - New configuration values.
 * @returns {void}
 */
const replaceConfig = (target: ViewConfig, source: ViewConfig): void => {
  const mutableTarget = target as Record<string, unknown>;
  Object.keys(target).forEach((key) => {
    mutableTarget[key] = undefined;
  });
  Object.assign(target, cloneConfig(source));
};

const localConfig = ref<ViewConfig>(cloneConfig(props.viewConfig));
const originalConfig = ref<ViewConfig>(cloneConfig(props.viewConfig));
const localSecondaryDataset = ref(props.secondaryDataset ?? "");
const originalSecondaryDataset = ref(localSecondaryDataset.value);

// Parent owns secondary UI (under primary); keep local in sync for Save/dirty.
watch(
  () => props.secondaryDataset,
  (newSecondaryDataset) => {
    localSecondaryDataset.value = newSecondaryDataset ?? "";
  },
);

// After save (or load), reset config + secondary baselines together.
watch(
  () => props.viewConfig,
  (newConfig) => {
    if (newConfig) {
      replaceConfig(localConfig.value, newConfig);
      originalConfig.value = cloneConfig(newConfig);
      localSecondaryDataset.value = props.secondaryDataset ?? "";
      originalSecondaryDataset.value = localSecondaryDataset.value;
    }
  },
  { deep: true },
);

// Apply copied config from another dataset without resetting the saved baseline
watch(
  () => props.configToCopy,
  (copiedConfig) => {
    if (copiedConfig) {
      replaceConfig(localConfig.value, copiedConfig);
    }
  },
);

const shouldShowConfigMap = computed(
  () => props.viewType === "alerts" || props.viewType === "map",
);
const shouldShowConfigMedia = computed(() =>
  ["map", "gallery", "alerts"].includes(props.viewType),
);
const shouldShowConfigAlerts = computed(() => props.viewType === "alerts");
const shouldShowConfigFilters = computed(
  () => props.viewType === "map" || props.viewType === "gallery",
);
const shouldUseSecondaryDataset = computed(
  () => props.viewType === "alerts" || props.viewType === "map",
);

// Form validations and helpers
const isChanged = computed(() => {
  const localConfigFiltered = Object.fromEntries(
    Object.entries(localConfig.value).filter(([value]) => value !== ""),
  );
  const originalConfigFiltered = Object.fromEntries(
    Object.entries(originalConfig.value).filter(([value]) => value !== ""),
  );
  const configChanged =
    JSON.stringify(localConfigFiltered) !==
    JSON.stringify(originalConfigFiltered);
  const secondaryDatasetChanged =
    props.secondaryEditable &&
    shouldUseSecondaryDataset.value &&
    localSecondaryDataset.value.trim() !==
      originalSecondaryDataset.value.trim();

  return configChanged || secondaryDatasetChanged;
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

const canSubmit = computed(
  () =>
    props.saveEnabled &&
    isFormValid.value &&
    (props.allowSaveWithoutChanges || isChanged.value),
);

// Handlers for updating config and form submission
const handleConfigUpdate = (partialUpdate: Partial<ViewConfig>) => {
  Object.assign(localConfig.value, partialUpdate);
};

const handleSecondaryDatasetUpdate = (value: string) => {
  localSecondaryDataset.value = value;
  emit("updateSecondaryDataset", value);
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
    secondaryDataset: shouldUseSecondaryDataset.value
      ? localSecondaryDataset.value
      : null,
  });
};
</script>

<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
  >
    <div
      class="bg-gradient-to-r from-violet-100 to-violet-50 border-b border-violet-200 px-6 py-4"
    >
      <h2 class="text-xl font-bold text-gray-800">
        {{ $t("configurationOptions") }}
      </h2>
    </div>
    <div class="p-6">
      <form @submit.prevent="handleSubmit">
        <ConfigCollapsibleSection
          v-if="shouldShowConfigMap"
          :title="$t('map')"
          :default-open="false"
        >
          <ConfigMap
            :table-name="tableName"
            :views="viewTypeList"
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
            :views="viewTypeList"
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
            :views="viewTypeList"
            :config="localConfig"
            :secondary-dataset="localSecondaryDataset"
            :show-mapeo-table-field="secondaryEditable"
            :keys="alertKeys"
            @update-config="handleConfigUpdate"
            @update-secondary-dataset="handleSecondaryDatasetUpdate"
          />
        </ConfigCollapsibleSection>

        <ConfigCollapsibleSection
          v-if="shouldShowConfigFilters"
          :title="$t('filtering')"
          :default-open="false"
        >
          <ConfigFilters
            :table-name="tableName"
            :views="viewTypeList"
            :config="localConfig"
            :keys="filterKeys"
            @update-config="handleConfigUpdate"
          />
        </ConfigCollapsibleSection>

        <ConfigCollapsibleSection :title="$t('view')" :default-open="true">
          <ConfigViewInfo
            :table-name="tableName"
            :views="viewTypeList"
            :config="localConfig"
            :keys="viewInfoKeys"
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
            data-testid="config-submit-button"
            :disabled="!canSubmit"
            class="flex items-center gap-2 px-6 py-3 font-medium rounded-lg transition-colors duration-200"
            :class="{
              'bg-gray-300 text-gray-500 cursor-not-allowed': !canSubmit,
              'bg-violet-700 hover:bg-violet-800 text-white': canSubmit,
            }"
          >
            <Check class="w-5 h-5" />
            {{ $t("save") }}
          </button>
          <button
            v-if="showRemove"
            type="button"
            data-testid="config-remove-button"
            class="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200"
            @click="$emit('removeTableFromConfig', tableName)"
          >
            <Trash2 class="w-5 h-5" />
            {{ $t("removeDatasetView") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
