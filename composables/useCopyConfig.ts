import type { ViewConfig, ViewConfigRow, ViewType } from "@/types";
import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";

/** Identity fields from ConfigViewInfo; never copied between views. */
export const VIEW_INFO_CONFIG_KEYS = [
  "DATASET_TABLE",
  "VIEW_DESCRIPTION",
  "VIEW_HEADER_IMAGE",
  "LOGO_URL",
] as const satisfies ReadonlyArray<keyof ViewConfig>;

export type CopyConfigSource = {
  key: string;
  label: string;
  viewConfig: ViewConfig;
  secondaryDataset?: string | null;
};

/**
 * Deep-clones a view config without ConfigViewInfo identity fields.
 *
 * @param {ViewConfig} config - Source view configuration.
 * @returns {ViewConfig} Cloned config with view identity keys removed.
 */
export const omitViewInfoFields = (config: ViewConfig): ViewConfig => {
  const cloned: ViewConfig = JSON.parse(JSON.stringify(config));
  return Object.fromEntries(
    Object.entries(cloned).filter(
      ([key]) => !(VIEW_INFO_CONFIG_KEYS as readonly string[]).includes(key),
    ),
  ) as ViewConfig;
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
 * @param {MaybeRefOrGetter<string>} currentDataset - Primary of the view being
 *   created/edited (string or ref — ref is needed on create where primary changes).
 * @param {MaybeRefOrGetter<ViewType | undefined>} currentViewType - View type
 *   being created/edited.
 * @returns {object} Reactive state and handlers for the copy config modal.
 */
export const useCopyConfig = (
  viewRows: Ref<ViewConfigRow[]>,
  currentDataset: MaybeRefOrGetter<string>,
  currentViewType: MaybeRefOrGetter<ViewType | undefined>,
) => {
  const showCopyModal = ref(false);
  const selectedCopySource = ref<string>("");
  const configToCopy = ref<ViewConfig | null>(null);
  const secondaryDatasetToCopy = ref<string | null>(null);

  const otherCopySources = computed<CopyConfigSource[]>(() => {
    const type = toValue(currentViewType);
    if (!type) {
      return [];
    }

    const primary = toValue(currentDataset);

    return viewRows.value
      .filter((row) => row.viewType === type && row.primaryDataset !== primary)
      .map((row) => ({
        key: copySourceKey(row.primaryDataset, row.viewType),
        label: row.viewName || row.primaryDataset,
        viewConfig: omitViewInfoFields(row.viewConfig),
        secondaryDataset: row.secondaryDataset ?? null,
      }))
      .filter((source) => Object.keys(source.viewConfig).length > 0)
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
      configToCopy.value = omitViewInfoFields(source.viewConfig);
      secondaryDatasetToCopy.value = source.secondaryDataset ?? null;
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
    secondaryDatasetToCopy,
    otherCopySources,
    handleOpenCopyModal,
    handleConfirmCopy,
    handleCancelCopy,
  };
};
