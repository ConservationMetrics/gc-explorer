import { describe, expect, it } from "vitest";

import {
  camelToSnake,
  formatDate,
  replaceUnderscoreWithSpace,
  toCamelCase,
} from "@/utils";

/**
 * Ensures utils/index.ts re-exports identifier and date helpers for `@/utils` imports.
 */
describe("utils barrel (index)", () => {
  it("re-exports identifier helpers", () => {
    expect(toCamelCase("FOO_BAR")).toBe("fooBar");
    expect(camelToSnake("fooBar")).toBe("foo_bar");
    expect(replaceUnderscoreWithSpace("a_b")).toBe("a b");
  });

  it("re-exports formatDate from dateUtils", () => {
    expect(typeof formatDate).toBe("function");
  });
});
