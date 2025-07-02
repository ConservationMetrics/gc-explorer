/* Mock module for vue-i18n to be used by Vitest module resolution.
   This file provides the essential vue-i18n API that components expect.
   
   We need to mock vue-i18n because it's provided by @nuxtjs/i18n as a transitive dependency,
   but Vitest can't resolve it during test runs. The mock provides the essential API methods
   that components expect, including useI18n() composable and createI18n() factory function. */

import { vi } from "vitest";

// Mock useI18n composable
export const useI18n = vi.fn(() => ({
  t: (key: string, ...args: unknown[]) => {
    // Simple translation that returns the key, or interpolates if args provided
    if (args.length > 0) {
      return `${key} ${args.join(" ")}`;
    }
    return key;
  },
  locale: { value: "en" },
  locales: { value: ["en"] },
  d: (date: Date, _format?: string) => date.toLocaleDateString(),
  n: (num: number, _format?: string) => num.toLocaleString(),
  te: (_key: string) => true, // Assume all keys exist
  tm: (key: string) => ({ [key]: key }), // Return object with key
}));

// Mock createI18n factory function
export const createI18n = vi.fn(() => ({
  install: vi.fn(),
  global: {
    t: (key: string) => key,
    locale: { value: "en" },
    locales: { value: ["en"] },
  },
}));

// Export as default for compatibility
export default {
  useI18n,
  createI18n,
};
