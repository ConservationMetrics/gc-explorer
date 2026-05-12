<script lang="ts" setup>
const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <div
    :class="['glass-card w-full rounded-3xl p-6 sm:p-9 md:p-12', props.class]"
  >
    <slot></slot>
  </div>
</template>

<style scoped>
.glass-card {
  background-color: rgb(255 255 255 / 0.6);
  border: 1px solid rgb(255 255 255 / 0.42);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.45) inset,
    0 24px 56px -16px rgb(28 25 23 / 0.32),
    0 12px 24px -12px rgb(28 25 23 / 0.14);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}
</style>
