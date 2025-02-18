<script setup lang="ts">
import type { ViewConfig } from "@/types/types";

const props = defineProps<{
  tableName: string;
  config: ViewConfig;
  views: Array<string>;
  keys: Array<string>;
}>();

const localViews = ref([...props.views]);

// Watch for changes to views and emit updates
const emit = defineEmits(["update:views"]);

watch(
  () => props.views,
  (newViews) => {
    localViews.value = [...newViews];
  },
  { deep: true },
);

function updateViews() {
  emit("update:views", localViews.value);
}
</script>

<template>
  <div class="config-section">
    <div v-for="key in keys" :key="key" class="config-field">
      <template v-if="key === 'VIEWS'">
        <div class="config-header">
          <h3>{{ $t("views") }}</h3>
        </div>
        <div class="views-checkboxes">
          <label>
            <input
              v-model="localViews"
              type="checkbox"
              value="map"
              @change="updateViews"
            />
            {{ $t("map") }}
          </label>
          <label>
            <input
              v-model="localViews"
              type="checkbox"
              value="gallery"
              @change="updateViews"
            />
            {{ $t("gallery") }}
          </label>
          <label>
            <input
              v-model="localViews"
              type="checkbox"
              value="alerts"
              @change="updateViews"
            />
            {{ $t("alerts") }}
          </label>
        </div>
      </template>
    </div>
  </div>
</template>
