<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue?: string | null;
    options?: string[];
    placeholder: string;
    testId: string;
    excludeValue?: string;
    required?: boolean;
  }>(),
  {
    modelValue: "",
    options: () => [],
    excludeValue: "",
    required: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const selectOptions = computed(() => {
  const excluded = props.excludeValue.trim();
  const options = props.options.filter((option) => option !== excluded);
  const current = props.modelValue?.trim() ?? "";

  if (current && current !== excluded && !options.includes(current)) {
    return [current, ...options];
  }

  return options;
});
</script>

<template>
  <div class="space-y-2">
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    <select
      :id="id"
      :value="modelValue ?? ''"
      :data-testid="testId"
      :required="required"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
      @change="
        emit('update:modelValue', ($event.target as HTMLSelectElement).value)
      "
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="option in selectOptions" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
  </div>
</template>
