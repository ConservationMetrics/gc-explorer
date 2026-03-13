<script setup lang="ts">
import VueSlider from "vue-3-slider-component";

import type { Dataset } from "@/types";

const props = defineProps<{
  data: Dataset;
  timestampColumn: string;
}>();

const emit = defineEmits<{
  (e: "filter", payload: { start: Date | null; end: Date | null }): void;
}>();

/** Unique months that contain data, as "YYYY-MM", for month-level slider (like alerts). */
const dateInfo = computed(() => {
  const columnVariants = [
    props.timestampColumn,
    props.timestampColumn.replace(/_/g, " "),
  ];

  const dates = props.data
    .map((item) => {
      let value: unknown = null;
      for (const columnName of columnVariants) {
        if (item[columnName] != null) {
          value = item[columnName];
          break;
        }
      }
      if (value == null) return null;
      const date = new Date(String(value));
      return Number.isNaN(date.getTime()) ? null : date;
    })
    .filter((date): date is Date => date !== null);

  if (dates.length === 0) {
    return {
      min: null,
      max: null,
      options: [],
    };
  }

  const monthSet = new Set<string>();
  for (const d of dates) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    monthSet.add(`${y}-${m}`);
  }
  const options = [...monthSet].sort();

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  return {
    min: sortedDates[0],
    max: sortedDates[sortedDates.length - 1],
    options,
  };
});

const selectedRange = ref<string[]>([]);
const userInteracted = ref(false);

/** Resolve column name (handles underscore → space transformation in display data) */
const actualColumnName = computed(() => {
  if (!props.data?.length) return props.timestampColumn;
  const columnVariants = [
    props.timestampColumn,
    props.timestampColumn.replace(/_/g, " "),
  ];
  for (const variant of columnVariants) {
    if (props.data[0][variant] != null) return variant;
  }
  return props.timestampColumn;
});

/** Parse "YYYY-MM" to last moment of that month (23:59:59.999). */
function endOfMonth(year: number, month1Based: number): Date {
  const d = new Date(year, month1Based, 0, 23, 59, 59, 999);
  return d;
}

/** Emit filter when range changes (options are "YYYY-MM" months). */
const emitFilter = () => {
  if (selectedRange.value.length !== 2) return;
  const [startStr, endStr] = selectedRange.value;
  if (!startStr || !endStr) {
    emit("filter", { start: null, end: null });
    return;
  }
  const [startY, startM] = startStr.split("-").map(Number);
  const [endY, endM] = endStr.split("-").map(Number);
  const start = new Date(startY, startM - 1, 1, 0, 0, 0, 0);
  const end = endOfMonth(endY, endM);
  emit("filter", { start, end });
};

watch(
  dateInfo,
  async (info) => {
    if (info.options.length > 0 && selectedRange.value.length === 0) {
      selectedRange.value = [
        info.options[0],
        info.options[info.options.length - 1],
      ];
      await nextTick();
      emitFilter();
    }
  },
  { immediate: true },
);

watch(selectedRange, () => {
  if (userInteracted.value) emitFilter();
});

const isResetDisabled = computed(() => {
  const info = dateInfo.value;
  if (info.options.length === 0 || selectedRange.value.length !== 2) {
    return true;
  }
  const [minOpt, maxOpt] = [
    info.options[0],
    info.options[info.options.length - 1],
  ];
  const [selMin, selMax] = selectedRange.value;
  return selMin === minOpt && selMax === maxOpt;
});

const resetDateRange = () => {
  if (dateInfo.value.options.length > 0) {
    userInteracted.value = false;
    selectedRange.value = [
      dateInfo.value.options[0],
      dateInfo.value.options[dateInfo.value.options.length - 1],
    ];
    userInteracted.value = true;
    emitFilter();
  }
};
</script>

<template>
  <div
    class="mb-2 min-w-[325px] max-w-[500px] rounded-xl bg-gray-100 p-2.5 shadow-md"
    data-testid="timestamp-filter"
  >
    <div
      class="mb-2.5 flex items-center justify-between"
      data-testid="filter-header"
    >
      <h4 class="m-0 text-lg text-gray-800" data-testid="filter-heading">
        {{ $t("filterByDate") }}: <strong>{{ actualColumnName }}</strong>
      </h4>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm"
        data-testid="reset-date-button"
        :disabled="isResetDisabled"
        @click="resetDateRange"
      >
        {{ $t("reset") }}
      </button>
    </div>
    <div v-if="dateInfo.options.length > 0" class="px-2.5 py-2.5 pb-8">
      <VueSlider
        v-model="selectedRange"
        class="mt-2.5 date-slider"
        :contained="true"
        :data="dateInfo.options"
        :height="8"
        :hide-label="true"
        :marks="true"
        :process-style="{ backgroundColor: '#3b82f6' }"
        :rail-style="{ backgroundColor: '#e5e7eb' }"
        :tooltip="'always'"
        :tooltip-placement="'bottom'"
        data-testid="date-slider"
        @drag-start="userInteracted = true"
      />
    </div>
    <div
      v-else
      class="py-2.5 italic text-gray-400"
      data-testid="no-data-message"
    >
      {{ $t("noColumnEntry") }}
    </div>
  </div>
</template>
