import { fetchTableNames } from "@/server/database/dbOperations";

/** Retrieves table names from the database, excluding those with metadata, columns, and PostGIS-related entries. */
export const getFilteredTableNames = async () => {
  if (process.env.CI) {
    return ["fake_alerts", "bcmform_responses"];
  }

  let tableNames = await fetchTableNames();
  tableNames = tableNames.filter(
    (name) =>
      !name.includes("metadata") &&
      !name.includes("columns") &&
      !name.includes("spatial_ref_sys"),
  );

  return tableNames;
};
