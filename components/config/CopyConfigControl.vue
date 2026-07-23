<script setup lang="ts">
import type { CopyConfigSource } from "@/composables/useCopyConfig";
import { Copy } from "lucide-vue-next";

withDefaults(
  defineProps<{
    sources: CopyConfigSource[];
    showModal: boolean;
    selectedSource: string;
    buttonContainerClass?: string;
  }>(),
  {
    buttonContainerClass: "",
  },
);

const emit = defineEmits<{
  open: [];
  confirm: [];
  cancel: [];
  "update:selectedSource": [value: string];
}>();
</script>

<template>
  <div v-if="sources.length > 0" :class="buttonContainerClass">
    <button
      type="button"
      data-testid="copy-config-button"
      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      @click="emit('open')"
    >
      <Copy class="w-4 h-4" />
      {{ $t("copyConfigFromDataset") }}
    </button>

    <div
      v-if="showModal"
      data-testid="copy-config-modal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <div
        data-testid="copy-config-modal-content"
        class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          {{ $t("copyConfigFromDataset") }}
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          {{ $t("copyConfigDescription") }}
        </p>
        <select
          :value="selectedSource"
          data-testid="copy-config-select"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors mb-4"
          @change="
            emit(
              'update:selectedSource',
              ($event.target as HTMLSelectElement).value,
            )
          "
        >
          <option value="" disabled>
            {{ $t("selectView") }}
          </option>
          <option
            v-for="source in sources"
            :key="source.key"
            :value="source.key"
          >
            {{ source.label }}
          </option>
        </select>
        <div class="flex gap-3 justify-end">
          <button
            data-testid="copy-config-confirm-button"
            :disabled="!selectedSource"
            class="px-4 py-2 font-medium rounded-lg transition-colors"
            :class="{
              'bg-gray-300 text-gray-500 cursor-not-allowed': !selectedSource,
              'bg-violet-700 hover:bg-violet-800 text-white': selectedSource,
            }"
            @click="emit('confirm')"
          >
            {{ $t("confirm") }}
          </button>
          <button
            data-testid="copy-config-cancel-button"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
            @click="emit('cancel')"
          >
            {{ $t("cancel") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
