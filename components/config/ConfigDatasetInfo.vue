<script setup lang="ts">
import type { ViewConfig } from "@/types/types";
import { CONFIG_LIMITS } from "@/utils";

defineProps<{
  tableName: string;
  config: ViewConfig;
  views: Array<string>;
  keys: Array<string>;
}>();

const emit = defineEmits(["updateConfig"]);
</script>

<template>
  <div class="space-y-6">
    <div v-for="key in keys" :key="key" class="space-y-2">
      <template v-if="key === 'DATASET_TABLE'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t("datasetTable") }}
        </label>
        <input
          :id="`${tableName}-${key}`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          :placeholder="$t('datasetTablePlaceholder') || 'e.g., Fake Alerts'"
          type="text"
          :maxlength="CONFIG_LIMITS.DATASET_TABLE"
          :value="config[key]"
          @input="
            (e) => {
              const value = (e.target as HTMLInputElement).value;
              const trimmedValue = value.substring(
                0,
                CONFIG_LIMITS.DATASET_TABLE,
              );
              (e.target as HTMLInputElement).value = trimmedValue;
              emit('updateConfig', {
                [key]: trimmedValue,
              });
            }
          "
          @paste="
            (e) => {
              e.preventDefault();
              const pastedText = (
                e.clipboardData || window.clipboardData
              ).getData('text');
              const trimmedValue = pastedText.substring(
                0,
                CONFIG_LIMITS.DATASET_TABLE,
              );
              (e.target as HTMLInputElement).value = trimmedValue;
              emit('updateConfig', {
                [key]: trimmedValue,
              });
            }
          "
        />
        <p class="text-gray-500 text-sm">
          {{
            $t("datasetTableDescription") ||
            "Optional: A nicer display name for this dataset"
          }}
        </p>
      </template>
      <template v-else-if="key === 'VIEW_HEADER_IMAGE'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t("viewHeaderImage") }}
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
        <p class="text-gray-500 text-sm">
          {{
            $t("viewHeaderImageDescription") ||
            "Optional: URL for the header background image"
          }}
        </p>
      </template>
      <template v-else-if="key === 'VIEW_DESCRIPTION'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t("viewDescription") }}
        </label>
        <textarea
          :id="`${tableName}-${key}`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-y"
          rows="3"
          :maxlength="CONFIG_LIMITS.VIEW_DESCRIPTION"
          :placeholder="
            $t('viewDescriptionPlaceholder') ||
            'Enter a description for this dataset...'
          "
          :value="config[key]"
          @input="
            (e) => {
              const value = (e.target as HTMLTextAreaElement).value;
              const trimmedValue = value.substring(
                0,
                CONFIG_LIMITS.VIEW_DESCRIPTION,
              );
              (e.target as HTMLTextAreaElement).value = trimmedValue;
              emit('updateConfig', {
                [key]: trimmedValue,
              });
            }
          "
          @paste="
            (e) => {
              e.preventDefault();
              const pastedText = (
                e.clipboardData || window.clipboardData
              ).getData('text');
              const trimmedValue = pastedText.substring(
                0,
                CONFIG_LIMITS.VIEW_DESCRIPTION,
              );
              (e.target as HTMLTextAreaElement).value = trimmedValue;
              emit('updateConfig', {
                [key]: trimmedValue,
              });
            }
          "
        />
        <p class="text-gray-500 text-sm">
          {{
            $t("viewDescriptionDescription") ||
            "Optional: Description of this dataset"
          }}
        </p>
      </template>
    </div>
  </div>
</template>
