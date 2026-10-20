<script setup lang="ts">
import GlobeLanguagePicker from "@/components/shared/header/GlobeLanguagePicker.vue";
import HeaderBrand from "@/components/shared/header/HeaderBrand.vue";
import { useAuthActions } from "@/composables/auth/useAuth";
import { LogOut, Menu } from "lucide-vue-next";

const config = useRuntimeConfig();
const { t } = useI18n();
const { loggedIn } = useUserSession();
const { logout } = useAuthActions();

const isAuth0 = config.public.authStrategy === "auth0";

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

        <!-- Sign out -->
        <div
          v-if="isAuth0 && loggedIn"
          class="relative group"
        >
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-white transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            :aria-label="t('auth.signOut')"
            @click="logout"
          >
            <LogOut
              class="h-5 w-5 text-gray-600 group-hover:text-red-600"
            />
          </button>
          <div
            class="absolute right-0 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap"
          >
            {{ t("auth.signOut") }}
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
          <Menu class="w-6 h-6 text-gray-700" />
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

      <!-- Sign Out -->
      <button
        v-if="isAuth0 && loggedIn"
        class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-left"
        @click="
          logout();
          mobileMenuOpen = false;
        "
      >
        <LogOut class="w-5 h-5 text-red-600" />
        <span class="text-sm text-red-600 font-medium">{{
          t("auth.signOut")
        }}</span>
      </button>
    </div>
  </header>
</template>
