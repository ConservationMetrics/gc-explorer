<script setup lang="ts">
import type { MapLegendItem } from "@/types";
import { Layers, X } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    mapLegendContent: MapLegendItem[];
    mobileDrawerHeight?: number;
  }>(),
  {
    mobileDrawerHeight: 0,
  },
);

const emit = defineEmits(["toggle-layer-visibility"]);

const localMapLegendContent = ref();
const isExpanded = ref(false);

onMounted(() => {
  // Ensure all items are visible initially
  localMapLegendContent.value = props.mapLegendContent.map((item) => ({
    ...item,
    visible: true,
  }));
});

/** Layer visibility toggles */
const toggleLayerVisibility = (item: MapLegendItem) => {
  emit("toggle-layer-visibility", item);
};

/** Toggle legend expansion */
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

/** Get the class for the geometry type */
const getTypeClass = (item: MapLegendItem) => {
  return `${item.type}-box`;
};

// Watch for changes in mapLegendContent prop
watch(
  () => props.mapLegendContent,
  (newContent) => {
    localMapLegendContent.value = newContent.map((item) => ({
      ...item,
      visible: true,
    }));
  },
);
</script>

<template>
  <div
    data-testid="map-legend"
    class="map-legend feature rounded-lg shadow-lg"
    :class="{ 'is-collapsed': !isExpanded }"
    :style="{
      '--mobile-drawer-height': `${props.mobileDrawerHeight}px`,
    }"
  >
    <button
      v-if="!isExpanded"
      class="legend-trigger"
      data-testid="map-legend-toggle"
      :aria-expanded="false"
      :aria-label="$t('mapLegend')"
      @click="toggleExpanded"
    >
      <Layers class="h-5 w-5" aria-hidden="true" />
    </button>
    <span v-if="!isExpanded" class="legend-tooltip" role="tooltip">
      {{ $t("mapLegend") }}
    </span>
    <template v-else>
      <header class="legend-header">
        <span class="flex items-center gap-2 text-lg font-semibold">
          <Layers class="h-5 w-5 text-violet-700" aria-hidden="true" />
          {{ $t("mapLegend") }}
        </span>
        <button
          class="legend-close"
          data-testid="map-legend-close"
          type="button"
          :aria-label="$t('close')"
          @click="isExpanded = false"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </header>
      <div class="legend-content">
        <div
          v-for="item in localMapLegendContent"
          :key="item.id"
          class="legend-item"
        >
          <input
            :id="item.id"
            v-model="item.visible"
            data-testid="map-legend-checkbox"
            class="mr-2"
            type="checkbox"
            :checked="item.visible"
            @change="toggleLayerVisibility(item)"
          />
          <label :for="item.id">
            <div v-if="item.iconUrl" class="icon-box">
              <img :src="item.iconUrl" :alt="item.name" class="legend-icon" />
            </div>
            <div
              v-else
              :class="[
                'color-box',
                getTypeClass(item),
                {
                  'with-hash':
                    item.type === 'circle' && item.id.includes('alerts'),
                },
              ]"
              :style="{ backgroundColor: item.color }"
            >
              <span
                v-if="item.type === 'circle' && item.id.includes('alerts')"
                class="hash-mark"
                >#</span
              >
            </div>
            <span>
              {{
                item.name === "Most recent alerts"
                  ? $t("mostRecentAlerts")
                  : item.name === "Previous alerts"
                    ? $t("previousAlerts")
                    : item.name
              }}
            </span>
          </label>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.map-legend {
  position: absolute;
  bottom: 30px;
  right: 10px;
  width: min(315px, calc(100vw - 20px));
  max-height: min(38vh, 260px);
  background-color: #fff;
  border: 1px solid #ddd6fe;
  padding: 16px;
  line-height: 18px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1020;
}

.map-legend.is-collapsed {
  height: 44px;
  padding: 0;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  pointer-events: none;
}

.color-box {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 10px;
  vertical-align: middle;
  position: relative;
}

.color-box:not(.circle-box) {
  flex-shrink: 0;
}

.fill-box {
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70% !important;
  transform: rotate(60deg);
}

.line-box {
  display: inline-block;
  width: 20px;
  height: 3px !important;
  transform: translateY(-50%);
}

.circle-box {
  border-radius: 50%;
  width: 10px;
  height: 10px;
  margin: 5px;
  margin-right: 15px;
}

/* Larger circles for alerts */
.circle-box.with-hash {
  width: 20px;
  height: 20px;
  position: relative;
  margin: 0 10px 0 0;
}

/* Add hash/pound (#) symbol for clustered alert circles */
.hash-mark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 12px;
  line-height: 1;
  font-style: normal;
  font-family: Arial, sans-serif;
}

.icon-box {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 10px;
  vertical-align: middle;
  position: relative;
}

.legend-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: none;
  padding: 0;
  margin-bottom: 10px;
}

.legend-trigger {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 0.5rem;
  color: white;
  background: rgb(109 40 217);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  pointer-events: auto;
  transition: background-color 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

.legend-trigger:hover {
  background: rgb(91 33 182);
}

.legend-tooltip {
  position: absolute;
  top: 7px;
  right: 54px;
  padding: 6px 9px;
  border-radius: 4px;
  background: rgb(0 0 0 / 0.85);
  color: white;
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateX(4px);
  transition:
    opacity 150ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

.legend-trigger:focus-visible + .legend-tooltip {
  opacity: 1;
  transform: translateX(0);
}

@media (hover: hover) and (pointer: fine) {
  .legend-trigger:hover + .legend-tooltip {
    opacity: 1;
    transform: translateX(0);
  }
}

.legend-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 9999px;
  color: rgb(55 65 81);
  background: rgb(243 244 246);
  transition: background-color 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

.legend-close:hover {
  background: rgb(229 231 235);
}

.legend-content {
  animation: legend-content-enter 180ms cubic-bezier(0.23, 1, 0.32, 1);
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
}

@keyframes legend-content-enter {
  from {
    clip-path: inset(0 0 100% 0);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .legend-trigger,
  .legend-tooltip,
  .legend-close,
  .legend-content {
    animation: none;
    transition: none;
  }
}

@media (max-width: 900px) {
  .map-legend {
    right: 10px;
    width: min(265px, calc(100vw - 20px));
    bottom: calc(var(--mobile-drawer-height, 0px) + 44px);
    max-height: min(
      32vh,
      220px,
      calc(100vh - var(--mobile-drawer-height, 0px) - 60px)
    );
  }
}
</style>
