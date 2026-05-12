<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useAuth } from "@/composables/useAuth";

const { loggedIn } = useUserSession();
const { t } = useI18n();
const errorMessage = ref("");

onMounted(() => {
  const authError = useAuth(loggedIn);
  errorMessage.value = authError || "";
});

useHead({
  title: "GuardianConnector Explorer: " + t("login"),
});
</script>

<template>
  <LoginScreen :error-message="errorMessage" />
</template>
