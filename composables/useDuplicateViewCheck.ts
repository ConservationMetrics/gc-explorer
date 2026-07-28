import type { ViewConfigRow, ViewType } from "@/types";

/**
 * Checks whether a (viewType, primaryDataset) pair already exists.
 *
 * @param {ViewConfigRow[]} rows - Existing view rows for the primary dataset.
 * @param {ViewType} viewType - View type being created.
 * @returns {ViewConfigRow | undefined} Matching row when duplicate, otherwise undefined.
 */
export const findDuplicateView = (
  rows: ViewConfigRow[],
  viewType: ViewType,
): ViewConfigRow | undefined => rows.find((row) => row.viewType === viewType);

/**
 * Watches primary dataset changes and flags duplicates for the chosen view type.
 *
 * @param {Ref<ViewType>} viewType - View type for the create form.
 * @param {Ref<string>} primaryDataset - Selected primary warehouse table.
 * @returns Duplicate state, the existing row when found, and loading flag.
 */
export const useDuplicateViewCheck = (
  viewType: Ref<ViewType>,
  primaryDataset: Ref<string>,
) => {
  const isDuplicate = ref(false);
  const existingView = ref<ViewConfigRow | null>(null);
  const isChecking = ref(false);

  const checkDuplicate = async () => {
    const primary = primaryDataset.value.trim();
    if (!primary) {
      isDuplicate.value = false;
      existingView.value = null;
      return;
    }

    isChecking.value = true;
    try {
      // Returns every view row already configured for this primary dataset.
      const rows = await $fetch<ViewConfigRow[]>(`/api/config/${primary}`);
      const match = findDuplicateView(rows, viewType.value);
      existingView.value = match ?? null;
      isDuplicate.value = match != null;
    } catch (error) {
      console.error("Error checking for duplicate view:", error);
      isDuplicate.value = false;
      existingView.value = null;
    } finally {
      isChecking.value = false;
    }
  };

  watch([viewType, primaryDataset], checkDuplicate, { immediate: true });

  return {
    isDuplicate,
    existingView,
    isChecking,
    checkDuplicate,
  };
};
