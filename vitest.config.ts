import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**", "tests/e2e/**"],
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": "/",
      "#imports": "/tests/unit/helpers/importsMock.ts",
      "vue-i18n": "/tests/unit/helpers/vueI18nMock.ts",
    },
  },
});
