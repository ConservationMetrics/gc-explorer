import { migrate } from "drizzle-orm/postgres-js/migrator";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { configDb, configPg } from "../database/dbConnection";

// Run migrations at server startup, every time.
// https://orm.drizzle.team/docs/migrations (Option 4)
export default defineNitroPlugin(async () => {
  await migrate(configDb, {
    migrationsFolder: resolve("./server/database/migrations"),
  });

  if (process.env.CI !== "true") return;

  const seedPath = resolve("tests/db-seed/guardianconnector.sql");
  if (!existsSync(seedPath)) return;

  const seedSql = readFileSync(seedPath, "utf-8");
  await configPg.unsafe(seedSql);
});
