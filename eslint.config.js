import globals from "globals";
import js from "@eslint/js";
import gitignore from "eslint-config-flat-gitignore";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  gitignore(),
  { files: ["**/*.{js,ts,vue}"] },
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  {
    files: ["**/*.{js,ts,vue}"],
    rules: {
      "no-unused-vars": [
        "warn",
        { ignoreRestSiblings: true, argsIgnorePattern: "^_" },
      ],
      "no-undef": "warn",
      "vue/require-default-prop": "off",
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always",
            normal: "never",
            component: "always",
          },
        },
      ],
    },
  },
  {
    ignores: ["public/"],
  },
);
