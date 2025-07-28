<script lang="ts" setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

const { locale, locales, setLocale } = useI18n();

// Populate available locales from i18n plugin
const availableLocales = computed(() => locales.value);
const currentLocaleName = computed(() => {
  const currentLocale = locales.value.find(
    (lang) => lang.code === locale.value,
  );
  return currentLocale?.name || "";
});

const dropdownOpen = ref(false);

const changeLocale = (locale: { code: string }): void => {
  setLocale(locale.code as "en" | "es" | "pt" | "nl");
  dropdownOpen.value = false;
};
</script>

<template>
  <div class="relative inline-block text-left">
    <div>
      <button
        class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        @click="dropdownOpen = !dropdownOpen"
      >
        {{ currentLocaleName }}
        <svg
          class="-mr-1 ml-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
    <div
      v-if="dropdownOpen"
      class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
    >
      <div class="py-1">
        <a
          v-for="lang in availableLocales"
          :key="lang.code"
          href="#"
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          @click="
            ($event.preventDefault(),
            $event.stopPropagation(),
            changeLocale(lang))
          "
        >
          {{ lang.name }}
        </a>
      </div>
    </div>
  </div>
</template>
