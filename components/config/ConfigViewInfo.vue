<script setup lang="ts">
import ConfigFieldLabel from "@/components/config/ConfigFieldLabel.vue";
import ConfigImagePreview from "@/components/config/ConfigImagePreview.vue";
import { CONFIG_LIMITS } from "@/utils";
import { toCamelCase } from "@/utils/identifierUtils";
import type { ViewConfig } from "@/types";

defineProps<{
  tableName: string;
  config: ViewConfig;
  views: Array<string>;
  keys: Array<string>;
}>();

const emit = defineEmits(["updateConfig"]);
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6"
    data-testid="config-field-grid"
  >
    <template v-for="key in keys" :key="key">
      <div
        v-if="key !== 'LOGO_URL' || !views.includes('gallery')"
        class="space-y-2"
        :class="{
          'md:col-span-2':
            key === 'DATASET_TABLE' || key === 'VIEW_DESCRIPTION',
        }"
      >
        <template v-if="key === 'LOGO_URL'">
          <ConfigFieldLabel :for-id="`${tableName}-${key}`">
            {{ $t(toCamelCase(key)) }}
          </ConfigFieldLabel>
          <input
            :id="`${tableName}-${key}`"
            class="w-full px-4 py-2 bg-violet-100 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
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
            {{ $t("logoUrlDescription") }}
          </p>
          <ConfigImagePreview
            :src="config.LOGO_URL ?? ''"
            :alt="$t(toCamelCase(key))"
            fit="contain"
          />
        </template>
        <template v-else-if="key === 'DATASET_TABLE'">
          <ConfigFieldLabel :for-id="`${tableName}-${key}`">
            {{ $t("viewDisplayName") }}
          </ConfigFieldLabel>
          <input
            :id="`${tableName}-${key}`"
            class="w-full px-4 py-2 bg-violet-100 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
            :placeholder="$t('viewDisplayNamePlaceholder')"
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
                const clipboardData = e.clipboardData;
                const pastedText = clipboardData
                  ? clipboardData.getData('text')
                  : '';
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
            {{ $t("viewDisplayNameDescription") }}
          </p>
        </template>
        <template v-else-if="key === 'VIEW_HEADER_IMAGE'">
          <ConfigFieldLabel :for-id="`${tableName}-${key}`">
            {{ $t("viewHeaderImage") }}
          </ConfigFieldLabel>
          <input
            :id="`${tableName}-${key}`"
            class="w-full px-4 py-2 bg-violet-100 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
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
            {{ $t("viewHeaderImageDescription") }}
          </p>
          <ConfigImagePreview
            :src="config.VIEW_HEADER_IMAGE ?? ''"
            :alt="$t('viewHeaderImage')"
            fit="cover"
          />
        </template>
        <template v-else-if="key === 'VIEW_DESCRIPTION'">
          <ConfigFieldLabel :for-id="`${tableName}-${key}`">
            {{ $t("viewDescription") }}
          </ConfigFieldLabel>
          <textarea
            :id="`${tableName}-${key}`"
            class="w-full px-4 py-2 bg-violet-100 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-y"
            rows="3"
            :maxlength="CONFIG_LIMITS.VIEW_DESCRIPTION"
            :placeholder="$t('viewDescriptionPlaceholder')"
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
                const clipboardData = e.clipboardData;
                const pastedText = clipboardData
                  ? clipboardData.getData('text')
                  : '';
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
          ></textarea>
          <p class="text-gray-500 text-sm">
            {{ $t("viewDescriptionDescription") }}
          </p>
        </template>
      </div>
    </template>
  </div>
</template>
