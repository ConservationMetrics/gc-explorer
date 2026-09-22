<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { X } from "lucide-vue-next";

const props = defineProps<{
  open: boolean;
  imageUrl: string;
  fileName: string;
  alt?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const closeButtonRef = ref<HTMLButtonElement | null>(null);

const close = () => emit("close");

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
      data-testid="media-image-modal"
      class="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      :aria-label="fileName"
      @click.self="close"
    >
      <div
        data-testid="media-image-modal-content"
        class="relative max-h-full max-w-full"
        @click.stop
      >
        <img
          data-testid="media-image-modal-image"
          :src="imageUrl"
          :alt="alt || fileName"
          class="max-h-[min(90vh,900px)] max-w-[min(96vw,1200px)] rounded-sm border border-white/80 object-contain shadow-2xl"
        />
        <p
          data-testid="media-image-modal-caption"
          class="absolute bottom-2 left-2 max-w-[min(70vw,24rem)] truncate rounded bg-black/80 px-2 py-1 text-xs text-white sm:text-sm"
        >
          {{ fileName }}
        </p>
        <button
          ref="closeButtonRef"
          type="button"
          data-testid="media-image-modal-close"
          class="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg ring-1 ring-black/10 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:bottom-0 sm:right-0 sm:translate-x-1/3 sm:translate-y-1/3"
          :aria-label="$t('close')"
          @click="close"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
