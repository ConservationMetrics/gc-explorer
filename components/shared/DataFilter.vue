<script setup lang="ts">
import { useI18n } from "vue-i18n";

import VueSelect from "vue3-select-component";

const { t } = useI18n();

const props = defineProps({
  data: Array,
  filterColumn: String,
  showColoredDot: Boolean,
});

const emit = defineEmits(["filter"]);

const defaultColoredDotColor = "#808080";
const selectedFilterValue = ref([]);

const getUniqueFilterValues = computed(() => {
  const allDataFilterValues = props.data.map((item) => {
    const value = item[props.filterColumn];
    const color = item["filter-color"] || defaultColoredDotColor;
    return {
      label: value !== null && value !== undefined ? value : t("noColumnEntry"),
      value: value,
      color: color,
    };
  });

  const uniqueFilterValues = new Map();
  let undefinedFilterValue;

  allDataFilterValues.forEach((item) => {
    if (item.value === undefined) {
      undefinedFilterValue = item;
    } else if (!uniqueFilterValues.has(item.value)) {
      uniqueFilterValues.set(item.value, item);
    }
  });

  if (undefinedFilterValue) {
    uniqueFilterValues.set(undefined, undefinedFilterValue);
  }

  return Array.from(uniqueFilterValues.values());
});

const emitFilterSelection = () => {
  if (selectedFilterValue.value.length > 0) {
    const labels = selectedFilterValue.value;
    emit("filter", labels);
  } else {
    emit("filter", "null");
  }
};
</script>

<template>
  <div class="filter-modal">
    <h4>
      {{ $t("filterDataByColumn") }}: <strong>{{ filterColumn }}</strong>
    </h4>
    <VueSelect
      :key="getUniqueFilterValues"
      v-model="selectedFilterValue"
      :is-multi="true"
      :options="getUniqueFilterValues"
      @option-selected="emitFilterSelection()"
      @option-deselected="emitFilterSelection()"
    >
      <!-- This is what shows in the listbox when selected -->
      <template #tag="{ option, removeOption }">
        <div class="option-box">
          <span
            v-if="showColoredDot"
            class="colored-dot"
            :style="{ backgroundColor: option.color }"
          ></span>
          <span class="selected-label">
            {{ option.label }}
            <button type="button" @click="removeOption">&times;</button>
          </span>
        </div>
      </template>
      <!-- These are the options in the dropdown -->
      <template #option="{ option }">
        <span
          v-if="showColoredDot"
          class="colored-dot dot-dropdown"
          :style="{ backgroundColor: option.color }"
        ></span>
        {{ option.label }}
      </template>
    </VueSelect>
  </div>
</template>

<style scoped>
.filter-modal {
  position: absolute;
  top: 10px;
  right: 50px;
  min-width: 325px;
  max-width: 600px;
  background: #f5f5f5;
  padding: 10px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  /* Rounded corners */
  z-index: 1000;

  h4 {
    font-size: 1.2em;
    margin: 0;
    color: #333;
  }

  .vue-select {
    width: 100%;
    margin: 5px 0;
    padding: 5px;

    --vs-selected-bg: #f9f9f9;

    .option-box {
      --vs-multi-value-gap: 4px;

      display: flex;
      align-items: center;
      gap: var(--vs-multi-value-gap);
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      padding: var(--vs-multi-value-padding);
      margin: var(--vs-multi-value-margin);
      color: var(--vs-multi-value-text-color);
      line-height: var(--vs-multi-value-line-height);
      background: var(--vs-multi-value-bg);
    }

    .option-box button {
      font-size: 1.25rem;
      background: none;
      transform: translateY(1px); /* Move text 3px lower */
    }

    .colored-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
      margin: 0 5px;
    }

    .dot-dropdown {
      margin: 5px 5px 0 0;
    }

    .selected-label {
      margin-right: 5px;
    }
  }

  .no-data {
    font-style: italic;
    max-width: 150px;
    color: #999;
  }
}
</style>
