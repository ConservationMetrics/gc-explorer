<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ViewConfigRow, ViewType } from "@/types";
import { CONFIG_LIMITS } from "@/utils";
import {
  ChevronLeft,
  Images,
  Map,
  Pencil,
  Plus,
  TriangleAlert,
} from "lucide-vue-next";

const props = defineProps<{
  viewRows: ViewConfigRow[];
  tableNames: Array<string>;
}>();

const { t } = useI18n();
const route = useRoute();

const emit = defineEmits([
  "addTableToConfig",
  "removeTableFromConfig",
  "submitConfig",
]);

const sortedViewsConfig = computed(() => {
  return [...props.viewRows].sort((first, second) => {
    const firstName = first.viewName || first.primaryDataset;
    const secondName = second.viewName || second.primaryDataset;
    return `${firstName}-${first.viewType}`.localeCompare(
      `${secondName}-${second.viewType}`,
    );
  });
});

/**
 * Truncates the display name if it exceeds the character limit
 *
 * @param {string} name - The display name to truncate
 * @returns {string} The truncated display name with ellipsis if needed
 */
const truncateDisplayName = (name: string): string => {
  if (!name) return "";
  return name.length > CONFIG_LIMITS.DATASET_TABLE
    ? name.substring(0, CONFIG_LIMITS.DATASET_TABLE) + "..."
    : name;
};

/**
 * Truncates the description if it exceeds the character limit
 *
 * @param {string} desc - The description to truncate
 * @returns {string} The truncated description with ellipsis if needed
 */
const truncateDescription = (desc: string): string => {
  if (!desc) return "";
  return desc.length > CONFIG_LIMITS.VIEW_DESCRIPTION
    ? desc.substring(0, CONFIG_LIMITS.VIEW_DESCRIPTION) + "..."
    : desc;
};

const modalMessage = ref("");
const currentModalAction = ref();
const showModal = ref(false);
const showModalButtons = ref(false);
const showModalDropdown = ref(false);
const confirmButtonDisabled = ref(false);
const tableNameToRemove = ref();
const tableNameToAdd = ref();
const viewTypeToAdd = ref<ViewType>(
  (route.query.view_type as ViewType) || "map",
);

// Handlers
const handleAddNewTable = () => {
  confirmButtonDisabled.value = true;
  currentModalAction.value = "addTable";
  modalMessage.value = t("selectTableToAdd") + ":";
  showModal.value = true;
  showModalButtons.value = true;
  showModalDropdown.value = true;
};

const handleConfirmButton = () => {
  if (currentModalAction.value === "removeTable") {
    emit("removeTableFromConfig", tableNameToRemove.value);
    modalMessage.value = t("tableRemovedFromViews") + "!";
  } else if (currentModalAction.value === "addTable") {
    tableNameToAdd.value = tableNameToAdd.value.trim();
    emit("addTableToConfig", {
      tableName: tableNameToAdd.value,
      viewType: viewTypeToAdd.value,
    });
    modalMessage.value = t("tableAddedToViews") + "!";
    showModalDropdown.value = false;
  }
  showModalButtons.value = false;
  setTimeout(() => {
    showModal.value = false;
    currentModalAction.value = null;
    location.reload();
  }, 3000);
};

const handleCancelButton = () => {
  confirmButtonDisabled.value = false;
  modalMessage.value = "";
  showModal.value = false;
  showModalDropdown.value = false;
  showModalButtons.value = false;
  tableNameToRemove.value = "";
  if (currentModalAction.value === "addTable") {
    tableNameToAdd.value = null;
    viewTypeToAdd.value = (route.query.view_type as ViewType) || "map";
  }
  currentModalAction.value = null;
};

// Validation for confirm button; disable if tableNameToAdd is empty
watch(tableNameToAdd, (newVal) => {
  confirmButtonDisabled.value = !newVal;
});
</script>

