import withNuxt from "./.nuxt/eslint.config.mjs";
import pluginVue from "eslint-plugin-vue";

export default withNuxt().override("nuxt/vue/rules", {
  rules: {
    // Override Nuxt's Vue rules with the full recommended set
    ...pluginVue.configs["flat/recommended"][0].rules,

    // Keep your custom overrides
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
    // Add block-order rule for top-level tag ordering
    "vue/block-order": [
      "error",
      {
        order: ["script", "template", "style"],
      },
    ],
  },
});
