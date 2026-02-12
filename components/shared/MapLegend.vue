<script setup lang="ts">
import type { MapLegendItem } from "@/types/types";

const props = defineProps<{
  mapLegendContent: MapLegendItem[];
}>();

const emit = defineEmits(["toggle-layer-visibility"]);

const localMapLegendContent = ref();
const isExpanded = ref(true);

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
    class="map-legend feature p-4 rounded-lg shadow-lg"
  >
    <button class="legend-header" @click="toggleExpanded">
      <h2 class="text-2xl font-semibold">{{ $t("mapLegend") }}</h2>
      <svg
        class="toggle-arrow"
        :class="{ rotated: !isExpanded }"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <Transition name="slide">
      <div v-show="isExpanded" class="legend-content">
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
                item.name === "Mapeo data"
                  ? $t("mapeoData")
                  : item.name === "Most recent alerts"
                    ? $t("mostRecentAlerts")
                    : item.name === "Previous alerts"
                      ? $t("previousAlerts")
                      : item.name
              }}
            </span>
          </label>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.map-legend {
  position: absolute;
  bottom: 30px;
  right: 62px;
  width: min(320px, calc(100vw - 92px));
  max-height: min(52vh, 380px);
  background-color: #fff;
  padding: 16px;
  line-height: 18px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
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
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  margin-bottom: 10px;
}

.legend-header h2 {
  margin: 0;
}

.toggle-arrow {
  transition: transform 0.3s ease;
  color: #333;
  flex-shrink: 0;
  margin-left: 10px;
}

.toggle-arrow.rotated {
  transform: rotate(180deg);
}

.legend-content {
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.slide-enter-active,
.slide-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 1000px;
  opacity: 1;
}

@media (max-width: 900px) {
  .map-legend {
    right: 58px;
    width: min(280px, calc(100vw - 86px));
    max-height: min(44vh, 320px);
    bottom: 18px;
  }
}
</style>
