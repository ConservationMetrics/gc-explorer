/* Mock module for vue-i18n to be used by Vitest module resolution.
   This file provides the essential vue-i18n API that components expect.
   
   We need to mock vue-i18n because it's provided by @nuxtjs/i18n as a transitive dependency,
   but Vitest can't resolve it during test runs. The mock provides the essential API methods
   that components expect, including useI18n() composable and createI18n() factory function. */

import { vi } from "vitest";
import type { App } from "vue";

// Mock translation function
const mockT = (key: string, ...args: unknown[]) => {
  // Simple translation that returns the key, or interpolates if args provided
  if (args.length > 0) {
    return `${key} ${args.join(" ")}`;
  }
  return key;
};

// Mock useI18n composable
export const useI18n = vi.fn(() => ({
  t: mockT,
  locale: { value: "en" },
  locales: { value: ["en"] },
  d: (date: Date, _format?: string) => date.toLocaleDateString(),
  n: (num: number, _format?: string) => num.toLocaleString(),
  te: (_key: string) => true, // Assume all keys exist
  tm: (key: string) => ({ [key]: key }), // Return object with key
}));

// Mock createI18n factory function - returns a proper Vue plugin
export const createI18n = vi.fn(() => ({
  install(app: App) {
    // Provide $t to all components via globalProperties
    app.config.globalProperties.$t = mockT;
    app.config.globalProperties.$d = (date: Date) => date.toLocaleDateString();
    app.config.globalProperties.$n = (num: number) => num.toLocaleString();
  },
  global: {
    t: mockT,
    locale: { value: "en" },
    locales: { value: ["en"] },
  },
}));

// Export as default for compatibility
export default {
  useI18n,
  createI18n,
};
