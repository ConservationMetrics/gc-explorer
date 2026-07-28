<script setup lang="ts">
import AppHeader from "@/components/shared/AppHeader.vue";
import ToastContainer from "@/components/shared/ToastContainer.vue";
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <ToastContainer />
    <AppHeader />
    <slot> </slot>
  </div>
</template>
