import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("old view type config table cleanup migration", () => {
  it("drops legacy view_config_* tables only when they exist", async () => {
    const migration = await readFile(
      resolve(
        process.cwd(),
        "server/database/migrations/0007_drop_old_view_type_config_tables.sql",
      ),
      "utf8",
    );

    expect(migration).toContain('DROP TABLE IF EXISTS "view_config_alerts"');
    expect(migration).toContain('DROP TABLE IF EXISTS "view_config_map"');
    expect(migration).toContain('DROP TABLE IF EXISTS "view_config_gallery"');
  });
});
