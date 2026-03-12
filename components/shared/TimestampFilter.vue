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

/** Computes unique dates from the dataset and generates date options */
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
      dateMap: new Map<string, Date>(),
    };
  }

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];

  const options: string[] = [];
  const dateMap = new Map<string, Date>();
  const current = new Date(minDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(maxDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    options.push(dateStr);
    dateMap.set(dateStr, new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return {
    min: minDate,
    max: maxDate,
    options,
    dateMap,
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

/** Emit filter when range changes */
const emitFilter = () => {
  if (selectedRange.value.length !== 2) return;
  const [startStr, endStr] = selectedRange.value;
  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;
  if (end) end.setHours(23, 59, 59, 999);
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
    class="min-w-[325px] max-w-[500px] rounded-xl bg-gray-100 p-2.5 shadow-md"
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
        class="cursor-pointer rounded border-none bg-gray-500 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-600"
        data-testid="reset-date-button"
        @click="resetDateRange"
      >
        {{ $t("reset") }}
      </button>
    </div>
    <div v-if="dateInfo.options.length > 0" class="px-2.5 py-2.5 pb-8">
      <VueSlider
        v-model="selectedRange"
        class="mt-2.5"
        :contained="true"
        :data="dateInfo.options"
        :height="8"
        :hide-label="true"
        :marks="true"
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
