<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  viewsConfig: Object,
  tableNames: Array,
});

const { t } = useI18n();

const emit = defineEmits([
  "addTableToConfig",
  "removeTableFromConfig",
  "submitConfig",
]);

// Sort viewsConfig by table name
const sortedViewsConfig = computed(() => {
  return Object.keys(props.viewsConfig)
    .sort()
    .reduce((acc, key) => {
      acc[key] = props.viewsConfig[key];
      return acc;
    }, {});
});

const modalMessage = ref("");
const currentModalAction = ref(null);
const showModal = ref(false);
const showModalButtons = ref(false);
const showModalDropdown = ref(false);
const confirmButtonDisabled = ref(false);
const tableNameToRemove = ref("");
const tableNameToAdd = ref(null);

// Handlers
const handleAddNewTable = () => {
  confirmButtonDisabled.value = true;
  currentModalAction.value = "addTable";
  modalMessage.value = t("selectTableToAdd") + ":";
  showModal.value = true;
  showModalButtons.value = true;
  showModalDropdown.value = true;
};

const handleRemoveTableFromConfig = (tableName) => {
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

const handleSubmit = async ({ tableName, config }) => {
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
  const minimized = {};
  for (const tableName in props.viewsConfig) {
    minimized[tableName] = true;
  }
  return minimized;
};
const minimizedCards = ref(initializeMinimizedCards());

const toggleMinimize = ({ tableName }) => {
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
    <div class="grid-container">
      <ConfigCard
        v-for="(config, tableName) in sortedViewsConfig"
        :key="tableName"
        :table-name="tableName"
        :config="config"
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
      <p v-html="modalMessage"></p>
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
</style>
