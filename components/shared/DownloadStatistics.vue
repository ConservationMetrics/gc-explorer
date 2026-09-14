<script setup lang="ts">
import { ref } from "vue";
import { ChartColumn } from "lucide-vue-next";
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
      class="inline-flex items-center justify-center gap-1.5 rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
      :disabled="exporting"
      type="button"
      @click="downloadStatistics"
    >
      <ChartColumn class="h-4 w-4 shrink-0" aria-hidden="true" />
      {{ exporting ? $t("downloading") : $t("downloadStatistics") }}
    </button>
  </div>
</template>
