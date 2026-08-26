<script setup lang="ts">
import GlobeLanguagePicker from "@/components/shared/GlobeLanguagePicker.vue";
import HeaderBrand from "@/components/shared/HeaderBrand.vue";

const config = useRuntimeConfig();
const { t } = useI18n();

const communityName = computed(() => {
  return config.public.communityName || t("community");
});

const mobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};
</script>

<template>
  <header
    class="bg-gradient-to-r mb-2 from-violet-100 to-violet-50 w-5/6 place-self-center mt-2 rounded-xl p-3"
  >
    <!-- Desktop Layout - show above 1000px -->
    <div class="flex max-[1000px]:hidden items-end justify-between gap-4">
      <div class="relative">
        <HeaderBrand />

        <!-- Tab with Community Name -->
        <div
          class="tab-container flex absolute left-full -bottom-3 z-10 flex-col items-center"
        >
          <NuxtLink to="/" class="tab-trigger active">
            <svg
              class="left-curve"
              xmlns="http://www.w3.org/2000/svg"
              xml:space="preserve"
              style="
                fill-rule: evenodd;
                clip-rule: evenodd;
                stroke-linejoin: round;
                stroke-miterlimit: 2;
              "
              viewBox="0 0 608 647"
            >
              <path
                d="M1347.436 2760H740v-646.902s200.986 16.142 313.006 311.678c104.814 276.525 231.346 327.558 294.43 335.224Z"
                style="fill: currentColor"
                transform="translate(-740 -2113.0982)"
              />
            </svg>
            <span class="text-lg font-bold">{{ communityName }}</span>
            <svg
              class="right-curve"
              xmlns="http://www.w3.org/2000/svg"
              xml:space="preserve"
              style="
                fill-rule: evenodd;
                clip-rule: evenodd;
                stroke-linejoin: round;
                stroke-miterlimit: 2;
              "
              viewBox="0 0 608 647"
            >
              <path
                d="M1347.436 2760H740v-646.902s200.986 16.142 313.006 311.678c104.814 276.525 231.346 327.558 294.43 335.224Z"
                style="fill: currentColor"
                transform="translate(-740 -2113.0982)"
              />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Right: Action buttons -->
      <div class="flex items-center gap-3 ml-auto mr-2 shrink-0">
        <!-- Language Picker -->
        <div class="relative group">
          <GlobeLanguagePicker theme="white" variant="icon" />
          <!-- Tooltip -->
          <div
            class="absolute right-0 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap"
          >
            {{ $t("header.languagePicker") || "Language" }}
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout - show below 1000px -->
    <div class="hidden max-[1000px]:flex items-center justify-between">
      <HeaderBrand />

      <div class="flex items-center gap-2">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-violet-200 transition-colors"
          aria-label="Menu"
          @click="toggleMobileMenu"
        >
          <svg
            class="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Dropdown -->
    <div
      v-if="mobileMenuOpen"
      class="hidden max-[1000px]:block mt-4 p-4 bg-white rounded-lg border border-violet-200 shadow-lg"
    >
      <!-- Language Picker -->
      <GlobeLanguagePicker variant="mobile" />
    </div>
  </header>
</template>
