<script setup lang="ts">
// Retired dataset hub (Phase 7 / #533). One dataset may have multiple views, so
// we cannot deep-link a specific map/gallery/alerts destination — send bookmarks home.
await navigateTo({ path: "/", query: { reason: "moved" } });

definePageMeta({ layout: "explorer" });
</script>

<template>
  <div />
</template>
