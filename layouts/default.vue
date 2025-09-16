<script setup lang="ts">
import ToastContainer from "@/components/shared/ToastContainer.vue";
</script>

<template>
  <div>
    <!-- Toast Container for global notifications -->
    <ToastContainer />
    <slot></slot>
  </div>
</template>
