<script setup lang="ts">
import { toCamelCase } from "@/utils";
import type { ViewConfig } from "@/types/types";

defineProps<{
  tableName: string;
  config: ViewConfig;
  views: string[];
  keys: string[];
}>();

const emit = defineEmits<{
  (e: "updateConfig", payload: Partial<ViewConfig>): void;
}>();

const handleInput = (key: string, value: string) => {
  emit("updateConfig", { [key]: value });
};
</script>

<template>
  <div class="config-section">
    <div class="config-header">
      <h3>{{ $t("media") }} {{ $t("configuration") }}</h3>
    </div>
    <div v-for="key in keys" :key="key" class="config-field">
      <template
        v-if="key === 'MEDIA_BASE_PATH_ALERTS' && views.includes('alerts')"
      >
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <input
          :id="`${tableName}-${key}`"
          :value="config[key]"
          class="input-field"
          placeholder="https://…"
          type="url"
          @input="(e) => handleInput(key, (e.target as HTMLInputElement).value)"
        />
      </template>
      <template v-else-if="key === 'MEDIA_BASE_PATH'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <input
          :id="`${tableName}-${key}`"
          :value="config[key]"
          class="input-field"
          placeholder="https://…"
          type="url"
          @input="(e) => handleInput(key, (e.target as HTMLInputElement).value)"
        />
      </template>
    </div>
  </div>
</template>