<template>
  <div class="max-w-7xl mx-auto p-3 sm:p-6 w-full">
    <div class="mb-6 sm:mb-8">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 font-medium mb-4 transition-colors"
      >
        <ChevronLeft class="w-5 h-5" />
        {{ $t("availableViews") }}
      </NuxtLink>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        {{ $t("datasetViewManagement") }}
      </h1>
    </div>

    <div
      v-if="sortedViewsConfig"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch mb-6"
    >
      <div
        v-for="row in sortedViewsConfig"
        :key="row.viewId ?? `${row.primaryDataset}-${row.viewType}`"
        data-testid="config-dataset-card"
        class="bg-violet-50 rounded-lg p-4 sm:p-6 shadow-sm border border-violet-100 overflow-hidden flex flex-col h-full"
      >
        <div class="flex items-start mb-3">
          <div
            class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-violet-200 flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3 flex-shrink-0"
          >
            {{ String(row.primaryDataset).charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0 max-w-full overflow-hidden">
            <h2
              class="text-lg sm:text-xl font-semibold text-gray-800 break-words max-w-full mb-2"
              style="
                overflow-wrap: anywhere;
                word-break: break-word;
                hyphens: auto;
              "
            >
              {{ truncateDisplayName(row.viewName || row.primaryDataset) }}
            </h2>
            <div class="h-10 mb-4">
              <p
                v-if="row.viewConfig.VIEW_DESCRIPTION"
                class="text-sm sm:text-base text-gray-600 line-clamp-2"
                style="
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "
              >
                {{ truncateDescription(row.viewConfig.VIEW_DESCRIPTION) }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 mb-4 overflow-hidden">
          <span
            :data-testid="`config-view-tag-${row.viewType}`"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-violet-100 text-violet-800 rounded-full flex-shrink-0"
          >
            <Map v-if="row.viewType === 'map'" class="w-3 h-3" />
            <Images v-else-if="row.viewType === 'gallery'" class="w-3 h-3" />
            <TriangleAlert
              v-else-if="row.viewType === 'alerts'"
              class="w-3 h-3"
            />
            {{ $t(row.viewType) }}
          </span>
        </div>

        <NuxtLink
          :to="{
            path: `/config/${row.primaryDataset}`,
            query: { view_type: row.viewType },
          }"
          data-testid="edit-dataset-view-link"
          class="mt-auto flex items-center justify-center gap-2 w-full text-center px-4 py-2 sm:py-3 bg-violet-700 hover:bg-violet-800 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <Pencil class="w-4 h-4" />
          {{ $t("editDataset") }}
        </NuxtLink>
      </div>
    </div>

    <div class="flex justify-end mb-6">
      <button
        data-testid="add-new-dataset-view-button"
        class="flex items-center gap-2 px-4 py-2 sm:py-3 bg-violet-700 hover:bg-violet-800 text-white font-medium rounded-lg transition-colors duration-200"
        @click="handleAddNewTable"
      >
        <Plus class="w-5 h-5" />
        {{ $t("addNewTable") }}
      </button>
    </div>
    <div
      v-if="showModal"
      data-testid="config-modal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <div
        data-testid="config-modal-content"
        class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <p data-testid="config-modal-message" class="mb-4 text-gray-700">
          {{ modalMessage }}
        </p>
        <div v-if="showModalDropdown" class="mb-4">
          <select
            v-model="tableNameToAdd"
            data-testid="config-modal-table-select"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
          >
            <option v-for="table in tableNames" :key="table" :value="table">
              {{ table }}
            </option>
          </select>
          <div class="mt-4 flex flex-wrap gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="viewTypeToAdd" type="radio" value="map" />
              <span>{{ $t("map") }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="viewTypeToAdd" type="radio" value="gallery" />
              <span>{{ $t("gallery") }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="viewTypeToAdd" type="radio" value="alerts" />
              <span>{{ $t("alerts") }}</span>
            </label>
          </div>
        </div>
        <div v-if="showModalButtons" class="flex gap-3 justify-end">
          <button
            data-testid="config-modal-confirm-button"
            :disabled="confirmButtonDisabled"
            class="px-4 py-2 font-medium rounded-lg transition-colors"
            :class="{
              'bg-gray-300 text-gray-500 cursor-not-allowed':
                confirmButtonDisabled,
              'bg-red-500 hover:bg-red-600 text-white':
                currentModalAction !== 'addTable' && !confirmButtonDisabled,
              'bg-violet-700 hover:bg-violet-800 text-white':
                currentModalAction === 'addTable' && !confirmButtonDisabled,
            }"
            @click="handleConfirmButton"
          >
            {{ $t("confirm") }}
          </button>
          <button
            data-testid="config-modal-cancel-button"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
            @click="handleCancelButton"
          >
            {{ $t("cancel") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
