<script setup lang="ts">
import { ref } from "vue";
import { CalendarDays, Filter } from "lucide-vue-next";

import DataFilter from "@/components/shared/DataFilter.vue";
import TimestampFilter from "@/components/shared/TimestampFilter.vue";

import type { Dataset } from "@/types";

defineProps<{
  data: Dataset;
  filterColumn?: string;
  colorColumn?: string;
  timestampColumn?: string;
}>();

const emit = defineEmits<{
  filter: [values: string[]];
  "date-filter": [{ start: Date | null; end: Date | null }];
}>();

const showFilter = ref(false);
const showDateFilter = ref(false);

/** Toggles the category filter panel. */
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
  if (showFilter.value) showDateFilter.value = false;
};

/** Toggles the date filter panel. */
const toggleDateFilter = () => {
  showDateFilter.value = !showDateFilter.value;
  if (showDateFilter.value) showFilter.value = false;
};
</script>

<template>
  <div
    class="absolute right-16 top-3 z-[1010] flex items-start gap-2 sm:right-14 sm:top-4"
    data-testid="map-filter-controls"
  >
    <button
      v-if="filterColumn"
      type="button"
      class="flex h-10 w-10 items-center justify-center rounded-md bg-violet-700 text-white shadow-sm transition-colors hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
      :aria-label="$t('filterDataByColumn')"
      :aria-expanded="showFilter"
      data-testid="toggle-data-filter"
      @click="toggleFilter"
    >
      <Filter class="h-5 w-5" aria-hidden="true" />
    </button>
    <button
      v-if="timestampColumn"
      type="button"
      class="flex h-10 w-10 items-center justify-center rounded-md bg-violet-700 text-white shadow-sm transition-colors hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
      :aria-label="$t('filterByDate')"
      :aria-expanded="showDateFilter"
      data-testid="toggle-date-filter"
      @click="toggleDateFilter"
    >
      <CalendarDays class="h-5 w-5" aria-hidden="true" />
    </button>
    <div
      v-if="showFilter"
      class="map-filter-panel absolute right-0 top-12 w-[calc(100vw-5rem)] max-w-[600px]"
    >
      <DataFilter
        :data="data"
        :filter-column="filterColumn || ''"
        :color-column="colorColumn"
        :show-colored-dot="true"
        @filter="emit('filter', $event)"
      />
    </div>
    <div
      v-if="showDateFilter"
      class="map-filter-panel absolute right-0 top-12 w-[calc(100vw-5rem)] max-w-[500px]"
    >
      <TimestampFilter
        :data="data"
        :timestamp-column="timestampColumn || ''"
        @filter="emit('date-filter', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.map-filter-panel :deep(.filter-modal),
.map-filter-panel :deep(.timestamp-filter) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
</style>
