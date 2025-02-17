<script setup lang="ts">
import { reactive, watch } from "vue";
import { toCamelCase } from "@/utils";

import { VueTagsInput } from "@vojtechlanka/vue-tags-input";

import { updateTags } from "@/composables/useTags";

const props = defineProps({
  tableName: String,
  config: Object,
  views: Array,
  keys: Array,
});

const localConfig = reactive({ ...props.config });

// Set up refs for tags field

const initialTags = {
  FILTER_OUT_VALUES_FROM_COLUMN: props.config.FILTER_OUT_VALUES_FROM_COLUMN
    ? props.config.FILTER_OUT_VALUES_FROM_COLUMN.split(",").map((tag) => ({
        text: tag,
      }))
    : [],
  UNWANTED_COLUMNS: props.config.UNWANTED_COLUMNS
    ? props.config.UNWANTED_COLUMNS.split(",").map((tag) => ({
        text: tag,
      }))
    : [],
  UNWANTED_SUBSTRINGS: props.config.UNWANTED_SUBSTRINGS
    ? props.config.UNWANTED_SUBSTRINGS.split(",").map((tag) => ({
        text: tag,
      }))
    : [],
};
const { tags, handleTagsChanged } = updateTags(initialTags, localConfig);

// Watch for changes in localConfig and emit updates
const emit = defineEmits(["updateConfig"]);
watch(
  localConfig,
  (newValue) => {
    emit("updateConfig", newValue);
  },
  { deep: true },
);
</script>

<template>
  <div class="config-section">
    <div class="config-header">
      <h3>{{ $t("filtering") }} {{ $t("configuration") }}</h3>
    </div>
    <div v-for="key in keys" :key="key" class="config-field">
      <template v-if="key === 'FRONT_END_FILTER_COLUMN'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <input
          :id="`${tableName}-${key}`"
          v-model="localConfig[key]"
          class="input-field"
        />
      </template>
      <template
        v-else-if="
          key === 'FILTER_OUT_VALUES_FROM_COLUMN' ||
          key === 'UNWANTED_COLUMNS' ||
          key === 'UNWANTED_SUBSTRINGS'
        "
      >
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>

        <VueTagsInput
          class="tag-field"
          :tags="tags[key]"
          @tags-changed="handleTagsChanged(key, $event)"
        />
      </template>
    </div>
  </div>
</template>
