<script setup lang="ts">
import { reactive, watch } from "vue";

import { VueTagsInput } from "@vojtechlanka/vue-tags-input";

import { toCamelCase } from "@/utils";
import { updateTags } from "@/composables/useTags";

const props = defineProps({
  tableName: String,
  config: Object,
  views: Array,
  keys: Array,
});

const localConfig = reactive({ ...props.config });
const initialTags = {
  MAPEO_CATEGORY_IDS: props.config.MAPEO_CATEGORY_IDS
    ? props.config.MAPEO_CATEGORY_IDS.split(",").map((tag) => ({ text: tag }))
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
      <h3>{{ $t("alerts") }} {{ $t("configuration") }}</h3>
    </div>
    <div v-for="key in keys" :key="key" class="config-field">
      <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
      <template v-if="key === 'MAPEO_TABLE'">
        <input
          :id="`${tableName}-${key}`"
          v-model="localConfig[key]"
          class="input-field"
        />
      </template>
      <template v-else-if="key === 'MAPEO_CATEGORY_IDS'">
        <VueTagsInput
          class="tag-field"
          :tags="tags[key]"
          @tags-changed="handleTagsChanged(key, $event)"
        />
      </template>
    </div>
  </div>
</template>
