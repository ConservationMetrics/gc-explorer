<script setup lang="ts">
import type { ViewConfig } from "@/types/types";

defineProps<{
  tableName: string;
  config: ViewConfig;
  views: Array<string>;
  keys: Array<string>;
}>();

const emit = defineEmits(["updateConfig"]);
</script>

<template>
  <div class="config-section">
    <div class="config-header">
      <h3>{{ $t("dataset") }} {{ $t("configuration") }}</h3>
    </div>
    <div v-for="key in keys" :key="key" class="config-field">
      <template v-if="key === 'DATASET_TABLE'">
        <label :for="`${tableName}-${key}`">{{ $t("datasetTable") }}</label>
        <input
          :id="`${tableName}-${key}`"
          class="input-field"
          :placeholder="$t('datasetTablePlaceholder') || 'e.g., Fake Alerts'"
          type="text"
          :value="config[key]"
          @input="
            (e) =>
              emit('updateConfig', {
                [key]: (e.target as HTMLInputElement).value,
              })
          "
        />
        <p class="text-gray-500 text-sm mt-1">
          {{
            $t("datasetTableDescription") ||
            "Optional: A nicer display name for this dataset"
          }}
        </p>
      </template>
      <template v-else-if="key === 'VIEW_HEADER_IMAGE'">
        <label :for="`${tableName}-${key}`">{{ $t("viewHeaderImage") }}</label>
        <input
          :id="`${tableName}-${key}`"
          class="input-field"
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
        <p class="text-gray-500 text-sm mt-1">
          {{
            $t("viewHeaderImageDescription") ||
            "Optional: URL for the header background image"
          }}
        </p>
      </template>
      <template v-else-if="key === 'VIEW_DESCRIPTION'">
        <label :for="`${tableName}-${key}`">{{ $t("viewDescription") }}</label>
        <textarea
          :id="`${tableName}-${key}`"
          class="input-field"
          rows="3"
          :placeholder="
            $t('viewDescriptionPlaceholder') ||
            'Enter a description for this dataset...'
          "
          :value="config[key]"
          @input="
            (e) =>
              emit('updateConfig', {
                [key]: (e.target as HTMLInputElement).value,
              })
          "
        />
        <p class="text-gray-500 text-sm mt-1">
          {{
            $t("viewDescriptionDescription") ||
            "Optional: Description of this dataset"
          }}
        </p>
      </template>
    </div>
  </div>
</template>
