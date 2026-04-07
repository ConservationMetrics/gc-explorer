import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ROW_LIMIT } from "@/utils";

describe("ROW_LIMIT constant", () => {
  it("is 10,000", () => {
    expect(ROW_LIMIT).toBe(10_000);
  });
});

describe("client pages pass ?limit to dataset API endpoints", () => {
  const pages = [
    "pages/map/[tablename].vue",
    "pages/gallery/[tablename].vue",
    "pages/alerts/[tablename].vue",
  ];

  it.each(pages)("%s imports ROW_LIMIT and passes it to useFetch", (page) => {
    const content = readFileSync(resolve(page), "utf-8");
    expect(content).toContain('import { ROW_LIMIT } from "@/utils"');
    expect(content).toContain("params: { limit: ROW_LIMIT }");
  });

  it.each(pages)("%s shows a warning toast when rowLimitReached", (page) => {
    const content = readFileSync(resolve(page), "utf-8");
    expect(content).toContain("rowLimitReached");
    expect(content).toContain("useToast");
    expect(content).toContain("rowLimitReachedTitle");
    expect(content).toContain("rowLimitReachedMessage");
  });
});
