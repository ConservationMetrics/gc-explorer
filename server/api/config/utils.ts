import { fetchTableNames } from "../../database/dbOperations";
import type { DatabaseConnection } from "@/types/types";

export const getFilteredTableNames = async (database: DatabaseConnection) => {
  let tableNames = await fetchTableNames(database);
  // Filter out anything with metadata, columns, and anything PostGIS related
  tableNames = tableNames.filter(
    (name) =>
      !name.includes("metadata") &&
      !name.includes("columns") &&
      !name.includes("spatial_ref_sys"),
  );

  return tableNames;
};
