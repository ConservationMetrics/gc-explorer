<script setup lang="ts">
import { useI18n } from "vue-i18n";
import LanguagePicker from "./shared/LanguagePicker.vue";
import type { Views, ViewConfig } from "@/types/types";

const props = defineProps<{
  viewsConfig: Views;
  tableNames: Array<string>;
  listMode?: boolean;
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
      {} as Record<string, ViewConfig>
    );
});

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

const handleRemoveTableFromConfig = (tableName: string) => {
  currentModalAction.value = "removeTable";
  modalMessage.value =
    t("removeTableAreYouSure") +
    ": <strong>" +
    tableName +
    "</strong>?<br><br><em>" +
    t("tableRemovedNote") +
    ".</em>";
  showModal.value = true;
  showModalButtons.value = true;
  tableNameToRemove.value = tableName;
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

const handleSubmit = async ({
  tableName,
  config,
}: {
  tableName: string;
  config: ViewConfig;
}) => {
  emit("submitConfig", { tableName, config });
  modalMessage.value = t("configUpdated") + "!";
  showModal.value = true;
  setTimeout(() => {
    showModal.value = false;
    location.reload();
  }, 3000);
};

// Helpers for minimizing cards
const initializeMinimizedCards = () => {
  const minimized: Record<string, boolean> = {};
  for (const tableName in props.viewsConfig) {
    minimized[tableName] = true;
  }
  return minimized;
};
const minimizedCards = ref(initializeMinimizedCards());

const toggleMinimize = ({ tableName }: { tableName: string }) => {
  const isCurrentlyMinimized = minimizedCards.value[tableName];
  for (const key in minimizedCards.value) {
    minimizedCards.value[key] = true;
  }
  minimizedCards.value[tableName] = !isCurrentlyMinimized;
};

// Validation for confirm button; disable if tableNameToAdd is empty
watch(tableNameToAdd, (newVal) => {
  confirmButtonDisabled.value = !newVal;
});
</script>

<template>
  <div class="container relative">
    <div class="absolute top-0 right-4 flex justify-end space-x-4 mb-4">
      <LanguagePicker />
    </div>
    <h1>{{ $t("availableViews") }}: {{ $t("configuration") }}</h1>
    <div v-if="listMode" class="grid-container list-grid">
      <div
        v-for="(config, tableName) in sortedViewsConfig"
        :key="tableName"
        class="dataset-card"
      >
        <p class="dataset-name">{{ tableName }}</p>
        <NuxtLink
          :to="`/config/${tableName}`"
          class="edit-button text-white font-bold bg-blue-500 hover:bg-blue-700 py-2 px-4 rounded transition-colors duration-200 self-start"
        >
          {{ $t("editDataset") }}
        </NuxtLink>
      </div>
    </div>
    <div v-else class="grid-container">
      <ConfigCard
        v-for="(config, tableName) in sortedViewsConfig"
        :key="tableName"
        :table-name="tableName"
        :view-config="config"
        :is-minimized="minimizedCards[tableName]"
        @toggle-minimize="toggleMinimize"
        @submit-config="handleSubmit"
        @remove-table-from-config="handleRemoveTableFromConfig"
      />
    </div>
    <button
      class="text-white font-bold bg-blue-500 hover:bg-blue-700 py-2 px-4 rounded transition-colors duration-200 mb-6"
      @click="handleAddNewTable"
    >
      + {{ $t("addNewTable") }}
    </button>
    <div v-if="showModal" class="overlay"></div>
    <div v-if="showModal" class="modal">
      <!-- eslint-disable vue/no-v-html -->
      <!-- this is done intentionally to allow for HTML rendering in the modal message -->
      <p v-html="modalMessage"></p>
      <!-- eslint-enable vue/no-v-html -->
      <div v-if="showModalDropdown">
        <select
          v-model="tableNameToAdd"
          class="mt-4 p-2 border border-gray-300 rounded"
        >
          <option v-for="table in tableNames" :key="table" :value="table">
            {{ table }}
          </option>
        </select>
      </div>
      <div v-if="showModalButtons" class="mt-4">
        <button
          :disabled="confirmButtonDisabled"
          :class="[
            'submit-button',
            {
              'bg-gray-500 cursor-not-allowed': confirmButtonDisabled,
              'bg-red-500 hover:bg-red-700':
                currentModalAction !== 'addTable' && !confirmButtonDisabled,
              'bg-blue-500 hover:bg-blue-700':
                currentModalAction === 'addTable' && !confirmButtonDisabled,
            },
          ]"
          class="text-white font-bold mb-2 mr-2 py-2 px-4 rounded transition-colors duration-200"
          @click="handleConfirmButton"
        >
          {{ $t("confirm") }}
        </button>
        <button
          class="text-white font-bold bg-blue-500 hover:bg-blue-700 mb-2 py-2 px-4 rounded transition-colors duration-200"
          @click="handleCancelButton"
        >
          {{ $t("cancel") }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2em;
}

.container h1 {
  color: #333;
  margin-bottom: 1em;
  font-size: 2em;
  font-weight: 900;
}

.grid-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 1em auto;
}

.grid-container.list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: stretch;
  gap: 1.5em;
}

.dataset-card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5em;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1em;
  min-height: 120px;
}

@media (min-width: 768px) {
  .grid-container.list-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-container.list-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.dataset-name {
  margin: 0;
  font-size: 1.25em;
  font-weight: bold;
  color: #333;
}

.edit-button {
  text-decoration: none;
  display: inline-block;
}
</style>
