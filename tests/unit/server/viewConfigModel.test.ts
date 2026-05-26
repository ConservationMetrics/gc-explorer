import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("single-table view config model", () => {
  it("adds view metadata columns in schema and migration", async () => {
    const schema = await readFile(
      resolve(process.cwd(), "server/database/schemas/viewConfig.ts"),
      "utf8",
    );
    const migration = await readFile(
      resolve(
        process.cwd(),
        "server/database/migrations/0007_add_view_config_view_columns.sql",
      ),
      "utf8",
    );

    expect(schema).toContain('integer("view_id")');
    expect(schema).toContain('text("view_name")');
    expect(schema).toContain('text("view_type")');
    expect(schema).toContain('text("primary_dataset")');
    expect(schema).toContain('text("secondary_dataset")');
    expect(schema).toContain('text("view_config")');

    expect(schema).toContain('pgTable("views"');
    expect(migration).toContain(
      'ALTER TABLE IF EXISTS "view_config" RENAME TO "views"',
    );
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS "view_id"');
    expect(migration).toContain('"primary_dataset" = COALESCE');
    expect(migration).toContain("views_config\"::jsonb ->> 'MAPEO_TABLE'");
    expect(migration).toContain("THEN 'alert'");
  });

  it("keeps new view metadata columns synced on config writes", async () => {
    const dbOperations = await readFile(
      resolve(process.cwd(), "server/database/dbOperations.ts"),
      "utf8",
    );

    expect(dbOperations).toContain("CREATE TABLE views");
    expect(dbOperations).toContain("const buildViewConfigColumns =");
    expect(dbOperations).toContain('viewType === "alert"');
    expect(dbOperations).toContain("config.MAPEO_TABLE?.trim() || null");
    expect(dbOperations).toContain("...viewColumns");
    expect(dbOperations).toContain("...buildViewConfigColumns");
  });
});
