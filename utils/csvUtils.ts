/**
 * Escapes a value for safe use in CSV files
 * - Replaces newlines with escaped \n characters
 * - Wraps values containing commas or quotes in double quotes
 * - Escapes internal quotes by doubling them
 */
export function escapeCSVValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  
  let strValue = String(value);
  
  // Replace actual newlines with escaped \n and \r characters
  strValue = strValue.replace(/\r\n/g, "\\n");
  strValue = strValue.replace(/\n/g, "\\n");
  strValue = strValue.replace(/\r/g, "\\r");
  
  // Wrap in quotes if contains comma or quote, and escape internal quotes
  if (strValue.includes(",") || strValue.includes('"')) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }
  
  return strValue;
}


