<script setup lang="ts">
import { useAppConfig } from "#imports";
import {
  supportsSecondaryDataset,
  type ColumnEntry,
  type ViewConfig,
  type ViewType,
} from "@/types";
import { VIEW_INFO_CONFIG_KEYS } from "@/composables/useCopyConfig";
import { CONFIG_LIMITS } from "@/utils";
import { validateViewConfigColumns } from "@/utils/viewConfigColumns";
import ConfigPermissions from "./ConfigPermissions.vue";
import ConfigCollapsibleSection from "./ConfigCollapsibleSection.vue";
import { Check, Trash2 } from "lucide-vue-next";

const { viewTypes } = useAppConfig();

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
    secondaryEditable?: boolean;
    primaryColumns?: ColumnEntry[];
    secondaryColumns?: ColumnEntry[];
    primaryColumnsLoading?: boolean;
    secondaryColumnsLoading?: boolean;
  }>(),
  {
    configToCopy: null,
    allowSaveWithoutChanges: false,
    showRemove: true,
    saveEnabled: true,
    secondaryEditable: false,
    primaryColumns: () => [],
    secondaryColumns: () => [],
    primaryColumnsLoading: false,
    secondaryColumnsLoading: false,
  },
);

const emit = defineEmits(["submitConfig", "removeTableFromConfig"]);

// Set keys for the different sections of the config
const mapConfigKeys = computed(() => {
  const keys = [
    "MAPBOX_STYLE",
    "MAPBOX_ACCESS_TOKEN",
    "MAPBOX_CENTER_LATITUDE",
    "MAPBOX_CENTER_LONGITUDE",
    "MAPBOX_ZOOM",
    "MAPBOX_PROJECTION",
    "MAPBOX_BEARING",
    "MAPBOX_PITCH",
    "MAPBOX_3D",
    "MAPBOX_3D_TERRAIN_EXAGGERATION",
    "MAP_LEGEND_LAYER_IDS",
    "PLANET_API_KEY",
  ];
  if (props.viewType === "map") {
    keys.push("COLOR_COLUMN", "ICON_COLUMN");
  }
  return keys;
});
const mediaKeys = computed(() => {
  const keys = ["MEDIA_BASE_PATH"];
  if (props.viewType === "alerts") {
    keys.push("MEDIA_BASE_PATH_ALERTS");
  }
  if (props.viewType === "map") {
    keys.push("MEDIA_BASE_PATH_ICONS");
  }
  if (props.viewType === "map" || props.viewType === "gallery") {
    keys.push("MEDIA_COLUMN");
  }
  return keys;
});
const filterKeys = computed(() =>
  props.viewType === "alerts"
    ? ["FRONT_END_FILTER_COLUMN", "SECONDARY_FILTER_VALUES"]
    : ["FRONT_END_FILTER_COLUMN", "TIMESTAMP_COLUMN"],
);
const viewInfoKeys = computed(() => {
  const keys = ["DATASET_TABLE", "VIEW_DESCRIPTION", "VIEW_HEADER_IMAGE"];
  if (props.viewType !== "gallery") {
    keys.push("LOGO_URL");
  }
  return keys;
});

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

// Apply copied config from another dataset without resetting the saved baseline.
// View identity fields are omitted from the copy; keep this view's values.
watch(
  () => props.configToCopy,
  (copiedConfig) => {
    if (copiedConfig) {
      const preserved = Object.fromEntries(
        VIEW_INFO_CONFIG_KEYS.flatMap((key) => {
          const value = localConfig.value[key];
          return value === undefined ? [] : [[key, value]];
        }),
      );
      replaceConfig(localConfig.value, { ...copiedConfig, ...preserved });
    }
  },
);

const shouldShowConfigMap = computed(
  () => props.viewType === "alerts" || props.viewType === "map",
);
const shouldShowConfigMedia = computed(() =>
  (viewTypes as readonly ViewType[]).includes(props.viewType),
);
const shouldShowConfigFilters = computed(() =>
  (viewTypes as readonly ViewType[]).includes(props.viewType),
);
const shouldUseSecondaryDataset = computed(() =>
  supportsSecondaryDataset(props.viewType),
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

const hasSecondaryDataset = computed(
  () =>
    shouldUseSecondaryDataset.value &&
    localSecondaryDataset.value.trim() !== "",
);

const columnValidation = computed(() =>
  validateViewConfigColumns(
    localConfig.value,
    props.primaryColumns,
    props.secondaryColumns,
    props.viewType,
    hasSecondaryDataset.value,
  ),
);

const areColumnsLoading = computed(
  () =>
    props.primaryColumnsLoading ||
    (props.viewType === "alerts" &&
      hasSecondaryDataset.value &&
      props.secondaryColumnsLoading),
);

const hasConfigValue = (value: unknown) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const isFormValid = computed(() => {
  const isMapConfigValid = shouldShowConfigMap.value
    ? hasConfigValue(localConfig.value.MAPBOX_ACCESS_TOKEN) &&
      hasConfigValue(localConfig.value.MAPBOX_ZOOM) &&
      hasConfigValue(localConfig.value.MAPBOX_PROJECTION) &&
      hasConfigValue(localConfig.value.MAPBOX_CENTER_LATITUDE) &&
      hasConfigValue(localConfig.value.MAPBOX_CENTER_LONGITUDE)
    : true;

  return (
    isMapConfigValid &&
    isPermissionValid.value &&
    columnValidation.value.isValid &&
    !areColumnsLoading.value
  );
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
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="rounded-t-lg border-b border-slate-200 bg-slate-50 px-6 py-4">
      <h2 class="text-balance text-xl font-bold text-slate-800">
        {{ $t("configurationOptions") }}
      </h2>
    </div>
    <div class="p-6">
      <form @submit.prevent="handleSubmit">
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
          v-if="shouldShowConfigMap"
          :title="$t('map')"
          :default-open="false"
        >
          <ConfigMap
            :table-name="tableName"
            :views="viewTypeList"
            :config="localConfig"
            :keys="mapConfigKeys"
            :columns="primaryColumns"
            :columns-loading="primaryColumnsLoading"
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
            :columns="primaryColumns"
            :columns-loading="primaryColumnsLoading"
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
            :views="viewTypeList"
            :config="localConfig"
            :keys="filterKeys"
            :view-type="viewType"
            :has-secondary-dataset="hasSecondaryDataset"
            :primary-columns="primaryColumns"
            :secondary-columns="secondaryColumns"
            :primary-columns-loading="primaryColumnsLoading"
            :secondary-columns-loading="secondaryColumnsLoading"
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
