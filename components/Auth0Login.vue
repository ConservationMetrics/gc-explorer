<script lang="ts" setup>
import { useUserSession, onMounted } from "#imports";
import LanguagePicker from "./shared/LanguagePicker.vue";

interface Props {
  errorMessage: string;
}
const props = defineProps<Props>();
const { loggedIn } = useUserSession();
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
  <div class="container relative">
    <div
      class="absolute top-0 right-0 flex justify-end space-x-4 mt-4 mr-4 mb-4"
    >
      <LanguagePicker />
    </div>
    <div class="flex flex-col items-center justify-center h-screen">
      <p class="italic">{{ $t("authMessage") }}.</p>
      <button
        data-testid="login-button"
        class="px-4 py-2 mt-4 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
        @click="loginWithAuth0"
      >
        {{ $t("loginButton") }}
      </button>
      <p v-if="props.errorMessage" class="text-red-500 text-xs italic">
        {{ $t("yourAccessIsPending") }}
      </p>
    </div>
  </div>
</template>
