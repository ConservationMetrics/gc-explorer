<script setup lang="ts">
// @ts-expect-error - vue-tags-input does not have types
import { VueTagsInput } from "@vojtechlanka/vue-tags-input";

import { toCamelCase } from "@/utils";
import { updateTags } from "@/composables/useTags";

import type { ViewConfig } from "@/types/types";

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

const initialTags: Record<string, Tag[]> = {
  MAPEO_CATEGORY_IDS: props.config.MAPEO_CATEGORY_IDS
    ? props.config.MAPEO_CATEGORY_IDS.split(",").map((tag) => ({ text: tag }))
    : [],
};

const { tags, handleTagsChanged: rawHandleTagsChanged } = updateTags(
  initialTags,
  {},
);

// Strongly typed handler
const handleTagsChanged = (key: string, newTags: Tag[]): void => {
  rawHandleTagsChanged(key, newTags);
  const values = newTags.map((tag) => tag.text).join(",");
  emit("updateConfig", { [key]: values });
};
</script>

<template>
  <div class="space-y-6">
    <div v-for="key in keys" :key="key" class="space-y-2">
      <label
        :for="`${tableName}-${key}`"
        class="block text-sm font-medium text-gray-700"
      >
        {{ $t(toCamelCase(key)) }}
      </label>
      <template v-if="key === 'MAPEO_TABLE'">
        <input
          :id="`${tableName}-${key}`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          type="text"
          :value="config[key]"
          @input="
            (e) =>
              emit('updateConfig', {
                [key]: (e.target as HTMLInputElement).value,
              })
          "
        />
      </template>
      <template v-else-if="key === 'MAPEO_CATEGORY_IDS'">
        <VueTagsInput
          class="tag-field"
          :tags="tags[key]"
          @tags-changed="(newTags: Tag[]) => handleTagsChanged(key, newTags)"
        />
      </template>
    </div>
  </div>
</template>
