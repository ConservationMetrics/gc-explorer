<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useAuth } from "~/composables/useAuth";

const { loggedIn } = useUserSession();
const errorMessage = ref("");

onMounted(() => {
  const authError = useAuth(loggedIn);
  errorMessage.value = authError || "";
});

const { t } = useI18n();
useHead({
  title: "GuardianConnector Explorer: " + t("login"),
});
</script>

<template>
  <Auth0Login :error-message="errorMessage" />
</template>
