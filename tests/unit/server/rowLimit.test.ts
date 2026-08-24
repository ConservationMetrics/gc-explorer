import { describe, it, expect } from "vitest";
import { validateRowLimit } from "@/server/utils/dbHelpers";

/** Matches `runtimeConfig.public.rowLimit` default in `nuxt.config.ts`. */
const DEFAULT_ROW_LIMIT = 10_000;

describe("validateRowLimit", () => {
  it("defaults to maxLimit when input is null", () => {
    expect(validateRowLimit(null, DEFAULT_ROW_LIMIT)).toBe(DEFAULT_ROW_LIMIT);
  });

  it("defaults to maxLimit when input is undefined", () => {
    expect(validateRowLimit(undefined, DEFAULT_ROW_LIMIT)).toBe(
      DEFAULT_ROW_LIMIT,
    );
  });

  it("returns parsed limit when valid and within bounds", () => {
    expect(validateRowLimit("500", DEFAULT_ROW_LIMIT)).toBe(500);
  });

  it("accepts limit equal to maxLimit", () => {
    expect(validateRowLimit(String(DEFAULT_ROW_LIMIT), DEFAULT_ROW_LIMIT)).toBe(
      DEFAULT_ROW_LIMIT,
    );
  });

  it("accepts numeric input", () => {
    expect(validateRowLimit(100, DEFAULT_ROW_LIMIT)).toBe(100);
  });

  it("throws 422 when limit exceeds maxLimit", () => {
    try {
      validateRowLimit(String(DEFAULT_ROW_LIMIT + 1), DEFAULT_ROW_LIMIT);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      const err = error as Error & { statusCode: number };
      expect(err.statusCode).toBe(422);
      expect(err.message).toContain("exceeds server maximum");
    }
  });

  it("throws 422 for non-numeric limit", () => {
    try {
      validateRowLimit("abc", DEFAULT_ROW_LIMIT);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      const err = error as Error & { statusCode: number };
      expect(err.statusCode).toBe(422);
      expect(err.message).toContain("positive integer");
    }
  });

  it("throws 422 for zero limit", () => {
    try {
      validateRowLimit("0", DEFAULT_ROW_LIMIT);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      const err = error as Error & { statusCode: number };
      expect(err.statusCode).toBe(422);
    }
  });

  it("throws 422 for negative limit", () => {
    try {
      validateRowLimit("-5", DEFAULT_ROW_LIMIT);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      const err = error as Error & { statusCode: number };
      expect(err.statusCode).toBe(422);
    }
  });

  it("throws 422 for fractional limit", () => {
    try {
      validateRowLimit("10.5", DEFAULT_ROW_LIMIT);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      const err = error as Error & { statusCode: number };
      expect(err.statusCode).toBe(422);
    }
  });
});
