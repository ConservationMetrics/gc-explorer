<script setup lang="ts">
defineProps<{
  forId?: string;
  required?: boolean;
}>();
</script>

<template>
  <label
    :for="forId"
    class="inline-flex items-center gap-1 text-sm font-bold text-gray-700"
  >
    <slot></slot>
    <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
  </label>
</template>
