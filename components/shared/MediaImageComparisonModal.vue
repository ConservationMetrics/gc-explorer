<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { X } from "lucide-vue-next";

const props = defineProps<{
  open: boolean;
  imageUrls: string[];
  fileNames: string[];
  labels: string[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const closeButtonRef = ref<HTMLButtonElement | null>(null);

/** Closes the comparison modal. */
const close = () => emit("close");

/**
 * Closes the modal when Escape is pressed.
 *
 * @param {KeyboardEvent} event - The keyboard event to inspect.
 * @returns {void}
 */
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
  }
};

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      document.addEventListener("keydown", onKeydown);
      document.body.style.overflow = "hidden";
      nextTick(() => closeButtonRef.value?.focus());
    } else {
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = "";
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (typeof document === "undefined") return;
  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      data-testid="media-image-comparison-modal"
      class="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('before') + ' / ' + $t('after')"
      @click.self="close"
    >
      <div
        class="relative max-h-full max-w-6xl rounded-2xl bg-white p-3 shadow-2xl sm:p-5"
        @click.stop
      >
        <div class="grid max-h-[85vh] gap-4 overflow-y-auto sm:grid-cols-2">
          <figure
            v-for="(imageUrl, index) in imageUrls"
            :key="imageUrl"
            class="min-w-0"
          >
            <figcaption class="mb-2 text-sm font-semibold text-gray-900">
              {{ $t(labels[index] || labels[0] || "") }}
            </figcaption>
            <img
              :src="imageUrl"
              :alt="$t(labels[index] || labels[0] || '')"
              class="max-h-[75vh] w-full rounded-lg object-contain"
            />
            <p class="mt-2 truncate text-xs text-gray-500">
              {{ fileNames[index] }}
            </p>
          </figure>
        </div>
        <button
          ref="closeButtonRef"
          type="button"
          data-testid="media-image-comparison-modal-close"
          class="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg ring-1 ring-black/10 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          :aria-label="$t('close')"
          @click="close"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
