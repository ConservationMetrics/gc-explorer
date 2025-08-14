import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      script: [
        { src: "/vendor/lightbox/lightbox-plus-jquery.js", defer: true },
      ],
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "" },
        { name: "format-detection", content: "telephone=no" },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  devtools: { enabled: true },

  nitro: {
    plugins: ["@/server/index.ts", "@/server/plugins/apiAuth.ts"],
    routeRules: {
      "/api/**": {
        cors: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, x-api-key",
        },
      },
    },
  },

  modules: [
    "nuxt-auth-utils",
    "@nuxt/eslint",
    "@nuxtjs/i18n",
    "@nuxt/test-utils/module",
    "nuxt-windicss",
    "reka-ui/nuxt",
    "@nuxt/image",
  ],

  image: {
    // Image presets for common use cases
    presets: {
      // Gallery images - responsive with good quality
      gallery: {
        modifiers: {
          format: "webp",
          quality: 80,
          fit: "cover",
        },
      },
      // Logo images - high quality for branding
      logo: {
        modifiers: {
          format: "webp",
          quality: 85,
          fit: "contain",
        },
      },
      // Icon images - optimized for small sizes
      icon: {
        modifiers: {
          format: "webp",
          quality: 90,
          fit: "contain",
        },
      },
      // Thumbnail images - smaller size for previews
      thumbnail: {
        modifiers: {
          format: "webp",
          quality: 75,
          width: 300,
          height: 200,
          fit: "cover",
        },
      },
    },

    // Domain whitelist for external images
    domains: [],

    // Format priority for modern browsers
    format: ["webp", "avif", "jpeg"],

    // Default quality
    quality: 80,
  },

  css: ["public/vendor/lightbox/lightbox.min.css", "~/assets/overlay.css"],

  i18n: {
    locales: [
      { code: "en", name: "English", language: "en-US", file: "en.json" },
      { code: "es", name: "Español", language: "es-ES", file: "es.json" },
      { code: "pt", name: "Português", language: "pt-PT", file: "pt.json" },
      { code: "nl", name: "Nederlands", language: "nl-NL", file: "nl.json" },
    ],
    defaultLocale: "en",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      alwaysRedirect: true,
      redirectOn: "all",
    },
    strategy: "no_prefix",
    skipSettingLocaleOnNavigate: true, // persists locale when route changes
  },

  runtimeConfig: {
    configDatabase: "guardianconnector",
    database: "",
    dbHost: "",
    dbUser: "",
    dbPassword: "",
    dbPort: "5432",
    dbSsl: true,
    dbTable: "",
    port: "8080",
    // Session secret for nuxt-auth-utils
    sessionSecret: "your-session-secret-key-change-in-production",
    // OAuth configuration for nuxt-auth-utils
    oauth: {
      auth0: {
        clientId: "",
        clientSecret: "",
        domain: "",
      },
    },
    public: {
      allowedFileExtensions: {
        image: ["jpg", "jpeg", "png", "webp"],
        audio: ["mp3", "ogg", "wav", "m4a"],
        video: ["mov", "mp4", "avi", "mkv"],
      },
      appApiKey: "",
      authStrategy: "none",
      baseUrl: "http://localhost:8080",
    },
  },
});
