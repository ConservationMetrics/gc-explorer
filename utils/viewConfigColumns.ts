import type {
  ColumnEntry,
  FunctionalColumnKey,
  ViewConfig,
  ViewConfigColumnValidation,
  ViewType,
} from "@/types";
import { compareLabels } from "@/utils/identifierUtils";

export const PROTECTED_COLUMN_NAMES = [
  "_id",
  "g__type",
  "g__coordinates",
] as const;

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

const getColumnEntry = (
  columns: ColumnEntry[],
  name: string,
): ColumnEntry | undefined => {
  return columns.find(
    (column) => column.original_column === name || column.sql_column === name,
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

const getSelectedSqlColumns = (
  config: ViewConfig,
  viewType: ViewType,
  hasSecondaryDataset: boolean,
  source: "primary" | "secondary",
): Set<string> => {
  return new Set(
    FUNCTIONAL_COLUMN_KEYS.flatMap((key) => {
      const value = config[key]?.trim();
      return value &&
        getColumnSource(key, viewType, hasSecondaryDataset) === source
        ? [value]
        : [];
    }),
  );
};

/**
 * Gets the primary dataset columns that can be selected as unwanted columns.
 *
 * @param {ColumnEntry[]} columns - Available primary dataset columns.
 * @param {ViewConfig} config - Current view configuration.
 * @param {ViewType} viewType - Current view type.
 * @param {boolean} hasSecondaryDataset - Whether the view uses a secondary dataset.
 * @returns {ColumnEntry[]} Columns that are not protected or used by another field.
 */
export const getUnwantedColumnOptions = (
  columns: ColumnEntry[],
  config: ViewConfig,
  viewType: ViewType,
  hasSecondaryDataset: boolean,
): ColumnEntry[] => {
  const selectedColumns = getSelectedSqlColumns(
    config,
    viewType,
    hasSecondaryDataset,
    "primary",
  );
  const protectedColumns = new Set<string>(PROTECTED_COLUMN_NAMES);

  return columns
    .filter(
      (column) =>
        !protectedColumns.has(column.sql_column) &&
        !selectedColumns.has(column.sql_column),
    )
    .sort(
      (a, b) =>
        compareLabels(a.original_column, b.original_column) ||
        compareLabels(a.sql_column, b.sql_column),
    );
};

/**
 * Validates configured column names and unwanted-column conflicts.
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

  const unwantedSource =
    viewType === "alerts" && hasSecondaryDataset ? "secondary" : "primary";
  const unwantedColumns =
    unwantedSource === "secondary" ? secondaryColumns : primaryColumns;
  const selectedColumns = getSelectedSqlColumns(
    config,
    viewType,
    hasSecondaryDataset,
    unwantedSource,
  );
  const protectedColumns = new Set<string>(PROTECTED_COLUMN_NAMES);
  const unwantedNames = (config.UNWANTED_COLUMNS ?? "")
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
  const invalidUnwantedColumns: string[] = [];
  const protectedUnwantedColumns: string[] = [];
  const conflictingUnwantedColumns: string[] = [];

  unwantedNames.forEach((name) => {
    const column = getColumnEntry(unwantedColumns, name);
    if (!column) {
      invalidUnwantedColumns.push(name);
    } else if (protectedColumns.has(column.sql_column)) {
      protectedUnwantedColumns.push(name);
    } else if (selectedColumns.has(column.sql_column)) {
      conflictingUnwantedColumns.push(name);
    }
  });

  const isValid =
    Object.keys(invalidSelections).length === 0 &&
    invalidUnwantedColumns.length === 0 &&
    protectedUnwantedColumns.length === 0 &&
    conflictingUnwantedColumns.length === 0;

  return {
    conflictingUnwantedColumns,
    invalidSelections,
    invalidUnwantedColumns,
    isValid,
    protectedUnwantedColumns,
  };
};
