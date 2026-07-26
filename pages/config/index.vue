<script setup lang="ts">
// Retired config dashboard (#523). Keep this stub so bookmarks hit a redirect
// with a one-time toast instead of a 404 or the [dataset] edit route.
await navigateTo({ path: "/", query: { reason: "moved" } });

definePageMeta({ layout: "explorer" });
</script>

<template>
  <div />
</template>
