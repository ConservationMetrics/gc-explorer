import {
  VIEW_CONFIG_MISSING_COLUMNS_ERROR,
  type ConfiguredColumn,
  type FunctionalColumnKey,
  type ViewConfigMissingColumnsErrorData,
} from "@/types";

/**
 * Returns the view-config column settings that have a non-empty name.
 *
 * @param {Array<{ field: FunctionalColumnKey; column?: string | null }>} columnSettings - Config field and column name pairs. Empty names are ignored.
 * @returns {ConfiguredColumn[]} Trimmed column settings that are set.
 */
export const getConfiguredColumns = (
  columnSettings: Array<{
    field: FunctionalColumnKey;
    column?: string | null;
  }>,
): ConfiguredColumn[] => {
  const configured: ConfiguredColumn[] = [];

  columnSettings.forEach((setting) => {
    const column = setting.column?.trim();
    if (column) {
      configured.push({ field: setting.field, column });
    }
  });

  return configured;
};

/**
 * Throws a 422 error when any configured column is missing from the warehouse table.
 * Reports every missing column in one response.
 *
 * @param {string} table - Warehouse table name.
 * @param {string[]} availableColumns - Column names on the warehouse table.
 * @param {ConfiguredColumn[]} configured - Config column settings that are set.
 * @returns {void}
 */
export const assertConfiguredColumnsExist = (
  table: string,
  availableColumns: string[],
  configured: ConfiguredColumn[],
): void => {
  const missing = configured.filter((entry) => {
    return !availableColumns.includes(entry.column);
  });

  if (missing.length === 0) return;

  const details = missing
    .map((entry) => `${entry.field} (${entry.column})`)
    .join(", ");
  const statusMessage = `View config refers to missing columns on table "${table}": ${details}.`;
  const data: ViewConfigMissingColumnsErrorData = {
    errorCode: VIEW_CONFIG_MISSING_COLUMNS_ERROR,
    missing,
    table,
  };

  throw Object.assign(new Error(statusMessage), {
    statusCode: 422,
    statusMessage,
    data,
  });
};
