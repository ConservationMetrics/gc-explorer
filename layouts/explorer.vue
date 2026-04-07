<script setup lang="ts">
import AppHeader from "@/components/shared/AppHeader.vue";
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <AppHeader />
    <slot />
  </div>
</template>
