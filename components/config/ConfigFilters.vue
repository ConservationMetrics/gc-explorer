<script setup lang="ts">
import { computed } from "vue";

import ConfigColumnSelect from "@/components/config/ConfigColumnSelect.vue";
import ConfigFieldLabel from "@/components/config/ConfigFieldLabel.vue";
import { Info } from "lucide-vue-next";
import { toCamelCase } from "@/utils/identifierUtils";

// @ts-expect-error - vue-tags-input does not have types
import { VueTagsInput } from "@vojtechlanka/vue-tags-input";

import { updateTags } from "@/composables/useTags";

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
};

const { tags, handleTagsChanged: rawHandleTagsChanged } = updateTags(
  initialTags,
  {},
);

const handleTagsChanged = (key: string, newTags: Tag[]): void => {
  rawHandleTagsChanged(key, newTags);
  const values = newTags.map((tag) => tag.text).join(",");
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
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6"
    data-testid="config-field-grid"
  >
    <aside
      v-if="viewType === 'alerts'"
      class="flex gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 md:col-span-2"
    >
      <Info
        class="mt-0.5 h-5 w-5 shrink-0 text-violet-600"
        aria-hidden="true"
      />
      <p class="text-sm leading-relaxed text-violet-950">
        <i18n-t keypath="filterAlertsIntro" tag="span">
          <template #column>
            <code
              class="rounded bg-white/80 px-1 py-0.5 font-mono text-[0.85em]"
              >category</code
            >
          </template>
          <template #values>
            <code
              class="rounded bg-white/80 px-1 py-0.5 font-mono text-[0.85em]"
              >mining, logging, land invasions</code
            >
          </template>
        </i18n-t>
      </p>
    </aside>
    <div
      v-for="key in keys"
      :key="key"
      class="space-y-2 min-w-0"
      :class="{
        'md:col-span-2': key === 'SECONDARY_FILTER_VALUES',
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
        <p
          v-if="viewType === 'map' || viewType === 'gallery'"
          class="text-gray-500 text-sm"
        >
          {{ $t("filterDataByColumnDescription") }}
        </p>
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
        <p class="text-gray-500 text-sm">
          {{ $t("timestampColumnDescription") }}
        </p>
      </template>
      <template v-else-if="key === 'SECONDARY_FILTER_VALUES'">
        <ConfigFieldLabel :for-id="`${tableName}-${key}`">
          {{ $t(toCamelCase(key)) }}
        </ConfigFieldLabel>
        <VueTagsInput
          :id="`${tableName}-${key}`"
          class="tag-field w-full"
          :tags="tags[key]"
          :autocomplete-items="[]"
          :autocomplete-min-length="0"
          :autocomplete-filter-duplicates="true"
          @tags-changed="(newTags: Tag[]) => handleTagsChanged(key, newTags)"
        />
      </template>
    </div>
  </div>
</template>
