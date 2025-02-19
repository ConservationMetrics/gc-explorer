<script setup lang="ts">
import Datepicker from "vue-datepicker-next";
import "vue-datepicker-next/index.css";

import type { Basemap } from "~/types/types";

const props = defineProps({
  hasRulerControl: Boolean,
  mapboxStyle: String,
  planetApiKey: String,
});

const emit = defineEmits(["basemapSelected"]);

const topPosition = computed(() => (props.hasRulerControl ? "187px" : "147px"));

const showBasemapWindow = ref(false);
const selectedBasemap = ref<Basemap>({
  id: "custom",
  style: props.mapboxStyle,
});

const toggleBasemapWindow = () => {
  showBasemapWindow.value = !showBasemapWindow.value;
};

// Planet NICFI monthly basemaps
const minMonth = "2020-09"; // The first month we have Planet NICFI monthly basemaps
const maxMonth = computed(() => {
  // If the current day is less than or equal to 15, maxMonth is two months ago.
  // Otherwise, maxMonth is the previous month.
  // This is because Planet NICFI monthly basemaps for the previous month are published on the 15th of each month.
  const date = new Date();
  if (date.getDate() <= 15) {
    date.setMonth(date.getMonth() - 2);
  } else {
    date.setMonth(date.getMonth() - 1);
  }
  const year = date.getFullYear();
  const monthNumber = date.getMonth() + 1;
  const formattedMonth = monthNumber < 10 ? `0${monthNumber}` : monthNumber;
  return `${year}-${formattedMonth}`;
});
const monthYear = ref(maxMonth.value);
const setPlanetDateRange = (date: Date) => {
  // minMonth and maxMonth are in format YYYY-MM, but date is a Date object
  // so we need to convert it to a string in the same format
  const formattedDate = date.toISOString().slice(0, 7);
  return formattedDate < minMonth || formattedDate > maxMonth.value;
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
      <img src="/map.svg" alt="Map Icon" />
    </div>
    <div
      v-if="showBasemapWindow"
      class="basemap-window rounded shadow"
      :style="{ top: topPosition }"
    >
      <div class="basemap-window-content">
        <h3 class="font-semibold mb-2">{{ $t("selectBasemap") }}</h3>
        <label>
          <input
            v-model="selectedBasemap"
            type="radio"
            :value="{ id: 'custom', style: mapboxStyle }"
            name="basemap"
            @change="emitBasemapChange"
          />
          {{ $t("yourMapboxStyleDefault") }}
        </label>
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
          {{ $t("planetMonthlyVisualBasemap") }}
        </label>
        <label v-if="selectedBasemap.id === 'planet'">
          <Datepicker
            v-model:value="monthYear"
            format="YYYY-MM"
            value-type="YYYY-MM"
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
  z-index: 1000;

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
