<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();
const picker = ref<HTMLElement>();
const active = computed(() =>
  route.query.sidebarPrototype === "current" ? 0 : 1,
);
const highlight = ref({ width: "0px", transform: "translateX(0px)" });
const ready = ref(false);

/** Move the prototype highlight after the active option renders. */
const positionHighlight = () => {
  const item =
    picker.value?.querySelectorAll<HTMLButtonElement>("button")[active.value];
  if (item)
    highlight.value = {
      width: `${item.offsetWidth}px`,
      transform: `translateX(${item.offsetLeft}px)`,
    };
};

/** Select a direction without replacing the live map or its current camera. */
const select = (index: number) =>
  router.replace({
    query: {
      ...route.query,
      sidebarPrototype: index === 0 ? "current" : "revised",
    },
  });

/** Keep number shortcuts out of forms, date sliders and the drawer handle. */
const onKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  if (
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    target.closest(
      "input,textarea,select,[contenteditable=true],[role=slider],[role=separator]",
    )
  )
    return;
  if (event.key === "1") void select(0);
  if (event.key === "2") void select(1);
};
watch(active, () => nextTick(positionHighlight));
onMounted(() => {
  positionHighlight();
  requestAnimationFrame(() => {
    ready.value = true;
  });
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("resize", positionHighlight);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  window.removeEventListener("resize", positionHighlight);
});
</script>

<template>
  <nav
    ref="picker"
    class="proto-picker"
    data-position="top"
    :data-ready="ready || undefined"
    aria-label="Sidebar prototype variants"
  >
    <span
      class="proto-picker-highlight"
      :style="highlight"
      aria-hidden="true"
    ></span>
    <button
      v-for="(name, index) in ['Current', 'Revised']"
      :key="name"
      class="proto-picker-item"
      :data-active="active === index || undefined"
      :aria-current="active === index ? 'true' : undefined"
      @click="select(index)"
    >
      {{ name }}
    </button>
  </nav>
</template>

<style scoped>
.proto-picker {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(10, 10, 10, 0.82);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  backdrop-filter: blur(12px) saturate(1.4);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 8px 24px rgba(0, 0, 0, 0.24),
    0 2px 6px rgba(0, 0, 0, 0.12);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
}

.proto-picker-highlight {
  position: absolute;
  top: 4px;
  left: 0;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  will-change: transform;
}

/* The slide is enabled only after first paint (data-ready), so load doesn't animate. */
.proto-picker[data-ready] .proto-picker-highlight {
  transition:
    transform 250ms cubic-bezier(0.23, 1, 0.32, 1),
    width 250ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .proto-picker[data-ready] .proto-picker-highlight {
    transition: none;
  }
}

.proto-picker-item {
  position: relative; /* sits above the highlight */
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font: inherit;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.proto-picker-item:hover {
  color: rgba(255, 255, 255, 0.85);
}

.proto-picker-item:active {
  transform: scale(0.97);
}

.proto-picker-item:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.4);
  outline-offset: 2px;
}

.proto-picker-item[data-active] {
  color: #fff;
}

.proto-picker-divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.12);
}

.proto-picker-replay {
  padding: 0 10px;
  font-size: 14px;
}

.proto-picker[data-position="top"] {
  bottom: auto;
  top: 24px;
}
@media (min-width: 640px) and (max-width: 1079px) {
  .proto-picker[data-position="top"] {
    top: auto;
    bottom: 16px;
  }
}
@media (min-width: 640px) and (max-width: 1079px) and (max-height: 593px) {
  .proto-picker[data-position="top"] {
    left: calc(50% - 100px);
  }
}
</style>
