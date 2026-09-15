<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    initialHeightRatio?: number;
    minHeightRatio?: number;
    maxHeightRatio?: number;
  }>(),
  {
    initialHeightRatio: 0.5,
    minHeightRatio: 0.25,
    maxHeightRatio: 0.9,
  },
);

const emit = defineEmits<{
  "height-change": [height: number];
}>();

const viewportHeight = ref(0);
const drawerHeight = ref(0);
const isDragging = ref(false);

const drawerStyle = computed(() => ({
  "--drawer-height": `${drawerHeight.value}px`,
}));

const minDrawerHeight = computed(
  () => viewportHeight.value * props.minHeightRatio,
);
const maxDrawerHeight = computed(
  () => viewportHeight.value * props.maxHeightRatio,
);
const visibleDrawerHeight = computed(() =>
  props.open ? drawerHeight.value : 0,
);

/**
 * Keeps a drawer height within the configured viewport bounds.
 *
 * @param {number} height - The requested drawer height in pixels.
 * @returns {number} The bounded drawer height in pixels.
 */
const clampDrawerHeight = (height: number) =>
  Math.min(Math.max(height, minDrawerHeight.value), maxDrawerHeight.value);

/**
 * Updates the drawer height from a pointer's vertical position.
 *
 * @param {number} clientY - The pointer's vertical viewport coordinate.
 * @returns {void}
 */
const resizeFromClientY = (clientY: number) => {
  drawerHeight.value = clampDrawerHeight(viewportHeight.value - clientY);
};

/**
 * Resets the drawer to its configured initial viewport ratio.
 *
 * @returns {void}
 */
const resetDrawerHeight = () => {
  if (!viewportHeight.value) return;
  drawerHeight.value = clampDrawerHeight(
    viewportHeight.value * props.initialHeightRatio,
  );
};

/**
 * Updates the viewport measurement and keeps the drawer within bounds.
 *
 * @returns {void}
 */
const updateViewportHeight = () => {
  viewportHeight.value = window.innerHeight;
  if (!drawerHeight.value) {
    resetDrawerHeight();
    return;
  }
  drawerHeight.value = clampDrawerHeight(drawerHeight.value);
};

/**
 * Starts pointer-based drawer resizing.
 *
 * @param {PointerEvent} event - The pointer interaction on the resize handle.
 * @returns {void}
 */
const startResize = (event: PointerEvent) => {
  if (!props.open) return;
  isDragging.value = true;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", stopResize);
};

/**
 * Resizes the drawer while the pointer moves.
 *
 * @param {PointerEvent} event - The active pointer interaction.
 * @returns {void}
 */
const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value) return;
  resizeFromClientY(event.clientY);
};

/**
 * Stops pointer-based drawer resizing.
 *
 * @returns {void}
 */
const stopResize = () => {
  isDragging.value = false;
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", stopResize);
};

/**
 * Adjusts the drawer height with accessible keyboard controls.
 *
 * @param {KeyboardEvent} event - The keyboard interaction on the resize handle.
 * @returns {void}
 */
const handleResizeKeydown = (event: KeyboardEvent) => {
  const step = Math.max(viewportHeight.value * 0.05, 24);
  if (event.key === "ArrowUp" || event.key === "PageUp") {
    event.preventDefault();
    drawerHeight.value = clampDrawerHeight(drawerHeight.value + step);
  } else if (event.key === "ArrowDown" || event.key === "PageDown") {
    event.preventDefault();
    drawerHeight.value = clampDrawerHeight(drawerHeight.value - step);
  } else if (event.key === "Home") {
    event.preventDefault();
    drawerHeight.value = maxDrawerHeight.value;
  } else if (event.key === "End") {
    event.preventDefault();
    drawerHeight.value = minDrawerHeight.value;
  }
};

watch(
  visibleDrawerHeight,
  (height) => {
    emit("height-change", height);
  },
  { immediate: true },
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      nextTick(resetDrawerHeight);
    }
  },
);

onMounted(() => {
  updateViewportHeight();
  window.addEventListener("resize", updateViewportHeight);
});

onBeforeUnmount(() => {
  stopResize();
  window.removeEventListener("resize", updateViewportHeight);
});
</script>

<template>
  <aside
    :class="[
      'mobile-resizable-drawer fixed z-50 flex max-w-full flex-col overflow-hidden bg-white shadow-lg transition-transform duration-300 ease-in-out',
      'bottom-0 left-0 w-full rounded-t-2xl',
      'sm:top-0 sm:bottom-auto sm:left-0 sm:h-full sm:w-[400px] sm:rounded-none',
      open
        ? 'translate-y-0 sm:translate-x-0'
        : 'translate-y-full sm:-translate-x-full',
      { 'transition-none': isDragging },
    ]"
    :style="drawerStyle"
  >
    <button
      class="flex h-8 shrink-0 touch-none items-center justify-center sm:hidden"
      aria-label="Resize sidebar"
      aria-orientation="horizontal"
      :aria-valuemax="Math.round(maxDrawerHeight)"
      :aria-valuemin="Math.round(minDrawerHeight)"
      :aria-valuenow="Math.round(drawerHeight)"
      role="separator"
      type="button"
      @keydown="handleResizeKeydown"
      @pointerdown="startResize"
    >
      <span
        class="h-1.5 w-12 rounded-full bg-gray-300"
        aria-hidden="true"
      ></span>
    </button>
    <div class="min-h-0 flex-1 overflow-y-auto">
      <slot></slot>
    </div>
  </aside>
</template>

<style scoped>
.mobile-resizable-drawer {
  height: var(--drawer-height, 50vh);
}

@media (min-width: 640px) {
  .mobile-resizable-drawer {
    height: 100%;
  }
}
</style>
