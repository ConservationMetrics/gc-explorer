<script setup lang="ts">
import { watch, reactive } from "vue";

import { toCamelCase } from "@/utils";

const props = defineProps({
  tableName: String,
  config: Object,
  views: Array,
  keys: Array,
});

const localConfig = reactive({ ...props.config });

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
      <h3>{{ $t("other") }} {{ $t("configuration") }}</h3>
    </div>
    <div v-for="key in keys" :key="key" class="config-field">
      <template v-if="key === 'LOGO_URL'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <input
          :id="`${tableName}-${key}`"
          v-model="localConfig[key]"
          class="input-field"
          placeholder="https://…"
          type="url"
        />
      </template>
    </div>
  </div>
</template>
