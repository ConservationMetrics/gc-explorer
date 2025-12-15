<script setup lang="ts">
// @ts-expect-error - vue-tags-input does not have types
import { VueTagsInput } from "@vojtechlanka/vue-tags-input";
import VueSlider from "vue-3-slider-component";

import { toCamelCase } from "@/utils";
import { updateTags } from "@/composables/useTags";

import type { ViewConfig, BasemapConfig } from "@/types/types";

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

const terrainExaggeration = ref<number>(
  (props.config.MAPBOX_3D_TERRAIN_EXAGGERATION as number) ?? 1.5,
);

watch(terrainExaggeration, (value) => {
  emit("updateConfig", { MAPBOX_3D_TERRAIN_EXAGGERATION: value });
});

// Basemaps management
const parseBasemaps = (): BasemapConfig[] => {
  if (props.config.MAPBOX_BASEMAPS) {
    try {
      return JSON.parse(props.config.MAPBOX_BASEMAPS);
    } catch {
      return [];
    }
  }
  // Fallback to legacy MAPBOX_STYLE
  if (props.config.MAPBOX_STYLE) {
    return [
      {
        name: "Default Style",
        style: props.config.MAPBOX_STYLE,
        isDefault: true,
      },
    ];
  }
  return [];
};

const basemaps = ref<BasemapConfig[]>(parseBasemaps());

// Initialize basemaps on mount
onMounted(() => {
  basemaps.value = parseBasemaps();
  ensureDefault();
});

watch(
  () => props.config.MAPBOX_BASEMAPS,
  () => {
    basemaps.value = parseBasemaps();
    ensureDefault();
  },
);

watch(
  () => props.config.MAPBOX_STYLE,
  () => {
    if (!props.config.MAPBOX_BASEMAPS && props.config.MAPBOX_STYLE) {
      basemaps.value = [
        {
          name: "Default Style",
          style: props.config.MAPBOX_STYLE,
          isDefault: true,
        },
      ];
      ensureDefault();
    }
  },
);

// Ensure first basemap is always marked as default
const ensureDefault = () => {
  if (basemaps.value.length > 0) {
    basemaps.value.forEach((b, i) => {
      b.isDefault = i === 0;
    });
  }
};

const addBasemap = () => {
  // Limit to 3 basemaps
  if (basemaps.value.length >= 3) {
    return;
  }
  basemaps.value.push({
    name: "",
    style: "",
    isDefault: false,
  });
  ensureDefault();
  saveBasemaps();
};

const canAddBasemap = computed(() => basemaps.value.length < 3);

const removeBasemap = (index: number) => {
  // Must have at least one basemap - cannot remove if only one exists
  if (basemaps.value.length <= 1) {
    return;
  }
  // Cannot remove first item (default basemap)
  if (index === 0) {
    return;
  }
  basemaps.value.splice(index, 1);
  ensureDefault();
  saveBasemaps();
};

const updateBasemap = (
  index: number,
  field: keyof BasemapConfig,
  value: string | boolean,
) => {
  basemaps.value[index][field] = value as never;
  ensureDefault();
  saveBasemaps();
};

// Validation helpers
const isNameUnique = (index: number, name: string): boolean => {
  if (!name.trim()) return false;
  return basemaps.value.every((b, i) => i === index || b.name !== name);
};

const isNameValid = (index: number, name: string): boolean => {
  return name.trim().length > 0 && isNameUnique(index, name);
};

const getValidationError = (index: number, name: string): string | null => {
  if (!name.trim()) {
    return "Basemap name cannot be blank";
  }
  if (!isNameUnique(index, name)) {
    return "Basemap name must be unique";
  }
  return null;
};

const saveBasemaps = () => {
  ensureDefault();
  emit("updateConfig", {
    MAPBOX_BASEMAPS: JSON.stringify(basemaps.value),
  });
};

// Drag and drop handlers
const draggedIndex = ref<number | null>(null);

const handleDragStart = (index: number) => {
  draggedIndex.value = index;
};

