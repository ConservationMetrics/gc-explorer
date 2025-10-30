<script setup lang="ts">
import Datepicker from "vue-datepicker-next";
import "vue-datepicker-next/index.css";

import type { Basemap, BasemapConfig } from "~/types/types";

const props = defineProps({
  hasRulerControl: Boolean,
  mapboxStyle: String,
  mapboxBasemaps: {
    type: Array as () => BasemapConfig[],
    default: () => [],
  },
  planetApiKey: String,
});

const emit = defineEmits(["basemapSelected"]);

const topPosition = computed(() => (props.hasRulerControl ? "187px" : "147px"));

const showBasemapWindow = ref(false);

// Initialize selectedBasemap based on default basemap or fallback to mapboxStyle
const getDefaultBasemap = (): Basemap => {
  if (props.mapboxBasemaps && props.mapboxBasemaps.length > 0) {
    const defaultBasemap = props.mapboxBasemaps.find((b) => b.isDefault);
    if (defaultBasemap) {
      return {
        id: `custom-${props.mapboxBasemaps.indexOf(defaultBasemap)}`,
        style: defaultBasemap.style,
      };
    }
    // Use first basemap if no default is set
    return {
      id: `custom-0`,
      style: props.mapboxBasemaps[0].style,
    };
  }
  // Legacy fallback
  return {
    id: "custom",
    style: props.mapboxStyle,
  };
};

const selectedBasemap = ref<Basemap>(getDefaultBasemap());

// Watch for changes in basemaps prop
watch(
  () => props.mapboxBasemaps,
  () => {
    selectedBasemap.value = getDefaultBasemap();
  },
  { deep: true },
);

const toggleBasemapWindow = () => {
  showBasemapWindow.value = !showBasemapWindow.value;
};

// PlanetScope Monthly Select Basemaps
// Reference: https://docs.planet.com/develop/apis/tiles/
const minMonth = "2020_01"; // The first month we have PlanetScope Monthly Select Basemaps
const maxMonth = computed(() => {
  // If the current day is less than or equal to 15, maxMonth is two months ago.
  // Otherwise, maxMonth is the previous month.
  // This is because PlanetScope Monthly Select Basemaps for the previous month are published on the 15th of each month.
  const date = new Date();
  if (date.getDate() <= 15) {
    date.setMonth(date.getMonth() - 2);
  } else {
    date.setMonth(date.getMonth() - 1);
  }
  const year = date.getFullYear();
  const monthNumber = date.getMonth() + 1;
  const formattedMonth = monthNumber < 10 ? `0${monthNumber}` : monthNumber;
  return `${year}_${formattedMonth}`;
});
const monthYear = ref<string>(maxMonth.value);
const setPlanetDateRange = (date: Date) => {
  // minMonth and maxMonth are in format YYYY_MM, but date is a Date object
  // so we need to convert it to a string in the same format
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const formatted = `${year}_${month < 10 ? "0" + month : month}`;
  return formatted < minMonth || formatted > maxMonth.value;
};

/** Update the monthYear when the Planet basemap is selected */
watch(selectedBasemap, (newVal, oldVal) => {
  if (newVal.id === "planet" && newVal !== oldVal) {
    monthYear.value = maxMonth.value;
  }
});

/** Update the Planet basemap when the monthYear changes */
watch(monthYear, (_newVal, _oldVal) => {
  if (selectedBasemap.value.id === "planet") {
    updatePlanetBasemap();
  }
});

/** Update the Planet basemap with the selected monthYear */
const updatePlanetBasemap = () => {
  if (selectedBasemap.value.id === "planet") {
    selectedBasemap.value.monthYear = monthYear.value;
    emitBasemapChange();
  }
};

const emitBasemapChange = () => {
  emit("basemapSelected", selectedBasemap.value);
};
</script>

<template>
  <div>
    <div
      class="basemap-toggle rounded shadow"
      :class="{ active: showBasemapWindow }"
      :style="{ top: topPosition }"
      @click="toggleBasemapWindow"
    >
      <img src="/map.svg" alt="Map Icon" loading="eager" />
    </div>
    <div
      v-if="showBasemapWindow"
      class="basemap-window rounded shadow"
      :style="{ top: topPosition }"
    >
      <div class="basemap-window-content">
        <h3 class="font-semibold mb-2">{{ $t("selectBasemap") }}</h3>
        <!-- Custom basemaps (from config) -->
        <label
          v-for="(basemap, index) in mapboxBasemaps"
          :key="`custom-${index}`"
        >
          <input
            v-model="selectedBasemap"
            type="radio"
            :value="{ id: `custom-${index}`, style: basemap.style }"
            name="basemap"
            @change="emitBasemapChange"
          />
          {{ basemap.name }}
        </label>
        <!-- Legacy fallback if no custom basemaps and mapboxStyle exists -->
        <label
          v-if="(!mapboxBasemaps || mapboxBasemaps.length === 0) && mapboxStyle"
        >
          <input
            v-model="selectedBasemap"
            type="radio"
            :value="{ id: 'custom', style: mapboxStyle }"
            name="basemap"
            @change="emitBasemapChange"
          />
          {{ $t("yourMapboxStyleDefault") }}
        </label>
        <!-- Standard Mapbox basemaps -->
        <label>
          <input
            v-model="selectedBasemap"
            type="radio"
            :value="{
              id: 'satellite-streets',
              style: 'mapbox://styles/mapbox/satellite-streets-v12',
            }"
            name="basemap"
            @change="emitBasemapChange"
          />
          {{ $t("mapboxSatelliteUpTo2019") }}
        </label>
        <label>
          <input
            v-model="selectedBasemap"
            type="radio"
            :value="{
              id: 'streets',
              style: 'mapbox://styles/mapbox/streets-v12',
            }"
            name="basemap"
            @change="emitBasemapChange"
          />
          {{ $t("mapboxStreets") }}
        </label>
        <label v-if="planetApiKey">
          <input
            v-model="selectedBasemap"
            type="radio"
            :value="{ id: 'planet', monthYear: monthYear }"
            name="basemap"
            @change="emitBasemapChange"
          />
          PlanetScope Monthly Select Basemaps
        </label>
        <label v-if="selectedBasemap.id === 'planet'">
          <Datepicker
            v-model:value="monthYear"
            format="YYYY_MM"
            value-type="YYYY_MM"
            type="month"
            :default-value="maxMonth"
            :disabled-date="setPlanetDateRange"
            :clearable="false"
            @selected="updatePlanetBasemap"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.basemap-toggle {
  position: absolute;
  right: 10px;
  padding: 3px;
  width: 30px;
  background-color: #fff;
  z-index: 20;

  img {
    width: 100%;
  }
}

.basemap-toggle:hover {
  background-color: #f0f0f0;
  cursor: pointer;
}

.basemap-toggle.active {
  background-color: #fff44f;
}

.basemap-window {
  position: absolute;
  right: 50px;
  background-color: #fff;
  border: 1px solid #ccc;
  z-index: 1001;
  padding: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.basemap-window-content {
  display: flex;
  flex-direction: column;
}

.basemap-window h3 {
  margin-top: 0;
}

label {
  margin-bottom: 10px;
}
</style>
