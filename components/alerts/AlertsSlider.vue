<script setup>
import { ref, watch, onMounted } from "vue";
import VueSlider from "vue-3-slider-component";

const props = defineProps({
  dateOptions: Array,
});

// Set selected range to the first and last date options
onMounted(() => {
  if (props.dateOptions && props.dateOptions.length > 0) {
    selectedRange.value = [
      props.dateOptions[0],
      props.dateOptions[props.dateOptions.length - 1],
    ];
  }
});

// Emit date range changes if user has interacted with the slider
const selectedRange = ref([]);
const userInteracted = ref(false);
const emit = defineEmits(["date-range-changed"]);

watch(selectedRange, (newRange) => {
  if (userInteracted.value) {
    emit("date-range-changed", newRange);
  }
});
</script>

<template>
  <div class="mt-4 mb-10">
    <h3 class="text-2xl font-semibold mb-2">
      {{ $t("selectAlertDateRange") }}
    </h3>
    <div class="mb-6">
      <VueSlider
        v-model="selectedRange"
        class="date-slider"
        :contained="true"
        :data="dateOptions"
        :height="8"
        :hide-label="true"
        :marks="true"
        :tooltip="'always'"
        :tooltip-placement="'bottom'"
        @drag-start="userInteracted = true"
      />
    </div>
  </div>
</template>