const handleDragOver = (e: DragEvent, _index: number) => {
  e.preventDefault();
};

const handleDrop = (e: DragEvent, dropIndex: number) => {
  e.preventDefault();
  if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
    draggedIndex.value = null;
    return;
  }
  const item = basemaps.value[draggedIndex.value];
  basemaps.value.splice(draggedIndex.value, 1);
  basemaps.value.splice(dropIndex, 0, item);
  draggedIndex.value = null;
  ensureDefault();
  saveBasemaps();
};
</script>

<template>
  <div class="space-y-6">
    <div v-for="key in keys" :key="key" class="space-y-2">
      <!-- Mapbox Basemaps -->
      <template v-if="key === 'MAPBOX_STYLE'">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ $t("mapboxBackgroundMaps") }}
        </label>
        <p class="text-sm text-gray-500 mb-4">
          {{ $t("basemapsDescription") }}
        </p>
        <div class="space-y-4">
          <div
            v-for="(basemap, index) in basemaps"
            :key="index"
            class="p-4 border-2 rounded-lg transition-colors"
            :class="
              index === 0
                ? 'border-purple-300 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-purple-200'
            "
            draggable="true"
            @dragstart="handleDragStart(index)"
            @dragover="handleDragOver($event, index)"
            @drop="handleDrop($event, index)"
          >
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 pt-2 text-gray-400 cursor-move">☰</div>
              <div class="flex-1 space-y-3">
                <div>
                  <input
                    :id="`${tableName}-basemap-name-${index}`"
                    class="w-full px-4 py-2 border rounded-lg transition-colors"
                    :class="{
                      'border-red-300 focus:ring-red-500 focus:border-red-500':
                        !isNameValid(index, basemap.name),
                      'border-gray-300 focus:ring-purple-500 focus:border-purple-500':
                        isNameValid(index, basemap.name) || !basemap.name,
                    }"
                    :placeholder="$t('basemapName')"
                    :value="basemap.name"
                    required
                    @input="
                      updateBasemap(
                        index,
                        'name',
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                  />
                  <span
                    v-if="basemap.name && !isNameValid(index, basemap.name)"
                    class="block mt-1 text-sm text-red-600"
                  >
                    {{ getValidationError(index, basemap.name) }}
                  </span>
                </div>
                <input
                  :id="`${tableName}-basemap-style-${index}`"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  pattern="^mapbox:\/\/styles\/[^\/]+\/[^\/]+$"
                  placeholder="mapbox://styles/user/styleId"
                  :title="
                    $t('pleaseMatchFormat') +
                    ': mapbox://styles/username/styleid'
                  "
                  :value="basemap.style"
                  required
                  @input="
                    updateBasemap(
                      index,
                      'style',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
              </div>
              <button
                v-if="index !== 0"
                type="button"
                class="flex-shrink-0 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                @click="removeBasemap(index)"
              >
                {{ $t("remove") }}
              </button>
            </div>
          </div>
          <button
            type="button"
            class="w-full px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!canAddBasemap"
            @click="addBasemap"
          >
            + {{ $t("addBasemapOption") }}
          </button>
        </div>
      </template>

      <!-- Access Token -->
      <template v-else-if="key === 'MAPBOX_ACCESS_TOKEN'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }} <span class="text-red-500">*</span>
        </label>
        <input
          :id="`${tableName}-${key}`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <input
          :id="`${tableName}-${key}`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
          @wheel="(e) => e.target && (e.target as HTMLInputElement).blur()"
        />
      </template>

      <!-- Projection -->
      <template v-else-if="key === 'MAPBOX_PROJECTION'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <select
          :id="`${tableName}-${key}`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
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
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700 mb-2"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <label class="flex items-center gap-2 cursor-pointer group">
          <input
            :id="`${tableName}-${key}`"
            type="checkbox"
            class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
            :checked="Boolean(configData[key])"
            @change="
              (e) => handleInput(key, (e.target as HTMLInputElement).checked)
            "
          />
          <span
            class="text-gray-700 font-medium group-hover:text-purple-700 transition-colors"
          >
            {{ $t("enable") }}
          </span>
        </label>

        <!-- Terrain Exaggeration Slider (shown when 3D is enabled) -->
        <div v-if="Boolean(configData['MAPBOX_3D'])" class="mt-4 space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            3D {{ $t("terrainExaggeration") }}
          </label>
          <div class="mt-2 mb-10">
            <VueSlider
              v-model="terrainExaggeration"
              :min="0"
              :max="22"
              :interval="0.1"
              :height="10"
              :tooltip="'always'"
              :tooltip-placement="'bottom'"
            />
          </div>
        </div>
      </template>

      <!-- Legend Layers -->
      <template v-else-if="key === 'MAP_LEGEND_LAYER_IDS'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <VueTagsInput
          class="tag-field"
          :tags="tags[key]"
          @tags-changed="(newTags: Tag[]) => handleTagsChanged(key, newTags)"
        />
      </template>

      <!-- Planet API Key -->
      <template v-else-if="key === 'PLANET_API_KEY'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <input
          :id="`${tableName}-${key}`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          type="text"
          :value="config[key]"
          @input="(e) => handleInput(key, (e.target as HTMLInputElement).value)"
        />
      </template>

      <!-- Color Column -->
      <template v-else-if="key === 'COLOR_COLUMN'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <input
          :id="`${tableName}-${key}`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          type="text"
          placeholder="color"
          :value="config[key]"
          @input="(e) => handleInput(key, (e.target as HTMLInputElement).value)"
        />
        <p class="field-description">{{ $t("colorColumnDescription") }}</p>
      </template>

      <!-- Icon Column -->
      <template v-else-if="key === 'ICON_COLUMN'">
        <label
          :for="`${tableName}-${key}`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t(toCamelCase(key)) }}
        </label>
        <input
          :id="`${tableName}-${key}`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          type="text"
          placeholder="icon"
          :value="config[key]"
          @input="(e) => handleInput(key, (e.target as HTMLInputElement).value)"
        />
        <p class="text-xs text-gray-500 mt-1">
          {{ $t("iconColumnDescription") }}
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.field-description {
  font-style: italic;
  color: #666;
  font-size: 0.9em;
  margin-top: 4px;
  margin-bottom: 10px;
}

.basemaps-description {
  font-style: italic;
  color: #666;
  font-size: 0.9em;
  margin-top: 4px;
  margin-bottom: 10px;
}

.basemaps-container {
  margin-top: 10px;
}

.basemap-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: move;
  position: relative;
}

.basemap-item:hover {
  background-color: #f0f0f0;
}

.basemap-item.basemap-default {
  border: 2px solid #007bff;
  background-color: #e7f3ff;
}

.basemap-item.basemap-default::before {
  content: "Default";
  position: absolute;
  top: -10px;
  left: 10px;
  background-color: #007bff;
  color: white;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: bold;
  border-radius: 3px;
  text-transform: uppercase;
}

.basemap-drag-handle {
  font-size: 18px;
  color: #666;
  cursor: grab;
  user-select: none;
}

.basemap-drag-handle:active {
  cursor: grabbing;
}

.basemap-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.basemap-fields {
  display: flex;
  gap: 10px;
  flex: 1;
}

.basemap-name-wrapper {
  flex: 1;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.basemap-name {
  width: 100%;
}

.basemap-name.input-error {
  border-color: #dc3545;
}

.validation-error {
  font-size: 11px;
  color: #dc3545;
  margin-top: -4px;
}

.basemap-style {
  flex: 2;
  min-width: 250px;
}

.basemap-actions {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  margin-left: auto;
}

.remove-button {
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.remove-button:hover {
  background-color: #c82333;
}

.add-basemap-button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.add-basemap-button:hover:not(.disabled) {
  background-color: #0056b3;
}

.add-basemap-button.disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
