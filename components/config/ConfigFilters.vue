<script setup lang="ts">
import { computed } from "vue";

import ConfigColumnSelect from "@/components/config/ConfigColumnSelect.vue";
import { toCamelCase } from "@/utils/identifierUtils";

// @ts-expect-error - vue-tags-input does not have types
import { VueTagsInput } from "@vojtechlanka/vue-tags-input";

import { updateTags } from "@/composables/useTags";
import {
  getUnwantedColumnOptions,
  validateViewConfigColumns,
} from "@/utils/viewConfigColumns";

import type { ColumnEntry, ViewConfig, ViewType } from "@/types";

const props = defineProps<{
  tableName: string;
  config: ViewConfig;
  views: string[];
  keys: string[];
  viewType: ViewType;
  hasSecondaryDataset?: boolean;
  primaryColumns?: ColumnEntry[];
  secondaryColumns?: ColumnEntry[];
  primaryColumnsLoading?: boolean;
  secondaryColumnsLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: "updateConfig", payload: Partial<ViewConfig>): void;
}>();

type Tag = { text: string };

const initialTags: Record<string, Tag[]> = {
  SECONDARY_FILTER_VALUES: props.config.SECONDARY_FILTER_VALUES
    ? props.config.SECONDARY_FILTER_VALUES.split(",").map((tag) => ({
        text: tag,
      }))
    : [],
  UNWANTED_COLUMNS: props.config.UNWANTED_COLUMNS
    ? props.config.UNWANTED_COLUMNS.split(",").map((tag) => ({ text: tag }))
    : [],
};

const { tags, handleTagsChanged: rawHandleTagsChanged } = updateTags(
  initialTags,
  {},
);

const handleTagsChanged = (key: string, newTags: Tag[]): void => {
  const existingTags = new Set((tags.value[key] ?? []).map((tag) => tag.text));
  const acceptedTags =
    key === "UNWANTED_COLUMNS"
      ? newTags.filter((tag) =>
          [
            ...unwantedColumnOptions.value.map(
              (column) => column.original_column,
            ),
            ...existingTags,
          ].includes(tag.text),
        )
      : newTags;
  rawHandleTagsChanged(key, acceptedTags);
  const values = acceptedTags.map((tag) => tag.text).join(",");
  emit("updateConfig", { [key]: values });
};

const handleInput = (key: string, value: string): void => {
  emit("updateConfig", { [key]: value });
};

const getStringConfigValue = (key: string): string => {
  const value = props.config[key];
  return typeof value === "string" ? value : "";
};

const filterColumns = computed(() =>
  props.viewType === "alerts" && props.hasSecondaryDataset
    ? (props.secondaryColumns ?? [])
    : (props.primaryColumns ?? []),
);

const filterColumnsLoading = computed(() =>
  props.viewType === "alerts" && props.hasSecondaryDataset
    ? props.secondaryColumnsLoading
    : props.primaryColumnsLoading,
);

const unwantedColumnOptions = computed(() =>
  getUnwantedColumnOptions(
    props.primaryColumns ?? [],
    props.config,
    props.viewType,
    Boolean(props.hasSecondaryDataset),
  ),
);

const unwantedAutocompleteItems = computed(() =>
  unwantedColumnOptions.value.map((column) => ({
    text: column.original_column,
  })),
);

const columnValidation = computed(() =>
  validateViewConfigColumns(
    props.config,
    props.primaryColumns ?? [],
    props.secondaryColumns ?? [],
    props.viewType,
    Boolean(props.hasSecondaryDataset),
  ),
);

const hasUnwantedColumnError = computed(
  () =>
    columnValidation.value.invalidUnwantedColumns.length > 0 ||
    columnValidation.value.protectedUnwantedColumns.length > 0 ||
    columnValidation.value.conflictingUnwantedColumns.length > 0,
);
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6"
    data-testid="config-field-grid"
  >
    <div
      v-for="key in keys"
      :key="key"
      class="space-y-2 min-w-0"
      :class="{
        'md:col-span-2':
          key === 'SECONDARY_FILTER_VALUES' || key === 'UNWANTED_COLUMNS',
      }"
    >
      <template v-if="key === 'FRONT_END_FILTER_COLUMN'">
        <ConfigColumnSelect
          :id="`${tableName}-${key}`"
          :model-value="getStringConfigValue(key)"
          :label="$t('filterDataByColumn')"
          :placeholder="$t('selectColumn')"
          :columns="filterColumns"
          :loading="filterColumnsLoading"
          @update:model-value="(value) => handleInput(key, value)"
        />
      </template>
      <template v-else-if="key === 'TIMESTAMP_COLUMN'">
        <ConfigColumnSelect
          :id="`${tableName}-${key}`"
          :model-value="getStringConfigValue(key)"
          :label="$t(toCamelCase(key))"
          :placeholder="$t('selectColumn')"
          :columns="primaryColumns ?? []"
          :loading="primaryColumnsLoading"
          @update:model-value="(value) => handleInput(key, value)"
        />
      </template>
      <template
        v-else-if="
          key === 'SECONDARY_FILTER_VALUES' || key === 'UNWANTED_COLUMNS'
        "
      >
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <VueTagsInput
          :id="`${tableName}-${key}`"
          class="tag-field w-full"
          :tags="tags[key]"
          :autocomplete-items="
            key === 'UNWANTED_COLUMNS' ? unwantedAutocompleteItems : []
          "
          :autocomplete-min-length="0"
          :autocomplete-filter-duplicates="true"
          @tags-changed="(newTags: Tag[]) => handleTagsChanged(key, newTags)"
        />
        <p
          v-if="key === 'UNWANTED_COLUMNS' && hasUnwantedColumnError"
          class="text-sm text-red-600"
          role="alert"
        >
          {{ $t("unwantedColumnsInvalid") }}
        </p>
      </template>
    </div>
  </div>
</template>
