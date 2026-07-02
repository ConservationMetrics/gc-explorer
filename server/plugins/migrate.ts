import { migrate } from "drizzle-orm/postgres-js/migrator";
import { resolve } from "node:path";
import { configDb } from "../database/dbConnection";

// Run migrations at server startup, every time.
// https://orm.drizzle.team/docs/migrations (Option 4)
export default defineNitroPlugin(async () => {
  await migrate(configDb, {
    migrationsFolder: resolve("./server/database/migrations"),
  });
});
