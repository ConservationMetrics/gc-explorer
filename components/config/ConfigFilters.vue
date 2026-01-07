<script setup lang="ts">
import { toCamelCase } from "@/utils";

// @ts-expect-error - vue-tags-input does not have types
import { VueTagsInput } from "@vojtechlanka/vue-tags-input";

import { updateTags } from "@/composables/useTags";

import type { ViewConfig } from "@/types/types";

const props = defineProps<{
  tableName: string;
  config: ViewConfig;
  views: string[];
  keys: string[];
}>();

const emit = defineEmits<{
  (e: "updateConfig", payload: Partial<ViewConfig>): void;
}>();

type Tag = { text: string };

const initialTags: Record<string, Tag[]> = {
  FILTER_OUT_VALUES_FROM_COLUMN: props.config.FILTER_OUT_VALUES_FROM_COLUMN
    ? props.config.FILTER_OUT_VALUES_FROM_COLUMN.split(",").map((tag) => ({
        text: tag,
      }))
    : [],
  UNWANTED_COLUMNS: props.config.UNWANTED_COLUMNS
    ? props.config.UNWANTED_COLUMNS.split(",").map((tag) => ({ text: tag }))
    : [],
  UNWANTED_SUBSTRINGS: props.config.UNWANTED_SUBSTRINGS
    ? props.config.UNWANTED_SUBSTRINGS.split(",").map((tag) => ({ text: tag }))
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
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div v-for="key in keys" :key="key" class="space-y-2">
      <template
        v-if="key === 'FRONT_END_FILTER_COLUMN' || key === 'TIMESTAMP_COLUMN'"
      >
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <input
          :id="`${tableName}-${key}`"
          :value="config[key]"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          type="text"
          @input="(e) => handleInput(key, (e.target as HTMLInputElement).value)"
        />
      </template>
      <template
        v-else-if="
          key === 'FILTER_OUT_VALUES_FROM_COLUMN' ||
          key === 'UNWANTED_COLUMNS' ||
          key === 'UNWANTED_SUBSTRINGS'
        "
      >
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
