<script setup lang="ts">
import type { User } from "@/types/types";
import { Role } from "@/types/types";
import GlobeLanguagePicker from "@/components/shared/GlobeLanguagePicker.vue";

const config = useRuntimeConfig();
const { t } = useI18n();

const communityName = computed(() => {
  return config.public.communityName || t("community");
});

const {
  public: { authStrategy },
} = useRuntimeConfig();

const { loggedIn, user } = useUserSession();

const mobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const shouldShowConfigLink = computed(() => {
  // Show config link in CI environment
  if (process.env.CI) {
    return true;
  }

  if (authStrategy === "none") {
    return true;
  }

  if (authStrategy === "auth0" && loggedIn.value && user.value) {
    const typedUser = user.value as User | null;
    const userRole = typedUser?.userRole ?? Role.SignedIn;
    return userRole >= Role.Admin;
  }

  return false;
});
</script>

<template>
  <header
    class="bg-gradient-to-r mb-2 from-purple-100 to-purple-50 w-5/6 place-self-center mt-2 rounded-xl p-3"
  >
    <!-- Desktop Layout - show above 1000px -->
    <div class="flex max-[1000px]:hidden relative items-end justify-around">
      <!-- Left: GC Explorer Logo -->
      <div class="flex items-center">
        <img
          src="/gcexplorer.png"
          alt="Guardian Connector Explorer"
          class="h-10 w-auto max-[1200px]:h-8"
        />
        <div class="rounded-lg px-4 py-2 max-[1200px]:px-2">
          <h1 class="text-lg max-[1200px]:text-xs font-bold">
            Guardian Connector
          </h1>
        </div>
      </div>

      <!-- Tab with Community Name -->
      <div
        class="tab-container flex absolute left-[25%] -bottom-3 flex-col items-center t-[32%]"
      >
        <button class="tab-trigger active">
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
          <span class="text-lg max-[1200px]:text-xs font-bold">{{
            communityName
          }}</span>
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
        </button>
      </div>

      <!-- Right: Action buttons -->
      <div class="flex items-center space-x-3 ml-auto mr-2">
        <!-- Config Management (Gear Icon) -->
        <div v-if="shouldShowConfigLink" class="relative group">
          <NuxtLink
            to="/config"
            class="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </NuxtLink>
          <!-- Tooltip -->
          <div
            class="absolute right-0 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap"
          >
            {{ $t("manageDatasets") || "Manage Datasets" }}
          </div>
        </div>

        <!-- Language Picker (Globe Icon) -->
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
      <!-- Left: GC Explorer Logo -->
      <div class="flex items-center">
        <img
          src="/gcexplorer.png"
          alt="Guardian Connector Explorer"
          class="h-10 w-auto"
        />
        <div class="rounded-lg px-2">
          <h1 class="text-sm font-bold">Guardian Connector</h1>
        </div>
      </div>

      <!-- Right: Config Icon and Hamburger Menu -->
      <div class="flex items-center space-x-2">
        <!-- Config Icon (if admin) -->
        <div v-if="shouldShowConfigLink" class="relative">
          <NuxtLink
            to="/config"
            class="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </NuxtLink>
        </div>

        <!-- Hamburger Menu Button -->
        <button
          class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-purple-200 transition-colors"
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
      class="hidden max-[1000px]:block mt-4 p-4 bg-white rounded-lg border border-purple-200 shadow-lg"
    >
      <!-- Config Management (if admin) -->
      <NuxtLink
        v-if="shouldShowConfigLink"
        to="/config"
        class="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-purple-50 transition-colors mb-2"
        @click="mobileMenuOpen = false"
      >
        <svg
          class="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span class="text-sm text-gray-700">{{
          $t("manageDatasets") || "Manage Datasets"
        }}</span>
      </NuxtLink>

      <!-- Language Picker -->
      <GlobeLanguagePicker variant="mobile" />
    </div>
  </header>
</template>
