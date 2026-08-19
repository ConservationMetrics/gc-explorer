<script setup lang="ts">
import { computed } from "vue";

import type { ColumnEntry } from "@/types";

const props = withDefaults(
  defineProps<{
    columns: ColumnEntry[];
    id: string;
    label: string;
    loading?: boolean;
    modelValue?: string;
    placeholder: string;
  }>(),
  {
    loading: false,
    modelValue: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const hasUnavailableValue = computed(
  () =>
    !props.loading &&
    Boolean(props.modelValue) &&
    !props.columns.some(
      (column) => column.sql_column === props.modelValue?.trim(),
    ),
);

const optionLabel = (column: ColumnEntry): string => {
  return column.original_column === column.sql_column
    ? column.sql_column
    : `${column.original_column} (${column.sql_column})`;
};
</script>

<template>
  <div class="space-y-2 min-w-0">
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    <select
      :id="id"
      :value="modelValue"
      :disabled="loading"
      :aria-invalid="hasUnavailableValue"
      :aria-describedby="hasUnavailableValue ? `${id}-error` : undefined"
      class="w-full px-4 py-2 text-base bg-violet-100 border rounded-lg focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-violet-500 transition-colors disabled:cursor-wait disabled:opacity-60"
      :class="hasUnavailableValue ? 'border-red-400' : 'border-violet-200'"
      @change="
        emit('update:modelValue', ($event.target as HTMLSelectElement).value)
      "
    >
      <option value="">
        {{ loading ? $t("loading") : placeholder }}
      </option>
      <option v-if="hasUnavailableValue" :value="modelValue" disabled>
        {{ modelValue }}
      </option>
      <option
        v-for="column in columns"
        :key="column.sql_column"
        :value="column.sql_column"
      >
        {{ optionLabel(column) }}
      </option>
    </select>
    <p
      v-if="hasUnavailableValue"
      :id="`${id}-error`"
      class="text-sm text-red-600"
      role="alert"
    >
      {{ $t("columnNotAvailable") }}
    </p>
  </div>
</template>
