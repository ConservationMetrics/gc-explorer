import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**", "e2e/**"],
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": "/",
      "vue-i18n": "/test/helpers/vueI18nMock.ts",
    },
  },
});
