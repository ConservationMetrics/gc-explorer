<script setup lang="ts">
import { computed, ref } from "vue";
import { Filter } from "lucide-vue-next";

import CopyMapLocationButton from "@/components/shared/map/CopyMapLocationButton.vue";
import DataFilter from "@/components/shared/filters/DataFilter.vue";
import TimestampFilter from "@/components/shared/filters/TimestampFilter.vue";

import type { Dataset } from "@/types";

defineProps<{
  data: Dataset;
  filtersActive?: boolean;
  filterColumn?: string;
  colorColumn?: string;
  timestampColumn?: string;
  showCopiedLocation?: boolean;
}>();

const emit = defineEmits<{
  filter: [values: string[]];
  "date-filter": [{ start: Date | null; end: Date | null }];
  "copy-location": [];
  "clear-filters": [];
}>();

const showFilters = ref(false);
const filtersMounted = ref(false);
const columnFilterActive = ref(false);
const dateFilterActive = ref(false);

const anyFilterApplied = computed(
  () => columnFilterActive.value || dateFilterActive.value,
);

/** Keeps the applied-filter indicator in sync, then forwards the selection. */
const onColumnFilter = (values: unknown[]) => {
  columnFilterActive.value = values.length > 0;
  emit("filter", values as string[]);
};

/** Keeps the applied-filter indicator in sync. */
const onDateFilterActive = (active: boolean) => {
  dateFilterActive.value = active;
};

/** Toggles the pane that holds both the category and date filters. */
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
  if (showFilters.value) {
    filtersMounted.value = true;
  }
};
</script>

<template>
  <div
    class="absolute right-16 top-3 z-[1010] flex items-start gap-2 sm:right-14 sm:top-4 sm:z-[1055]"
    data-testid="map-filter-controls"
  >
    <CopyMapLocationButton
      :show-copied="showCopiedLocation ?? false"
      @copy="emit('copy-location')"
    />
    <button
      v-if="filterColumn || timestampColumn"
      type="button"
      class="relative flex h-10 w-10 items-center justify-center rounded-md bg-violet-700 text-white shadow-sm transition-colors hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
      :class="{ 'ring-2 ring-white': anyFilterApplied }"
      :aria-label="$t('filters')"
      :aria-expanded="showFilters"
      :aria-pressed="anyFilterApplied"
      data-testid="toggle-filters"
      @click="toggleFilters"
    >
      <Filter class="h-5 w-5" aria-hidden="true" />
      <span
        v-if="anyFilterApplied"
        class="pointer-events-none absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-300 ring-2 ring-violet-700"
        data-testid="filters-applied"
        aria-hidden="true"
      ></span>
    </button>
    <button
      v-if="filterColumn || timestampColumn"
      type="button"
      class="h-10 rounded-md bg-violet-100 px-3 text-sm text-violet-800 disabled:opacity-50"
      :disabled="!filtersActive"
      @click="emit('clear-filters')"
    >
      {{ $t("clearAll") }}
    </button>
    <!-- Stay mounted once opened; opacity hides VueSlider tooltips without collapsing width. -->
    <div
      v-if="filtersMounted"
      class="map-filter-panel absolute right-0 top-12 w-[calc(100vw-5rem)] max-w-[400px]"
      :class="{
        'opacity-0': !showFilters,
        'pointer-events-none': !showFilters,
      }"
      :aria-hidden="!showFilters"
      :inert="!showFilters"
      data-testid="filters-panel"
    >
      <TimestampFilter
        v-if="timestampColumn"
        :data="data"
        :timestamp-column="timestampColumn"
        @filter="emit('date-filter', $event)"
        @active="onDateFilterActive"
      />
      <DataFilter
        v-if="filterColumn"
        :data="data"
        :filter-column="filterColumn"
        :color-column="colorColumn"
        :show-colored-dot="true"
        @filter="onColumnFilter"
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
