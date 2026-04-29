import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const FETCH_DATA_ROUTE_FILES = [
  "server/api/[table]/alerts.ts",
  "server/api/[table]/data.ts",
  "server/api/[table]/export.get.ts",
  "server/api/[table]/gallery.ts",
  "server/api/[table]/map.ts",
  "server/api/[table]/statistics-export.get.ts",
];

describe("fetchData projection guardrails", () => {
  it("ensures every route-level fetchData call defines mainColumns", async () => {
    for (const relativePath of FETCH_DATA_ROUTE_FILES) {
      const fullPath = resolve(process.cwd(), relativePath);
      const fileContents = await readFile(fullPath, "utf8");

      const fetchDataCallCount = (fileContents.match(/fetchData\s*\(/g) ?? [])
        .length;
      const mainColumnsCount = (
        fileContents.match(/mainColumns\s*:|mainColumns\s*,/g) ?? []
      ).length;

      expect(mainColumnsCount).toBeGreaterThanOrEqual(fetchDataCallCount);
    }
  });
});
