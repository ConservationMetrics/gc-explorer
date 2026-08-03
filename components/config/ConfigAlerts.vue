<script setup lang="ts">
// @ts-expect-error - vue-tags-input does not have types
import { VueTagsInput } from "@vojtechlanka/vue-tags-input";

import { toCamelCase } from "@/utils/identifierUtils";
import { updateTags } from "@/composables/useTags";

import type { ViewConfig } from "@/types";

const props = defineProps<{
  tableName: string;
  config: ViewConfig;
  views: Array<string>;
  keys: Array<string>;
}>();

const emit = defineEmits<{
  (e: "updateConfig", payload: Partial<ViewConfig>): void;
}>();

type Tag = { text: string };

const resolveFilterValues = (config: ViewConfig): string | undefined =>
  config.SECONDARY_FILTER_VALUES ||
  config.SECONDARY_CATEGORY_IDS ||
  config.MAPEO_CATEGORY_IDS;

const initialFilterValues = resolveFilterValues(props.config);

const initialTags: Record<string, Tag[]> = {
  SECONDARY_FILTER_VALUES: initialFilterValues
    ? initialFilterValues.split(",").map((tag) => ({ text: tag }))
    : [],
};

const { tags, handleTagsChanged: rawHandleTagsChanged } = updateTags(
  initialTags,
  {},
);

const handleTagsChanged = (key: string, newTags: Tag[]): void => {
  rawHandleTagsChanged(key, newTags);
  const values = newTags.map((tag) => tag.text).join(",");
  emit("updateConfig", {
    SECONDARY_FILTER_VALUES: values,
    SECONDARY_CATEGORY_IDS: undefined,
    MAPEO_CATEGORY_IDS: undefined,
  });
};

const handleInput = (key: string, value: string): void => {
  emit("updateConfig", { [key]: value });
};
</script>

<template>
  <div class="space-y-6">
    <div v-for="key in keys" :key="key" class="space-y-2">
      <template v-if="key === 'FRONT_END_FILTER_COLUMN'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t("filterDataByColumn") }}
        </label>
        <input
          :id="`${tableName}-${key}`"
          :value="config[key]"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
          type="text"
          @input="(e) => handleInput(key, (e.target as HTMLInputElement).value)"
        />
      </template>
      <template v-else-if="key === 'SECONDARY_FILTER_VALUES'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <VueTagsInput
          class="tag-field"
          :tags="tags[key]"
          @tags-changed="(newTags: Tag[]) => handleTagsChanged(key, newTags)"
        />
      </template>
    </div>
  </div>
</template>
