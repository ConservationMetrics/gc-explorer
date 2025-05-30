<script setup lang="ts">
import { toCamelCase } from "@/utils";

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
      <h3>{{ $t("other") }} {{ $t("configuration") }}</h3>
    </div>
    <div v-for="key in keys" :key="key" class="config-field">
      <template v-if="key === 'LOGO_URL'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
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
      </template>
    </div>
  </div>
</template>
