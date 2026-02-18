import type { Views, ViewConfig } from "@/types/types";

/**
 * Composable for copying configuration from one dataset to another.
 * Manages modal state, dataset selection, and config cloning.
 *
 * @param {Ref<Views>} viewsConfig - Reactive reference to all dataset configs.
 * @param {string} currentDataset - The current dataset key to exclude from the list.
 * @returns {object} Reactive state and handlers for the copy config modal.
 */
export const useCopyConfig = (
  viewsConfig: Ref<Views>,
  currentDataset: string,
) => {
  const showCopyModal = ref(false);
  const selectedCopySource = ref<string>("");
  const configToCopy = ref<ViewConfig | null>(null);

  const otherDatasets = computed(() => {
    return Object.keys(viewsConfig.value)
      .filter(
        (key) =>
          key !== currentDataset &&
          Object.keys(viewsConfig.value[key]).length > 0,
      )
      .sort();
  });

  const handleOpenCopyModal = () => {
    selectedCopySource.value = "";
    showCopyModal.value = true;
  };

  const handleConfirmCopy = () => {
    if (!selectedCopySource.value) return;
    const sourceConfig = viewsConfig.value[selectedCopySource.value];
    if (sourceConfig) {
      configToCopy.value = JSON.parse(JSON.stringify(sourceConfig));
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
    otherDatasets,
    handleOpenCopyModal,
    handleConfirmCopy,
    handleCancelCopy,
  };
};
