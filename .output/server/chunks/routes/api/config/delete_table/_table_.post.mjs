import { d as defineEventHandler, g as getDatabaseConnection, s as sendError } from '../../../../nitro/nitro.mjs';
import { r as removeTableFromConfig } from '../../../../_/dbOperations.mjs';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'pg';
import 'node:url';
import 'ipx';

const _table__post = defineEventHandler(async (event) => {
  var _a, _b;
  const table = (_b = (_a = event.context) == null ? void 0 : _a.params) == null ? void 0 : _b.table;
  try {
    const configDb = await getDatabaseConnection(true);
    await removeTableFromConfig(configDb, table);
    return { message: "Table removed from views configuration." };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error removing table from config on API side:",
        error.message
      );
      return sendError(event, new Error(error.message));
    } else {
      console.error(
        "Unknown error removing table from config on API side:",
        error
      );
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});

export { _table__post as default };
//# sourceMappingURL=_table_.post.mjs.map
