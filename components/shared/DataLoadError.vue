<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    message?: string;
    retry?: () => void | Promise<void>;
    showRetry?: boolean;
  }>(),
  { showRetry: true },
);

const route = useRoute();
const router = useRouter();

const isHomeRoute = computed(() => route.path === "/" || route.path === "");

const isRetrying = ref(false);

const handleRetry = async () => {
  if (!props.retry) return;
  isRetrying.value = true;
  try {
    await Promise.resolve(props.retry());
  } finally {
    isRetrying.value = false;
  }
};

const handleGoBack = () => {
  router.back();
};
</script>

<template>
  <div
    class="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 py-12"
  >
    <div
      class="flex max-w-md flex-col items-center gap-4 rounded-xl border border-purple-200 bg-purple-50/50 p-8 text-center"
    >
      <h2 class="text-xl font-semibold text-gray-900">
        {{ title }}
      </h2>
      <p v-if="message" class="text-sm text-gray-600">
        {{ message }}
      </p>
      <div class="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          v-if="showRetry && retry"
          type="button"
          class="inline-flex items-center justify-center rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-800 disabled:opacity-60"
          :disabled="isRetrying"
          @click="handleRetry"
        >
          {{ isRetrying ? $t("loading") : $t("retry") }}
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          @click="handleGoBack"
        >
          {{ $t("goBack") }}
        </button>
        <NuxtLink
          v-if="!isHomeRoute"
          to="/"
          class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {{ $t("returnToHome") }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
