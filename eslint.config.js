import withNuxt from "./.nuxt/eslint.config.mjs";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

export default withNuxt()
  .override("nuxt/vue/rules", {
    rules: {
      /* We import eslint-plugin-vue directly to access rules not included in @nuxt/eslint
      
       Investigation found @nuxt/eslint includes ~38 Vue rules vs 245+ available in eslint-plugin-vue.
       Missing rules include critical security and code quality protections that we want to enforce.
       Key additions:
       - Security: vue/no-v-html (prevents XSS), vue/require-explicit-emits (prevents silent bugs)
       - Quality: vue/attributes-order, vue/no-multiple-slot-args, vue/this-in-template
       - Structure: vue/block-order (enforced as error vs Nuxt's warn)
       This gives us the full recommended ruleset rather than Nuxt's curated subset,
       ensuring we catch potential issues that Nuxt's config might miss.
       
       We keep @nuxt/eslint because it provides:
       - Nuxt-specific optimizations and integrations
       - Proper TypeScript + Vue parsing configuration
       - Auto-import globals for Nuxt composables
       - Stylistic rules tailored for Nuxt projects
      */
      ...pluginVue.configs["flat/recommended"][0].rules,

      // Custom overrides
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
      // Enforce strict block ordering (Nuxt sets this to warn)
      "vue/block-order": [
        "error",
        {
          order: ["script", "template", "style"],
        },
      ],
      // Security: Prevent XSS via v-html (not included in Nuxt's config)
      "vue/no-v-html": "error",
      // Quality: Ensure explicit emit declarations
      "vue/require-explicit-emits": "error",
      // Quality: Prevent template misuse
      "vue/no-lone-template": "error",
    },
  })
  .override("nuxt/typescript/rules", {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: ".",
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.recommendedTypeChecked.rules,
      // TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      // Type compatibility rules
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/restrict-template-expressions": "warn",
      "@typescript-eslint/restrict-plus-operands": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
    },
  });
