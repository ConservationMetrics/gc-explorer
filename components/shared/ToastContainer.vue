<template>
  <div class="fixed z-50 space-y-2" :class="containerPositionClasses">
    <AnimatePresence mode="popLayout">
      <Toast
        v-for="(toast, index) in toasts"
        :key="toast.id"
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        :duration="0"
        :visible="true"
        :position="toast.position || 'top-right'"
        :style="{ zIndex: 1000 - index }"
        @close="removeToast(toast.id)"
      />
    </AnimatePresence>
  </div>
</template>

<script setup lang="ts">
import Toast from './Toast.vue'

const { toasts, removeToast } = useToast()

// Default container position - can be overridden by individual toast positions
const containerPositionClasses = computed(() => {
  // Since individual toasts handle their own positioning, this container just needs to be positioned
  // but not interfere with individual toast positioning
  return 'top-4 right-4'
})
</script>
