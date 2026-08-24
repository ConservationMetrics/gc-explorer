import type {
  ColumnEntry,
  FunctionalColumnKey,
  ViewConfig,
  ViewConfigColumnValidation,
  ViewType,
} from "@/types";
import { compareLabels } from "@/utils/identifierUtils";

export const FUNCTIONAL_COLUMN_KEYS: readonly FunctionalColumnKey[] = [
  "COLOR_COLUMN",
  "FRONT_END_FILTER_COLUMN",
  "TIMESTAMP_COLUMN",
  "MEDIA_COLUMN",
  "ICON_COLUMN",
] as const;

const NON_SELECTABLE_FUNCTIONAL_COLUMN_NAMES = new Set(["_id"]);

/**
 * Gets columns that can be used by functional Config fields.
 *
 * @param {ColumnEntry[]} columns - Available dataset columns.
 * @returns {ColumnEntry[]} Columns that can be selected.
 */
export const getSelectableColumnOptions = (
  columns: ColumnEntry[],
): ColumnEntry[] => {
  return columns
    .filter(
      (column) =>
        !NON_SELECTABLE_FUNCTIONAL_COLUMN_NAMES.has(column.sql_column),
    )
    .sort(
      (a, b) =>
        compareLabels(a.original_column, b.original_column) ||
        compareLabels(a.sql_column, b.sql_column),
    );
};

const getColumnSource = (
  key: FunctionalColumnKey,
  viewType: ViewType,
  hasSecondaryDataset: boolean,
): "primary" | "secondary" => {
  if (
    key === "FRONT_END_FILTER_COLUMN" &&
    viewType === "alerts" &&
    hasSecondaryDataset
  ) {
    return "secondary";
  }

  return "primary";
};

/**
 * Validates configured column names.
 *
 * @param {ViewConfig} config - View configuration to validate.
 * @param {ColumnEntry[]} primaryColumns - Available primary dataset columns.
 * @param {ColumnEntry[]} secondaryColumns - Available secondary dataset columns.
 * @param {ViewType} viewType - Current view type.
 * @param {boolean} hasSecondaryDataset - Whether the view uses a secondary dataset.
 * @returns {ViewConfigColumnValidation} Validation details for the UI and API.
 */
export const validateViewConfigColumns = (
  config: ViewConfig,
  primaryColumns: ColumnEntry[],
  secondaryColumns: ColumnEntry[],
  viewType: ViewType,
  hasSecondaryDataset: boolean,
): ViewConfigColumnValidation => {
  const invalidSelections: Partial<Record<FunctionalColumnKey, string>> = {};

  FUNCTIONAL_COLUMN_KEYS.forEach((key) => {
    const value = config[key]?.trim();
    if (!value) return;

    const source = getColumnSource(key, viewType, hasSecondaryDataset);
    const columns = source === "secondary" ? secondaryColumns : primaryColumns;
    if (
      !getSelectableColumnOptions(columns).some(
        (column) => column.sql_column === value,
      )
    ) {
      invalidSelections[key] = value;
    }
  });

  return {
    invalidSelections,
    isValid: Object.keys(invalidSelections).length === 0,
  };
};
