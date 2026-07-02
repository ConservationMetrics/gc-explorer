import { afterEach, describe, expect, it } from "vitest";
import { assertValidNuxtTestEnv, isNuxtTestEnv } from "@/utils/nuxtTestEnv";

describe("nuxtTestEnv", () => {
  afterEach(() => {
    delete process.env.NUXT_TEST;
  });

  it("treats true as enabled (case-insensitive)", () => {
    for (const value of ["true", "TRUE", "True"]) {
      process.env.NUXT_TEST = value;
      expect(isNuxtTestEnv()).toBe(true);
    }
  });

  it("treats false/unset as disabled", () => {
    expect(isNuxtTestEnv()).toBe(false);

    for (const value of ["false", "FALSE", ""]) {
      process.env.NUXT_TEST = value;
      expect(isNuxtTestEnv()).toBe(false);
    }
  });

  it("throws on unrecognized values", () => {
    for (const value of ["yes", "1", "0"]) {
      process.env.NUXT_TEST = value;
      expect(() => assertValidNuxtTestEnv()).toThrow(/NUXT_TEST must be/);
      expect(() => isNuxtTestEnv()).toThrow(/NUXT_TEST must be/);
    }
  });
});
