import { c as fetchTableNames } from '../../../_/dbOperations.mjs';

const getFilteredTableNames = async (database) => {
  let tableNames = await fetchTableNames(database);
  tableNames = tableNames.filter(
    (name) => !name.includes("metadata") && !name.includes("columns") && !name.includes("spatial_ref_sys")
  );
  return tableNames;
};

export { getFilteredTableNames };
//# sourceMappingURL=utils.mjs.map
