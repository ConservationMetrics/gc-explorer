<script setup lang="ts">
import LanguagePicker from "@/components/shared/LanguagePicker.vue";

interface Props {
  title: string;
  subtitle?: string;
  showLanguagePicker?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  showLanguagePicker: true,
});

const mobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};
</script>

<template>
  <div>
    <!-- Desktop Header -->
    <div class="mb-6 sm:mb-8 hidden sm:block">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-sm sm:text-base text-gray-600">
            {{ subtitle }}
          </p>
        </div>
        <div class="ml-4 flex items-center gap-3">
          <LanguagePicker v-if="showLanguagePicker" />
        </div>
      </div>
    </div>

    <!-- Mobile Header -->
    <div class="mb-4 sm:hidden">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <h1 class="text-xl font-bold text-gray-900">
            {{ title }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <LanguagePicker v-if="showLanguagePicker" />
        </div>
      </div>
    </div>

    <!-- Children content (for any additional content below header) -->
    <slot />
  </div>
</template>
