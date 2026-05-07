/**
 * Builds an alerts projection from preferred columns and enforces required fields.
 *
 * @param {string} table - Alerts table name.
 * @param {string[]} preferredColumns - Columns to project when available.
 * @param {string[]} requiredColumns - Columns that must exist for this dataset shape.
 * @param {string[]} availableColumns - Columns available on the target table.
 * @param {string} requirementLabel - Human-readable label used in error messaging.
 * @returns {string[]} Preferred columns that exist on the target table.
 */
export const buildRequiredAlertsProjection = (
  table: string,
  preferredColumns: string[],
  requiredColumns: string[],
  availableColumns: string[],
  requirementLabel: string,
): string[] => {
  const missingRequiredColumns = requiredColumns.filter(
    (columnName) => !availableColumns.includes(columnName),
  );

  if (missingRequiredColumns.length > 0) {
    throw createError({
      statusCode: 422,
      statusMessage: `${requirementLabel} require columns ${missingRequiredColumns.join(", ")} in table "${table}".`,
    });
  }

  return preferredColumns.filter((columnName) =>
    availableColumns.includes(columnName),
  );
};
