<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { SupportedLocale } from "@/types/types";

const { locale, locales, setLocale } = useI18n();
const { t } = useI18n();

interface Props {
  theme?: "purple" | "white" | "dark";
  variant?: "icon" | "mobile";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "white",
  variant: "icon",
});

// Populate available locales from i18n plugin
const availableLocales = computed(() => locales.value);
const _currentLocaleName = computed(() => {
  const currentLocale = locales.value.find(
    (lang) => lang.code === locale.value,
  );
  return currentLocale?.name || "";
});

const dropdownOpen = ref(false);
const languagePickerOpen = ref(false);

// Close dropdown when clicking outside (for desktop)
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".language-picker-container")) {
    dropdownOpen.value = false;
  }
};

// Load locale from session storage on mount and set up click outside handler
onMounted(() => {
  const savedLocale = sessionStorage.getItem("locale");
  if (savedLocale && locales.value.some((lang) => lang.code === savedLocale)) {
    setLocale(savedLocale as SupportedLocale);
  }
  if (props.variant !== "mobile") {
    document.addEventListener("click", handleClickOutside);
  }
});

onUnmounted(() => {
  if (props.variant !== "mobile") {
    document.removeEventListener("click", handleClickOutside);
  }
});

const changeLocale = (localeCode: string): void => {
  setLocale(localeCode as SupportedLocale);
  sessionStorage.setItem("locale", localeCode);
  dropdownOpen.value = false;
  languagePickerOpen.value = false;
};

const toggleLanguagePicker = () => {
  languagePickerOpen.value = !languagePickerOpen.value;
};

const dropdownClasses = computed(() => {
  switch (props.theme) {
    case "white":
      return "origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50";
    case "dark":
      return "origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-gray-600 z-50";
    case "purple":
    default:
      return "origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-gray-200 z-50";
  }
});

const itemClasses = computed(() => {
  switch (props.theme) {
    case "white":
      return "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors";
    case "dark":
      return "block px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors";
    case "purple":
    default:
      return "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors";
  }
});

// Mobile item classes
const mobileItemClasses = computed(() => {
  return (langCode: string) => [
    "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors",
    locale.value === langCode
      ? "bg-purple-100 text-purple-700 font-medium"
      : "text-gray-700 hover:bg-purple-50",
  ];
});
</script>

<template>
  <!-- Desktop Icon Variant -->
  <div
    v-if="variant === 'icon'"
    class="relative inline-block text-left language-picker-container"
  >
    <div>
      <button
        type="button"
        class="relative w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        :title="t('header.languagePicker') || 'Language'"
        @click.stop="dropdownOpen = !dropdownOpen"
      >
        <svg
          class="w-5 h-5 text-gray-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>
    <div v-if="dropdownOpen" :class="dropdownClasses" @click.stop>
      <div class="py-1">
        <a
          v-for="lang in availableLocales"
          :key="lang.code"
          href="#"
          :class="itemClasses"
          @click="
            ($event.preventDefault(),
            $event.stopPropagation(),
            changeLocale(lang.code))
          "
        >
          {{ lang.name }}
        </a>
      </div>
    </div>
  </div>

  <!-- Mobile Variant -->
  <div v-else-if="variant === 'mobile'" class="px-4 py-3 mb-2">
    <button
      class="w-full flex items-center justify-between space-x-3 hover:bg-purple-50 rounded-lg px-2 py-2 transition-colors"
      @click="toggleLanguagePicker"
    >
      <div class="flex items-center space-x-3">
        <svg
          class="w-5 h-5 text-gray-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="text-sm text-gray-700 font-medium">{{
          t("header.languagePicker") || "Language"
        }}</span>
      </div>
      <svg
        class="w-4 h-4 text-gray-600 transition-transform"
        :class="{ 'rotate-180': languagePickerOpen }"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
    <div v-if="languagePickerOpen" class="mt-2 space-y-1">
      <button
        v-for="lang in availableLocales"
        :key="lang.code"
        :class="mobileItemClasses(lang.code)"
        @click="changeLocale(lang.code)"
      >
        {{ lang.name }}
      </button>
    </div>
  </div>
</template>
