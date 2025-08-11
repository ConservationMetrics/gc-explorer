<script setup lang="ts">
import type { MapLegendItem } from "@/types/types";

const props = defineProps<{
  mapLegendContent: MapLegendItem[];
}>();

const emit = defineEmits(["toggle-layer-visibility"]);

const localMapLegendContent = ref();

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
    <h2 class="text-2xl font-semibold mb-2">{{ $t("mapLegend") }}</h2>
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
          :class="['color-box', getTypeClass(item)]"
          :style="{ backgroundColor: item.color }"
        ></div>
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
</template>

<style scoped>
.map-legend {
  position: absolute;
  bottom: 30px;
  right: 10px;
  max-width: 450px;
  background-color: #fff;
  padding: 20px;
  line-height: 18px;
  overflow-y: auto;
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

@media (max-width: 768px) {
  .map-legend {
    display: none;
  }
}
</style>
