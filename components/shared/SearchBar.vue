<script setup lang="ts">
import { Search } from "lucide-vue-next";

defineProps<{
  modelValue: string;
  placeholder: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="relative flex items-center mb-4">
    <Search class="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" />
    <input
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    />
  </div>
</template>
