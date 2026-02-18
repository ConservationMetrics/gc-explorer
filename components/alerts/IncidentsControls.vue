<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

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
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <div v-if="hoveredButton === 'incidents'" class="tooltip tooltip-left">
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
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      </button>
      <div v-if="hoveredButton === 'boundingBox'" class="tooltip tooltip-left">
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
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      </button>
      <div v-if="hoveredButton === 'multiSelect'" class="tooltip tooltip-left">
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
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div v-if="hoveredButton === 'deselect'" class="tooltip tooltip-left">
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
        <Plus :size="20" />
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
  z-index: 10;
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
  max-width: 250px;
  white-space: normal;
  line-height: 1.4;
}

.tooltip-left {
  right: 50px;
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
