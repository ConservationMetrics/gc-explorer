<script setup>
import { reactive, watch } from "vue";

import { VueTagsInput } from "@vojtechlanka/vue-tags-input";

import { toCamelCase } from "@/utils";
import { updateTags } from "@/composables/useTags";

const props = defineProps({
  tableName: String,
  config: Object,
  views: Array,
  keys: Array,
});

const localConfig = reactive({ ...props.config });

const initialTags = {
  MAP_LEGEND_LAYER_IDS: props.config.MAP_LEGEND_LAYER_IDS
    ? props.config.MAP_LEGEND_LAYER_IDS.split(",").map((tag) => ({
        text: tag,
      }))
    : [],
};
const { tags, handleTagsChanged } = updateTags(initialTags, localConfig);

// Watch for changes in localConfig and emit updates
const emit = defineEmits(["updateConfig"]);
watch(
  localConfig,
  (newValue) => {
    emit("updateConfig", newValue);
  },
  { deep: true },
);
</script>

<template>
  <div class="config-section">
    <div class="config-header">
      <h3>{{ $t("map") }} {{ $t("configuration") }}</h3>
    </div>
    <div v-for="key in keys" :key="key" class="config-field">
      <template v-if="key === 'MAPBOX_STYLE'">
        <label :for="`${tableName}-${key}`">{{ $t("mapboxStyle") }}</label>
        <input
          :id="`${tableName}-${key}`"
          v-model="localConfig[key]"
          class="input-field"
          pattern="^mapbox:\/\/styles\/[^\/]+\/[^\/]+$"
          placeholder="mapbox://styles/user/styleId"
          :title="
            $t('pleaseMatchFormat') + ': mapbox://styles/username/styleid'
          "
        />
      </template>
      <template v-if="key === 'MAPBOX_ACCESS_TOKEN'">
        <label :for="`${tableName}-${key}`"
          >{{ $t(toCamelCase(key)) }} <span style="color: red">*</span></label
        >
        <input
          :id="`${tableName}-${key}`"
          v-model="localConfig[key]"
          class="input-field"
          pattern="^pk\.ey.*"
          placeholder="pk.ey…"
          :title="$t('pleaseMatchFormat') + ': pk.ey… '"
        />
      </template>
      <template
        v-else-if="
          key === 'MAPBOX_BEARING' ||
          key === 'MAPBOX_CENTER_LATITUDE' ||
          key === 'MAPBOX_CENTER_LONGITUDE' ||
          key === 'MAPBOX_PITCH' ||
          key === 'MAPBOX_ZOOM'
        "
      >
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <input
          :id="`${tableName}-${key}`"
          v-model="localConfig[key]"
          class="input-field"
          type="number"
          step="any"
          :min="
            key === 'MAPBOX_BEARING'
              ? -180
              : key === 'MAPBOX_CENTER_LATITUDE'
                ? -90
                : key === 'MAPBOX_CENTER_LONGITUDE'
                  ? -180
                  : key === 'MAPBOX_PITCH'
                    ? 0
                    : key === 'MAPBOX_ZOOM'
                      ? 0
                      : 0
          "
          :max="
            key === 'MAPBOX_BEARING'
              ? 180
              : key === 'MAPBOX_CENTER_LATITUDE'
                ? 90
                : key === 'MAPBOX_CENTER_LONGITUDE'
                  ? 180
                  : key === 'MAPBOX_PITCH'
                    ? 85
                    : key === 'MAPBOX_ZOOM'
                      ? 22
                      : 0
          "
        />
      </template>
      <template v-else-if="key === 'MAPBOX_PROJECTION'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <select
          :id="`${tableName}-${key}`"
          v-model="localConfig[key]"
          class="input-field"
        >
          <option value="mercator">Mercator</option>
          <option value="albers">Albers</option>
          <option value="equalEarth">Equal Earth</option>
          <option value="equirectangular">Equirectangular</option>
          <option value="lambertConformalConic">Lambert Conformal Conic</option>
          <option value="naturalEarth">Natural Earth</option>
          <option value="winkelTripel">Winkel Tripel</option>
          <option value="globe">Globe</option>
        </select>
      </template>
      <template v-else-if="key === 'MAPBOX_3D'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <label :for="`${tableName}-${key}`" class="checkbox-label">
          <input
            :id="`${tableName}-${key}`"
            v-model="localConfig[key]"
            type="checkbox"
          />
          {{ $t("enable") }}
        </label>
      </template>
      <template v-else-if="key === 'MAP_LEGEND_LAYER_IDS'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <VueTagsInput
          class="tag-field"
          :tags="tags[key]"
          @tags-changed="handleTagsChanged(key, $event)"
        />
      </template>
      <template v-else-if="key === 'PLANET_API_KEY'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <input
          :id="`${tableName}-${key}`"
          v-model="localConfig[key]"
          class="input-field"
        />
      </template>
    </div>
  </div>
</template>
