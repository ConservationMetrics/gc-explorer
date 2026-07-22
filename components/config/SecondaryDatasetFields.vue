<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tableName: string;
    secondaryDataset?: string | null;
    availableTables?: string[];
    /** Primary dataset to exclude from the dropdown. */
    primaryDataset?: string;
  }>(),
  {
    secondaryDataset: null,
    availableTables: () => [],
    primaryDataset: "",
  },
);

const emit = defineEmits<{
  (e: "updateSecondaryDataset", value: string): void;
}>();

const selectOptions = computed(() => {
  const primary = props.primaryDataset.trim();
  const tables = props.availableTables.filter((name) => name !== primary);
  const current = props.secondaryDataset?.trim() ?? "";
  if (current && !tables.includes(current) && current !== primary) {
    return [current, ...tables];
  }
  return tables;
});

const selectValue = computed(() => props.secondaryDataset ?? "");
</script>

<template>
  <div class="space-y-2">
    <label
      :for="`${tableName}-secondaryDataset-select`"
      class="block text-sm font-medium text-gray-700"
    >
      {{ $t("secondaryDatasetLabel") }}
    </label>
    <select
      :id="`${tableName}-secondaryDataset-select`"
      data-testid="secondary-dataset-select"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
      :value="selectValue"
      @change="
        emit(
          'updateSecondaryDataset',
          ($event.target as HTMLSelectElement).value,
        )
      "
    >
      <option value="">{{ $t("none") }}</option>
      <option v-for="table in selectOptions" :key="table" :value="table">
        {{ table }}
      </option>
    </select>
  </div>
</template>
