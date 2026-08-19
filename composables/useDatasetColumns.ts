import { encodeDatasetNameForUrl } from "@/utils/identifierUtils";

import type { ColumnEntry } from "@/types";
import type { Ref } from "vue";

type DatasetColumnsResponse = {
  columns: ColumnEntry[];
  table: string;
};

/**
 * Loads column metadata when the selected dataset changes.
 *
 * @param {Ref<string | null | undefined>} dataset - Selected warehouse table.
 * @returns Column metadata and loading state.
 */
export const useDatasetColumns = (dataset: Ref<string | null | undefined>) => {
  const columns = ref<ColumnEntry[]>([]);
  const isLoading = ref(false);
  let requestId = 0;

  const loadColumns = async (): Promise<void> => {
    const currentRequest = ++requestId;
    const table = dataset.value?.trim() ?? "";

    if (!table) {
      columns.value = [];
      isLoading.value = false;
      return;
    }

    isLoading.value = true;

    try {
      const response = await $fetch<DatasetColumnsResponse>(
        `/api/config/columns/${encodeDatasetNameForUrl(table)}`,
      );
      if (currentRequest === requestId) {
        columns.value = response.columns;
      }
    } catch {
      if (currentRequest === requestId) {
        columns.value = [];
      }
    } finally {
      if (currentRequest === requestId) {
        isLoading.value = false;
      }
    }
  };

  watch(dataset, loadColumns, { immediate: true });

  return {
    columns,
    isLoading,
  };
};
