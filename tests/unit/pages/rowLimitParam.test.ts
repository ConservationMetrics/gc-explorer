import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("row limit runtime config", () => {
  it("nuxt.config sets public.rowLimit", () => {
    const content = readFileSync(resolve("nuxt.config.ts"), "utf-8");
    expect(content).toMatch(/rowLimit:\s*10_000/);
  });
});

describe("client pages pass ?limit to dataset API endpoints", () => {
  const pages = [
    "pages/map/[tablename].vue",
    "pages/gallery/[tablename].vue",
    "pages/alerts/[tablename].vue",
  ];

  it.each(pages)("%s uses runtime rowLimit and passes it to useFetch", (page) => {
    const content = readFileSync(resolve(page), "utf-8");
    expect(content).toContain("useRuntimeConfig().public.rowLimit");
    expect(content).toContain("params: { limit: rowLimit }");
  });

  it.each(pages)("%s triggers row-limit toast via composable", (page) => {
    const content = readFileSync(resolve(page), "utf-8");
    expect(content).toContain("useRowLimitReachedToast(data, rowLimit)");
  });
});

describe("row limit toast composable", () => {
  it("uses useToast warning for partial results", () => {
    const content = readFileSync(
      resolve("composables/useRowLimitReachedToast.ts"),
      "utf-8",
    );
    expect(content).toContain("useToast");
    expect(content).toContain("warning");
    expect(content).toContain("rowLimitReachedTitle");
    expect(content).toContain("rowLimitReachedMessage");
  });
});
