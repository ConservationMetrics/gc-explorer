import { fetchTableNames } from "@/server/database/dbOperations";

import type { DatabaseConnection } from "@/types/types";

/** Retrieves table names from the database, excluding those with metadata, columns, and PostGIS-related entries. */
export const getFilteredTableNames = async (database: DatabaseConnection) => {
  let tableNames = await fetchTableNames(database);
  tableNames = tableNames.filter(
    (name) =>
      !name.includes("metadata") &&
      !name.includes("columns") &&
      !name.includes("spatial_ref_sys"),
  );

  return tableNames;
};
