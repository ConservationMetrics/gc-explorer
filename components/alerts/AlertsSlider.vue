<script setup lang="ts">
import VueSlider from "vue-3-slider-component";

const props = defineProps<{
  dateOptions?: Array<string>;
  selectedDateRange?: [string, string];
  showClearFilters?: boolean;
}>();

// Set selected range to the first and last date options
onMounted(() => {
  if (props.dateOptions && props.dateOptions.length > 0) {
    selectedRange.value = props.selectedDateRange ?? [
      props.dateOptions[0],
      props.dateOptions[props.dateOptions.length - 1],
    ];
  }
});

// Emit date range changes if user has interacted with the slider
const selectedRange = ref();
const userInteracted = ref(false);
const emit = defineEmits(["date-range-changed", "clear-filters"]);

watch(selectedRange, (newRange) => {
  if (userInteracted.value) {
    emit("date-range-changed", newRange);
  }
});
watch(
  () => props.selectedDateRange,
  (range) => {
    if (!props.showClearFilters || !props.dateOptions?.length) return;
    if (!range) userInteracted.value = false;
    selectedRange.value = range ?? [
      props.dateOptions[0],
      props.dateOptions[props.dateOptions.length - 1],
    ];
  },
);
</script>

<template>
  <div>
    <h3 class="text-2xl font-semibold tracking-tight mb-3">
      {{ $t("selectAlertDateRange") }}
    </h3>
    <div class="mb-8">
      <VueSlider
        v-model="selectedRange"
        class="date-slider"
        :contained="true"
        :data="dateOptions"
        :height="8"
        :hide-label="true"
        :marks="true"
        :process-style="{ backgroundColor: '#7c3aed' }"
        :tooltip="'always'"
        :tooltip-placement="'bottom'"
        @drag-start="userInteracted = true"
        @keydown="userInteracted = true"
      />
    </div>
    <div v-if="showClearFilters" class="flex justify-end">
      <button
        type="button"
        class="min-h-11 rounded-lg px-3 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:text-gray-400"
        :disabled="
          !selectedDateRange ||
          (selectedDateRange[0] === dateOptions?.[0] &&
            selectedDateRange[1] === dateOptions?.[dateOptions.length - 1])
        "
        @click="emit('clear-filters')"
      >
        Clear filters
      </button>
    </div>
  </div>
</template>

<style scoped>
.date-slider :deep(.vue-slider-dot-tooltip-inner) {
  border-color: #7c3aed;
  background-color: #7c3aed;
}
</style>
