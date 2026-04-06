<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  CheckCircle2,
  Plus,
  SquareDashedMousePointer,
  MousePointer2,
  X,
} from "lucide-vue-next";

const { t } = useI18n();

defineProps<{
  showIncidentsSidebar: boolean;
  openSidebarWithCreateForm: boolean;
  boundingBoxMode: boolean;
  multiSelectMode: boolean;
  hasActiveSelection: boolean;
  selectedSourcesLength: number;
  hoveredButton:
    | "incidents"
    | "boundingBox"
    | "multiSelect"
    | "createIncident"
    | "deselect"
    | null;
}>();

const emit = defineEmits<{
  toggleIncidentsSidebar: [];
  toggleBoundingBoxMode: [];
  toggleMultiSelectMode: [];
  openIncidentsSidebarWithCreateForm: [];
  clearSelection: [];
  hoverButton: [
    button:
      | "incidents"
      | "boundingBox"
      | "multiSelect"
      | "createIncident"
      | "deselect",
  ];
  clearHover: [];
}>();
</script>

<template>
  <div class="incidents-controls">
    <div
      class="incident-control-wrapper"
      @mouseenter="emit('hoverButton', 'incidents')"
      @mouseleave="emit('clearHover')"
    >
      <button
        class="incident-control-btn"
        data-testid="incidents-view-button"
        :class="{ active: showIncidentsSidebar }"
        @click="emit('toggleIncidentsSidebar')"
      >
        <CheckCircle2 class="w-5 h-5" />
      </button>
      <div v-if="hoveredButton === 'incidents'" class="tooltip">
        {{
          showIncidentsSidebar
            ? t("incidents.hideSidebar")
            : t("incidents.viewSavedIncidents")
        }}
      </div>
    </div>
    <div
      class="incident-control-wrapper"
      @mouseenter="emit('hoverButton', 'boundingBox')"
      @mouseleave="emit('clearHover')"
    >
      <button
        class="incident-control-btn"
        data-testid="incidents-bbox-button"
        :class="{ active: boundingBoxMode }"
        @click="emit('toggleBoundingBoxMode')"
      >
        <SquareDashedMousePointer class="w-5 h-5" />
      </button>
      <div v-if="hoveredButton === 'boundingBox'" class="tooltip">
        {{
          boundingBoxMode
            ? t("incidents.disableBoundingBox")
            : t("incidents.enableBoundingBox")
        }}
      </div>
    </div>
    <div
      class="incident-control-wrapper"
      @mouseenter="emit('hoverButton', 'multiSelect')"
      @mouseleave="emit('clearHover')"
    >
      <button
        class="incident-control-btn"
        data-testid="incidents-multiselect-button"
        :class="{ active: multiSelectMode }"
        @click="emit('toggleMultiSelectMode')"
      >
        <MousePointer2 class="w-5 h-5" />
      </button>
      <div v-if="hoveredButton === 'multiSelect'" class="tooltip">
        {{
          multiSelectMode
            ? t("incidents.disableMultiSelect")
            : t("incidents.enableMultiSelect")
        }}
      </div>
    </div>
    <div
      class="incident-control-wrapper"
      @mouseenter="emit('hoverButton', 'deselect')"
      @mouseleave="emit('clearHover')"
    >
      <button
        class="incident-control-btn"
        data-testid="incidents-deselect-button"
        :disabled="!hasActiveSelection"
        @click="emit('clearSelection')"
      >
        <X class="w-5 h-5" />
      </button>
      <div v-if="hoveredButton === 'deselect'" class="tooltip">
        {{ t("incidents.deselectSelection") }}
      </div>
    </div>
    <div
      class="incident-control-wrapper"
      @mouseenter="emit('hoverButton', 'createIncident')"
      @mouseleave="emit('clearHover')"
    >
      <button
        class="incident-control-btn"
        data-testid="incidents-create-button"
        :class="{ active: showIncidentsSidebar && openSidebarWithCreateForm }"
        :disabled="selectedSourcesLength === 0"
        @click="emit('openIncidentsSidebarWithCreateForm')"
      >
        <Plus class="w-5 h-5" />
      </button>
      <div
        v-if="hoveredButton === 'createIncident'"
        class="tooltip tooltip-left"
      >
        {{
          selectedSourcesLength === 0
            ? t("incidents.selectFeaturesFirst")
            : selectedSourcesLength === 1
              ? t("incidents.createIncidentWithFeatures", {
                  count: selectedSourcesLength,
                })
              : t("incidents.createIncidentWithFeaturesPlural", {
                  count: selectedSourcesLength,
                })
        }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.incidents-controls {
  position: absolute;
  top: 230px;
  right: 10px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.incident-control-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.incident-control-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 1px solid #ccc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  color: #333;
}

.incident-control-btn:hover {
  background: #f0f0f0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.incident-control-btn.active {
  background: #4a90e2;
  color: white;
  border-color: #4a90e2;
}

.incident-control-btn.active:hover {
  background: #357abd;
}

.incident-control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.incident-control-btn:disabled:hover {
  background: #f5f5f5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tooltip {
  position: absolute;
  right: 50px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
  width: 150px;
  white-space: normal;
  line-height: 1.4;
}

.tooltip::after {
  content: "";
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-left-color: rgba(0, 0, 0, 0.85);
}
</style>
