<script setup lang="ts">
import Toast from "./Toast.vue";

const { toasts, removeToast } = useToast();
</script>

<template>
  <!-- Toast container - no positioning here, individual toasts handle their own positioning -->
  <Toast
    v-for="(toast, index) in toasts"
    :key="toast.id"
    :type="toast.type"
    :title="toast.title"
    :message="toast.message"
    :duration="toast.duration || 0"
    :visible="true"
    :position="toast.position || 'top-right'"
    :style="{ zIndex: 1000 - index }"
    @close="removeToast(toast.id)"
  />
</template>
