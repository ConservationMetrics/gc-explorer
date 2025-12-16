<script setup lang="ts">
import { toCamelCase } from "@/utils";
import ConfigDatasetInfo from "./ConfigDatasetInfo.vue";

import type { ViewConfig } from "@/types/types";

const props = defineProps<{
  tableName: string;
  config: ViewConfig;
  views: Array<string>;
  keys: Array<string>;
}>();

const emit = defineEmits(["updateConfig"]);

const logoUrlKeys = computed(() =>
  props.keys.filter((key) => key === "LOGO_URL"),
);
const datasetInfoKeys = computed(() =>
  props.keys.filter((key) =>
    ["DATASET_TABLE", "VIEW_HEADER_IMAGE", "VIEW_DESCRIPTION"].includes(key),
  ),
);
</script>

<template>
  <div class="space-y-6">
    <div v-for="key in logoUrlKeys" :key="key" class="space-y-2">
      <template v-if="key === 'LOGO_URL'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <input
          :id="`${tableName}-${key}`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          placeholder="https://…"
          type="url"
          :value="config[key]"
          @input="
            (e) =>
              emit('updateConfig', {
                [key]: (e.target as HTMLInputElement).value,
              })
          "
        />
      </template>
    </div>
    <ConfigDatasetInfo
      v-if="datasetInfoKeys.length > 0"
      :table-name="tableName"
      :views="views"
      :config="config"
      :keys="datasetInfoKeys"
      @update-config="emit('updateConfig', $event)"
    />
  </div>
</template>
