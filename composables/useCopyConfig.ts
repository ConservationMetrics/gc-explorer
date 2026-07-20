import type { ViewConfig, ViewConfigRow, ViewType } from "@/types";

export type CopyConfigSource = {
  key: string;
  label: string;
  viewConfig: ViewConfig;
};

/**
 * Builds a stable lookup key for a view copy source.
 *
 * @param {string} primaryDataset - Primary dataset table name.
 * @param {ViewType} viewType - View type of the source row.
 * @returns {string} Key unique per (dataset, view type).
 */
export const copySourceKey = (
  primaryDataset: string,
  viewType: ViewType,
): string => `${primaryDataset}::${viewType}`;

/**
 * Composable for copying configuration from another same-type view.
 * Manages modal state, source selection, and config cloning.
 *
 * @param {Ref<ViewConfigRow[]>} viewRows - All configured view rows.
 * @param {string} currentDataset - Primary dataset of the view being edited.
 * @param {Ref<ViewType | undefined>} currentViewType - View type of the view being edited.
 * @returns {object} Reactive state and handlers for the copy config modal.
 */
export const useCopyConfig = (
  viewRows: Ref<ViewConfigRow[]>,
  currentDataset: string,
  currentViewType: Ref<ViewType | undefined>,
) => {
  const showCopyModal = ref(false);
  const selectedCopySource = ref<string>("");
  const configToCopy = ref<ViewConfig | null>(null);

  const otherCopySources = computed<CopyConfigSource[]>(() => {
    const type = currentViewType.value;
    if (!type) {
      return [];
    }

    return viewRows.value
      .filter(
        (row) =>
          row.viewType === type &&
          row.primaryDataset !== currentDataset &&
          Object.keys(row.viewConfig).length > 0,
      )
      .map((row) => ({
        key: copySourceKey(row.primaryDataset, row.viewType),
        label: row.viewName || row.primaryDataset,
        viewConfig: row.viewConfig,
      }))
      .sort((first, second) => first.label.localeCompare(second.label));
  });

  const handleOpenCopyModal = () => {
    selectedCopySource.value = "";
    showCopyModal.value = true;
  };

  const handleConfirmCopy = () => {
    if (!selectedCopySource.value) return;
    const source = otherCopySources.value.find(
      (candidate) => candidate.key === selectedCopySource.value,
    );
    if (source) {
      configToCopy.value = JSON.parse(JSON.stringify(source.viewConfig));
    }
    showCopyModal.value = false;
  };

  const handleCancelCopy = () => {
    showCopyModal.value = false;
    selectedCopySource.value = "";
  };

  return {
    showCopyModal,
    selectedCopySource,
    configToCopy,
    otherCopySources,
    handleOpenCopyModal,
    handleConfirmCopy,
    handleCancelCopy,
  };
};
