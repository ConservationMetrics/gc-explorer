import { fetchTableColumnEntries } from "@/server/database/dbOperations";
import { getTableParam } from "@/server/utils/dbHelpers";
import { validatePermissions } from "@/utils/accessControls";

import type { DatasetColumnsResponse } from "@/types";
import type { H3Event } from "h3";

export default defineEventHandler(
  async (event: H3Event): Promise<DatasetColumnsResponse> => {
    await validatePermissions(event, "admin");

    const table = getTableParam(event);
    const columns = await fetchTableColumnEntries(table);

    return {
      columns,
      table,
    };
  },
);
