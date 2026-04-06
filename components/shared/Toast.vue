<script setup lang="ts">
import type { ToastEmits, ToastOptions } from "@/types";
import {
  faCircleCheck,
  faCircleInfo,
  faCircleXmark,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
const props = withDefaults(defineProps<ToastOptions>(), {
  type: "info",
  duration: 5000,
  visible: false,
  position: "top-right",
});

const emit = defineEmits<ToastEmits>();

const isVisible = ref(props.visible);

const close = () => {
  isExiting.value = true;
  // Wait for exit animation to complete before actually closing
  setTimeout(() => {
    isVisible.value = false;
    emit("close");
  }, 300); // Match the transition duration
};

// Watch for visibility changes
watch(
  () => props.visible,
  (newVisible) => {
    isVisible.value = newVisible;
  },
  { immediate: true },
);

// Toast styling based on type
const toastClasses = computed(() => {
  switch (props.type) {
    case "success":
      return "border-l-4 border-green-400";
    case "error":
      return "border-l-4 border-red-400";
    case "warning":
      return "border-l-4 border-yellow-400";
    case "info":
    default:
      return "border-l-4 border-blue-400";
  }
});

// Position classes based on position prop
const positionClasses = computed(() => {
  switch (props.position) {
    case "top-left":
      return "top-4 left-4";
    case "top-center":
      return "top-4 left-1/2 transform -translate-x-1/2";
    case "top-right":
      return "top-4 right-4";
    case "bottom-left":
      return "bottom-4 left-4";
    case "bottom-center":
      return "bottom-4 left-1/2 transform -translate-x-1/2";
    case "bottom-right":
      return "bottom-4 right-4";
    default:
      return "top-4 right-4";
  }
});

// Animation states for entry/exit
const isExiting = ref(false);
</script>

<template>
  <div
    v-if="isVisible"
    class="pointer-events-auto w-full max-w-md overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 fixed z-50 transition-all duration-300 ease-out"
    :class="[
      toastClasses,
      positionClasses,
      isExiting
        ? 'opacity-0 scale-95 translate-y-2'
        : 'opacity-100 scale-100 translate-y-0',
    ]"
  >
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <!-- Success Icon -->
          <FontAwesomeIcon
            v-if="type === 'success'"
            class="h-6 w-6 text-green-400"
            :icon="faCircleCheck"
            aria-hidden="true"
          />
          <!-- Error Icon -->
          <FontAwesomeIcon
            v-else-if="type === 'error'"
            class="h-6 w-6 text-red-400"
            :icon="faCircleXmark"
            aria-hidden="true"
          />
          <!-- Warning Icon -->
          <FontAwesomeIcon
            v-else-if="type === 'warning'"
            class="h-6 w-6 text-yellow-400"
            :icon="faTriangleExclamation"
            aria-hidden="true"
          />
          <!-- Info Icon -->
          <FontAwesomeIcon
            v-else
            class="h-6 w-6 text-blue-400"
            :icon="faCircleInfo"
            aria-hidden="true"
          />
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium text-gray-900">
            {{ title }}
          </p>
          <p v-if="message" class="mt-1 text-sm text-gray-500">
            {{ message }}
          </p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
          <button
            type="button"
            class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform duration-150 hover:scale-110 active:scale-95"
            @click="close"
          >
            <span class="sr-only">Close</span>
            <FontAwesomeIcon :icon="faXmark" class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
