<script setup lang="ts">
// @ts-expect-error - vue-tags-input does not have types
import { VueTagsInput } from "@vojtechlanka/vue-tags-input";

import { toCamelCase } from "@/utils";
import { updateTags } from "@/composables/useTags";

import type { ViewConfig } from "@/types/types";

const props = defineProps<{
  tableName: string;
  config: ViewConfig;
  views: string[];
  keys: string[];
}>();

const emit = defineEmits<{
  (e: "updateConfig", payload: Partial<ViewConfig>): void;
}>();

type Tag = { text: string };

const initialTags: Record<string, Tag[]> = {
  MAP_LEGEND_LAYER_IDS: props.config.MAP_LEGEND_LAYER_IDS
    ? props.config.MAP_LEGEND_LAYER_IDS.split(",").map((tag) => ({ text: tag }))
    : [],
};

const { tags, handleTagsChanged: rawHandleTagsChanged } = updateTags(
  initialTags,
  {},
);

const handleTagsChanged = (key: string, newTags: Tag[]): void => {
  rawHandleTagsChanged(key, newTags);
  const values = newTags.map((tag) => tag.text).join(",");
  emit("updateConfig", { [key]: values });
};

const handleInput = (key: string, value: string | number | boolean): void => {
  emit("updateConfig", { [key]: value });
};

const configData = props.config as Record<string, string | number | boolean>;
</script>

<template>
  <div class="config-section">
    <div class="config-header">
      <h3>{{ $t("map") }} {{ $t("configuration") }}</h3>
    </div>
    <div v-for="key in keys" :key="key" class="config-field">
      <!-- Mapbox Style -->
      <template v-if="key === 'MAPBOX_STYLE'">
        <label :for="`${tableName}-${key}`">{{ $t("mapboxStyle") }}</label>
        <input
          :id="`${tableName}-${key}`"
          class="input-field"
          pattern="^mapbox:\/\/styles\/[^\/]+\/[^\/]+$"
          placeholder="mapbox://styles/user/styleId"
          :title="
            $t('pleaseMatchFormat') + ': mapbox://styles/username/styleid'
          "
          :value="config[key]"
          @input="(e) => handleInput(key, (e.target as HTMLInputElement).value)"
        />
      </template>

      <!-- Access Token -->
      <template v-else-if="key === 'MAPBOX_ACCESS_TOKEN'">
        <label :for="`${tableName}-${key}`">
          {{ $t(toCamelCase(key)) }} <span style="color: red">*</span>
        </label>
        <input
          :id="`${tableName}-${key}`"
          class="input-field"
          pattern="^pk\.ey.*"
          placeholder="pk.ey…"
          :title="$t('pleaseMatchFormat') + ': pk.ey… '"
          :value="config[key]"
          @input="(e) => handleInput(key, (e.target as HTMLInputElement).value)"
        />
      </template>

      <!-- Numbers -->
      <template
        v-else-if="
          [
            'MAPBOX_BEARING',
            'MAPBOX_CENTER_LATITUDE',
            'MAPBOX_CENTER_LONGITUDE',
            'MAPBOX_PITCH',
            'MAPBOX_ZOOM',
          ].includes(key)
        "
      >
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <input
          :id="`${tableName}-${key}`"
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
          :value="configData[key]"
          @input="
            (e) =>
              handleInput(key, parseFloat((e.target as HTMLInputElement).value))
          "
        />
      </template>

      <!-- Projection -->
      <template v-else-if="key === 'MAPBOX_PROJECTION'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <select
          :id="`${tableName}-${key}`"
          class="input-field"
          :value="config[key]"
          @change="
            (e) => handleInput(key, (e.target as HTMLSelectElement).value)
          "
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

      <!-- 3D -->
      <template v-else-if="key === 'MAPBOX_3D'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <label class="checkbox-label">
          <input
            :id="`${tableName}-${key}`"
            type="checkbox"
            :checked="Boolean(configData[key])"
            @change="
              (e) => handleInput(key, (e.target as HTMLInputElement).checked)
            "
          />
          {{ $t("enable") }}
        </label>
      </template>

      <!-- Legend Layers -->
      <template v-else-if="key === 'MAP_LEGEND_LAYER_IDS'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <VueTagsInput
          class="tag-field"
          :tags="tags[key]"
          @tags-changed="(newTags: Tag[]) => handleTagsChanged(key, newTags)"
        />
      </template>

      <!-- Planet API Key -->
      <template v-else-if="key === 'PLANET_API_KEY'">
        <label :for="`${tableName}-${key}`">{{ $t(toCamelCase(key)) }}</label>
        <input
          :id="`${tableName}-${key}`"
          class="input-field"
          type="text"
          :value="config[key]"
          @input="(e) => handleInput(key, (e.target as HTMLInputElement).value)"
        />
      </template>
    </div>
  </div>
</template>
