<template>
  <Teleport to="body">
    <motion.div
      v-if="isVisible"
      :initial="initialAnimation"
      :animate="{ opacity: 1, y: 0, x: 0, scale: 1 }"
      :exit="exitAnimation"
      :transition="{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        mass: 0.8
      }"
      class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 fixed z-50"
      :class="[toastClasses, positionClasses]"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <!-- Success Icon -->
            <svg
              v-if="type === 'success'"
              class="h-6 w-6 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <!-- Error Icon -->
            <svg
              v-else-if="type === 'error'"
              class="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <!-- Warning Icon -->
            <svg
              v-else-if="type === 'warning'"
              class="h-6 w-6 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <!-- Info Icon -->
            <svg
              v-else
              class="h-6 w-6 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
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
            <motion.button
              type="button"
              :whileHover="{ scale: 1.1 }"
              :whileTap="{ scale: 0.95 }"
              class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              @click="close"
            >
              <span class="sr-only">Close</span>
              <svg
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  </Teleport>
</template>

<script setup lang="ts">
interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  visible?: boolean
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

interface ToastEmits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 5000,
  visible: false,
  position: 'top-right'
})

const emit = defineEmits<ToastEmits>()

const isVisible = ref(props.visible)

// Auto-close after duration
let timeoutId: NodeJS.Timeout | null = null

const close = () => {
  isVisible.value = false
  emit('close')
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

const startAutoClose = () => {
  if (props.duration > 0) {
    timeoutId = setTimeout(() => {
      close()
    }, props.duration)
  }
}

// Watch for visibility changes
watch(() => props.visible, (newVisible) => {
  isVisible.value = newVisible
  if (newVisible) {
    startAutoClose()
  } else if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}, { immediate: true })

// Cleanup on unmount
onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})

// Toast styling based on type
const toastClasses = computed(() => {
  switch (props.type) {
    case 'success':
      return 'border-l-4 border-green-400'
    case 'error':
      return 'border-l-4 border-red-400'
    case 'warning':
      return 'border-l-4 border-yellow-400'
    case 'info':
    default:
      return 'border-l-4 border-blue-400'
  }
})

// Position classes based on position prop
const positionClasses = computed(() => {
  switch (props.position) {
    case 'top-left':
      return 'top-4 left-4'
    case 'top-center':
      return 'top-4 left-1/2 transform -translate-x-1/2'
    case 'top-right':
      return 'top-4 right-4'
    case 'bottom-left':
      return 'bottom-4 left-4'
    case 'bottom-center':
      return 'bottom-4 left-1/2 transform -translate-x-1/2'
    case 'bottom-right':
      return 'bottom-4 right-4'
    default:
      return 'top-4 right-4'
  }
})

// Animation based on position
const initialAnimation = computed(() => {
  switch (props.position) {
    case 'top-left':
    case 'top-center':
    case 'top-right':
      return { opacity: 0, y: -20, scale: 0.95 }
    case 'bottom-left':
    case 'bottom-center':
    case 'bottom-right':
      return { opacity: 0, y: 20, scale: 0.95 }
    default:
      return { opacity: 0, y: -20, x: 20, scale: 0.95 }
  }
})

const exitAnimation = computed(() => {
  switch (props.position) {
    case 'top-left':
    case 'top-center':
    case 'top-right':
      return { opacity: 0, y: -20, scale: 0.95 }
    case 'bottom-left':
    case 'bottom-center':
    case 'bottom-right':
      return { opacity: 0, y: 20, scale: 0.95 }
    default:
      return { opacity: 0, y: -20, x: 20, scale: 0.95 }
  }
})
</script>