<script setup lang="ts">
import { CheckCircle2 } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    show: boolean;
    dismissible?: boolean;
  }>(),
  {
    dismissible: false,
  },
);

const emit = defineEmits<{
  close: [];
}>();

const handleBackdropClick = () => {
  if (props.dismissible) emit("close");
};
</script>

<template>
  <ClientOnly>
    <div
      v-if="show"
      data-testid="saved-modal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click="handleBackdropClick"
    >
      <div
        data-testid="saved-modal-content"
        class="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 text-center"
        @click.stop
      >
        <div class="mb-4">
          <CheckCircle2 class="w-16 h-16 mx-auto text-green-500" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Saved!</h2>
        <p class="text-gray-600">Configuration has been saved successfully.</p>
      </div>
    </div>
  </ClientOnly>
</template>
