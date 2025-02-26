<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { loggedIn } = useUserSession();
const errorMessage = ref();

onMounted(() => {
  errorMessage.value = useAuth(loggedIn);
});

const { t } = useI18n();
useHead({
  title: "GuardianConnector Explorer: " + t("login"),
});
</script>

<template>
  <Auth0Login v-if="loggedIn === false" :error-message="errorMessage" />
</template>
