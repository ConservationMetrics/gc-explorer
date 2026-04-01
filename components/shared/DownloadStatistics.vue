<script setup lang="ts">
import { ref } from "vue";
import { useTableExportDownload } from "@/composables/useTableExportDownload";

const props = defineProps<{
  minDate?: string;
  maxDate?: string;
  filenamePrefix?: string;
}>();

const exporting = ref(false);

const { downloadTableExport } = useTableExportDownload();

/**
 * Requests the alerts statistics CSV from the server and triggers a browser download.
 *
 * @returns {Promise<void>}
 */
const downloadStatistics = async () => {
  exporting.value = true;
  try {
    await downloadTableExport({
      exportPath: "statistics-export",
      format: "csv",
      exportMinDate: props.minDate,
      exportMaxDate: props.maxDate,
      filenamePrefix: props.filenamePrefix ?? "statistics",
    });
  } finally {
    exporting.value = false;
  }
};
</script>

<template>
  <div class="flex flex-wrap gap-2 justify-center mt-6">
    <button
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      :disabled="exporting"
      type="button"
      @click="downloadStatistics"
    >
      {{ exporting ? $t("downloading") : $t("downloadStatistics") }}
    </button>
  </div>
</template>
