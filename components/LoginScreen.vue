<script lang="ts" setup>
import { computed } from "vue";
import { onMounted, useI18n, useRuntimeConfig, useUserSession } from "#imports";
import GlassCard from "@/components/shared/GlassCard.vue";
import GlobeLanguagePicker from "./shared/GlobeLanguagePicker.vue";

interface Props {
  errorMessage: string;
}
const props = defineProps<Props>();
const { loggedIn } = useUserSession();
const { t } = useI18n();
const runtimeConfig = useRuntimeConfig();
const loginBackgroundSrc = computed(() => {
  const url = String(runtimeConfig.public.backgroundImage ?? "").trim();
  return url || "/background.jpg";
});
const loginWithAuth0 = () => {
  window.location.href = "/api/auth/auth0";
};
onMounted(() => {
  const redirectUrl = sessionStorage.getItem("redirect_url");
  if (redirectUrl && loggedIn.value) {
    sessionStorage.removeItem("redirect_url");
    window.location.href = redirectUrl;
  }
});
</script>

<template>
  <div
    class="relative flex h-dvh min-h-0 w-full max-w-full flex-col overflow-hidden"
  >
    <div class="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <img
        :src="loginBackgroundSrc"
        alt=""
        class="h-full w-full object-cover object-center"
      />
      <div
        class="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-stone-900/35 to-stone-900/55"
      ></div>
    </div>

    <div class="relative z-10 flex min-h-0 flex-1 flex-col">
      <div class="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <GlobeLanguagePicker theme="white" variant="icon" />
      </div>
      <main
        class="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overscroll-y-contain px-4 py-6 sm:py-12 md:py-16"
      >
        <GlassCard class="max-w-xl">
          <div class="flex flex-col items-center">
            <img
              src="/gcexplorer.png"
              alt=""
              class="h-24 w-auto max-w-[min(100%,18rem)] object-contain sm:h-28"
              width="288"
              height="112"
            />
          </div>
          <h1
            class="mt-6 text-balance text-center text-[1.65rem] font-medium leading-snug tracking-tight text-stone-800 sm:text-3xl sm:leading-tight"
          >
            {{ t("loginWelcomeTitle") }}
          </h1>
          <div
            class="mx-auto mt-7 h-0.5 w-20 bg-gradient-to-r from-transparent via-teal-600/55 to-transparent"
            aria-hidden="true"
          ></div>
          <p
            class="mt-7 text-center text-sm leading-relaxed text-stone-700 sm:text-[0.95rem]"
          >
            {{ t("loginPleaseSignIn") }}
          </p>
          <button
            data-testid="login-button"
            type="button"
            class="mt-10 w-full rounded-xl bg-teal-800 px-5 py-3.5 text-center text-sm font-medium uppercase tracking-[0.12em] text-white shadow-[0_4px_14px_-2px_rgba(15,118,110,0.45)] transition-[box-shadow,background-color,transform] duration-200 hover:bg-teal-900 hover:shadow-[0_8px_22px_-4px_rgba(15,118,110,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(255_255_255/0.6)] active:translate-y-px sm:py-4"
            @click="loginWithAuth0"
          >
            {{ t("loginButton") }}
          </button>
          <p
            v-if="props.errorMessage"
            class="mt-4 text-center text-xs text-red-600"
          >
            {{ props.errorMessage }}
          </p>
        </GlassCard>
      </main>
    </div>
  </div>
</template>
