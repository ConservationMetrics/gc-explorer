<script setup lang="ts">
import VueSlider from "vue-3-slider-component";

import type { Dataset } from "@/types/types";

const props = defineProps<{
  data: Dataset;
  timestampColumn: string;
}>();

const emit = defineEmits<{
  (e: "filter", payload: { start: Date | null; end: Date | null }): void;
}>();

/** Computes unique dates from the dataset and generates date options */
const dateInfo = computed(() => {
  // Try both original column name (with underscores) and transformed name (with spaces)
  // because transformSurveyData replaces underscores with spaces
  const columnVariants = [
    props.timestampColumn, // Original: e.g., "created_at"
    props.timestampColumn.replace(/_/g, " "), // Transformed: e.g., "created at"
  ];

  const dates = props.data
    .map((item) => {
      // Try to find the value using any of the column name variants
      let value = null;
      for (const columnName of columnVariants) {
        if (item[columnName]) {
          value = item[columnName];
          break;
        }
      }
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    })
    .filter((date): date is Date => date !== null);

  if (dates.length === 0) {
    return { min: null, max: null, options: [] };
  }

  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];

  // Generate date options (daily intervals)
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

/** Get the actual column name being used (handles underscore->space transformation) */
const actualColumnName = computed(() => {
  if (!props.data || props.data.length === 0) return props.timestampColumn;

  const columnVariants = [
    props.timestampColumn,
    props.timestampColumn.replace(/_/g, " "),
  ];

  for (const variant of columnVariants) {
    if (props.data[0][variant]) {
      return variant;
    }
  }

  return props.timestampColumn;
});

/** Emit filter when range changes */
const emitFilter = () => {
  if (selectedRange.value.length !== 2) return;

  const startStr = selectedRange.value[0];
  const endStr = selectedRange.value[1];

  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;

  // Set end date to end of day for inclusive filtering
  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  emit("filter", { start, end });
};

/** Initialize slider with full range and emit initial filter */
watch(
  dateInfo,
  async (info) => {
    if (info.options.length > 0 && selectedRange.value.length === 0) {
      selectedRange.value = [
        info.options[0],
        info.options[info.options.length - 1],
      ];
      // Emit initial filter after a tick
      await new Promise((resolve) => setTimeout(resolve, 0));
      emitFilter();
    }
  },
  { immediate: true },
);

/** Watch for slider changes after user interaction */
watch(selectedRange, () => {
  if (userInteracted.value) {
    emitFilter();
  }
});

/** Reset to full date range */
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
  <div class="timestamp-filter" data-testid="timestamp-filter">
    <div class="filter-header">
      <h4 data-testid="filter-heading">
        {{ $t("filterByDate") }}: <strong>{{ actualColumnName }}</strong>
      </h4>
      <button
        class="reset-button"
        data-testid="reset-date-button"
        @click="resetDateRange"
      >
        {{ $t("reset") }}
      </button>
    </div>
    <div v-if="dateInfo.options.length > 0" class="slider-container">
      <VueSlider
        v-model="selectedRange"
        class="date-slider"
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
    <div v-else class="no-data" data-testid="no-data-message">
      {{ $t("noColumnEntry") }}
    </div>
  </div>
</template>

<style scoped>
.timestamp-filter {
  background: #f5f5f5;
  padding: 10px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  min-width: 325px;
  max-width: 500px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.filter-header h4 {
  font-size: 1.2em;
  margin: 0;
  color: #333;
}

.reset-button {
  background: #6b7280;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.reset-button:hover {
  background: #4b5563;
}

.slider-container {
  padding: 10px 10px 30px;
}

.date-slider {
  margin-top: 10px;
}

.no-data {
  font-style: italic;
  color: #999;
  padding: 10px 0;
}
</style>
