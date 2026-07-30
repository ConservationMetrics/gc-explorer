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

const resolveCategoryIds = (config: ViewConfig): string | undefined =>
  config.SECONDARY_CATEGORY_IDS || config.MAPEO_CATEGORY_IDS;

const initialCategoryIds = resolveCategoryIds(props.config);

const initialTags: Record<string, Tag[]> = {
  SECONDARY_CATEGORY_IDS: initialCategoryIds
    ? initialCategoryIds.split(",").map((tag) => ({ text: tag }))
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
    SECONDARY_CATEGORY_IDS: values,
    MAPEO_CATEGORY_IDS: undefined,
  });
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
      <template v-if="key === 'SECONDARY_CATEGORY_IDS'">
        <VueTagsInput
          class="tag-field"
          :tags="tags[key]"
          @tags-changed="(newTags: Tag[]) => handleTagsChanged(key, newTags)"
        />
      </template>
    </div>
  </div>
</template>
