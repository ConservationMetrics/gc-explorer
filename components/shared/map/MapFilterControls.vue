<script setup lang="ts">
import { ref } from "vue";
import { CalendarDays, Filter } from "lucide-vue-next";

import CopyMapLocationButton from "@/components/shared/map/CopyMapLocationButton.vue";
import DataFilter from "@/components/shared/filters/DataFilter.vue";
import TimestampFilter from "@/components/shared/filters/TimestampFilter.vue";

import type { Dataset } from "@/types";

defineProps<{
  data: Dataset;
  filterColumn?: string;
  colorColumn?: string;
  timestampColumn?: string;
  showCopiedLocation?: boolean;
}>();

const emit = defineEmits<{
  filter: [values: string[]];
  "date-filter": [{ start: Date | null; end: Date | null }];
  "copy-location": [];
}>();

const showFilter = ref(false);
const showDateFilter = ref(false);
const filterMounted = ref(false);
const dateFilterMounted = ref(false);
const columnFilterActive = ref(false);
const dateFilterActive = ref(false);

const filterButtonClass =
  "relative flex h-10 w-10 items-center justify-center rounded-md bg-violet-700 text-white shadow-sm transition-colors hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2";

/** Keeps the column-applied button state in sync, then forwards the selection. */
const onColumnFilter = (values: unknown[]) => {
  columnFilterActive.value = values.length > 0;
  emit("filter", values as string[]);
};

/** Keeps the date-applied button state in sync. */
const onDateFilterActive = (active: boolean) => {
  dateFilterActive.value = active;
};

/** Toggles the category filter panel. */
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
  if (showFilter.value) {
    filterMounted.value = true;
    showDateFilter.value = false;
  }
};

/** Toggles the date filter panel. */
const toggleDateFilter = () => {
  showDateFilter.value = !showDateFilter.value;
  if (showDateFilter.value) {
    dateFilterMounted.value = true;
    showFilter.value = false;
  }
};
</script>

<template>
  <div
    class="absolute right-16 top-3 z-[1010] flex items-start gap-2 sm:right-14 sm:top-4"
    data-testid="map-filter-controls"
  >
    <CopyMapLocationButton
      :show-copied="showCopiedLocation ?? false"
      @copy="emit('copy-location')"
    />
    <button
      v-if="filterColumn"
      type="button"
      :class="[
        filterButtonClass,
        columnFilterActive ? 'ring-2 ring-white' : '',
      ]"
      :aria-label="$t('filterDataByColumn')"
      :aria-expanded="showFilter"
      :aria-pressed="columnFilterActive"
      data-testid="toggle-data-filter"
      @click="toggleFilter"
    >
      <Filter class="h-5 w-5" aria-hidden="true" />
      <span
        v-if="columnFilterActive"
        class="pointer-events-none absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-300 ring-2 ring-violet-700"
        data-testid="column-filter-applied"
        aria-hidden="true"
      ></span>
    </button>
    <button
      v-if="timestampColumn"
      type="button"
      :class="[filterButtonClass, dateFilterActive ? 'ring-2 ring-white' : '']"
      :aria-label="$t('filterByDate')"
      :aria-expanded="showDateFilter"
      :aria-pressed="dateFilterActive"
      data-testid="toggle-date-filter"
      @click="toggleDateFilter"
    >
      <CalendarDays class="h-5 w-5" aria-hidden="true" />
      <span
        v-if="dateFilterActive"
        class="pointer-events-none absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-300 ring-2 ring-violet-700"
        data-testid="date-filter-applied"
        aria-hidden="true"
      ></span>
    </button>
    <div
      v-if="filterMounted"
      class="map-filter-panel absolute right-0 top-12 w-[calc(100vw-5rem)] max-w-[400px]"
      :class="{ 'opacity-0': !showFilter, 'pointer-events-none': !showFilter }"
      :aria-hidden="!showFilter"
      :inert="!showFilter"
      data-testid="data-filter-panel"
    >
      <DataFilter
        :data="data"
        :filter-column="filterColumn || ''"
        :color-column="colorColumn"
        :show-colored-dot="true"
        @filter="onColumnFilter"
      />
    </div>
    <!-- Stay mounted once opened; opacity hides VueSlider tooltips without collapsing width. -->
    <div
      v-if="dateFilterMounted"
      class="map-filter-panel absolute right-0 top-12 w-[calc(100vw-5rem)] max-w-[400px]"
      :class="{
        'opacity-0': !showDateFilter,
        'pointer-events-none': !showDateFilter,
      }"
      :aria-hidden="!showDateFilter"
      :inert="!showDateFilter"
      data-testid="date-filter-panel"
    >
      <TimestampFilter
        :data="data"
        :timestamp-column="timestampColumn || ''"
        @filter="emit('date-filter', $event)"
        @active="onDateFilterActive"
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

.map-filter-panel[aria-hidden="true"] :deep(.vue-slider-dot-tooltip) {
  display: none;
}
</style>
