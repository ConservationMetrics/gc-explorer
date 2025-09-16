<template>
  <div>
    <!-- Toast Container for global notifications -->
    <ToastContainer />
    <slot />
  </div>
</template>

<script setup lang="ts">
import ToastContainer from '@/components/shared/ToastContainer.vue'
</script>
