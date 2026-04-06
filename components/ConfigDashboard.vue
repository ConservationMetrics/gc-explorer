<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Views, ViewConfig } from "@/types";
import { CONFIG_LIMITS } from "@/utils";
import {
  faArrowLeft,
  faImages,
  faMap,
  faPenToSquare,
  faPlus,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const props = defineProps<{
  viewsConfig: Views;
  tableNames: Array<string>;
}>();

const { t } = useI18n();

const emit = defineEmits([
  "addTableToConfig",
  "removeTableFromConfig",
  "submitConfig",
]);

const sortedViewsConfig = computed(() => {
  return Object.keys(props.viewsConfig)
    .sort()
    .reduce(
      (accumulator, key) => {
        accumulator[key] = props.viewsConfig[key];
        return accumulator;
      },
      {} as Record<string, ViewConfig>,
    );
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
    emit("addTableToConfig", tableNameToAdd.value);
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
        class="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium mb-4 transition-colors"
      >
        <FontAwesomeIcon :icon="faArrowLeft" class="w-5 h-5" />
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
        v-for="(config, tableName) in sortedViewsConfig"
        :key="tableName"
        data-testid="config-dataset-card"
        class="bg-purple-50 rounded-lg p-4 sm:p-6 shadow-sm border border-purple-100 overflow-hidden flex flex-col h-full"
      >
        <div class="flex items-start mb-3">
          <div
            class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-200 flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3 flex-shrink-0"
          >
            {{ String(tableName).charAt(0).toUpperCase() }}
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
              {{
                truncateDisplayName(config.DATASET_TABLE || String(tableName))
              }}
            </h2>
            <div class="h-10 mb-4">
              <p
                v-if="config.VIEW_DESCRIPTION"
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
                {{ truncateDescription(config.VIEW_DESCRIPTION) }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 mb-4 overflow-hidden">
          <span
            v-for="view in config.VIEWS
              ? config.VIEWS.split(',')
                  .map((v) => v.trim())
                  .sort()
              : []"
            :key="view"
            :data-testid="`config-view-tag-${view}`"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex-shrink-0"
          >
            <FontAwesomeIcon v-if="view === 'map'" :icon="faMap" class="w-3 h-3" />
            <FontAwesomeIcon
              v-else-if="view === 'gallery'"
              :icon="faImages"
              class="w-3 h-3"
            />
            <FontAwesomeIcon
              v-else-if="view === 'alerts'"
              :icon="faTriangleExclamation"
              class="w-3 h-3"
            />
            {{ $t(view) }}
          </span>
        </div>

        <NuxtLink
          :to="`/config/${tableName}`"
          data-testid="edit-dataset-view-link"
          class="mt-auto flex items-center justify-center gap-2 w-full text-center px-4 py-2 sm:py-3 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <FontAwesomeIcon :icon="faPenToSquare" class="w-4 h-4" />
          {{ $t("editDataset") }}
        </NuxtLink>
      </div>
    </div>

    <div class="flex justify-end mb-6">
      <button
        data-testid="add-new-dataset-view-button"
        class="flex items-center gap-2 px-4 py-2 sm:py-3 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-lg transition-colors duration-200"
        @click="handleAddNewTable"
      >
        <FontAwesomeIcon :icon="faPlus" class="w-5 h-5" />
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
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          >
            <option v-for="table in tableNames" :key="table" :value="table">
              {{ table }}
            </option>
          </select>
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
              'bg-purple-700 hover:bg-purple-800 text-white':
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
