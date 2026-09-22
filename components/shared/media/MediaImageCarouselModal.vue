<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { ChevronLeft, ChevronRight, X } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

import MediaFile from "@/components/shared/media/MediaFile.vue";

import type { AllowedFileExtensions } from "@/types";

const props = defineProps<{
  open: boolean;
  allowedFileExtensions: AllowedFileExtensions;
  filePaths: string[];
  mediaBasePath: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const closeButtonRef = ref<HTMLButtonElement | null>(null);
const currentIndex = ref(0);

const currentFilePath = computed(
  () => props.filePaths[currentIndex.value] ?? null,
);

const hasMultiple = computed(() => props.filePaths.length > 1);

/**
 * Moves to a neighboring carousel slide.
 *
 * @param {number} direction - The direction to move, either -1 or 1.
 * @returns {void}
 */
const moveToSlide = (direction: number) => {
  if (!hasMultiple.value) return;
  currentIndex.value =
    (currentIndex.value + direction + props.filePaths.length) %
    props.filePaths.length;
};

/**
 * Closes the carousel modal.
 *
 * @returns {void}
 */
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
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveToSlide(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    moveToSlide(1);
  }
};

watch(
  () => props.filePaths,
  () => {
    currentIndex.value = 0;
  },
);

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
      data-testid="media-image-carousel-modal"
      class="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      :aria-label="t('galleryMedia')"
      @click.self="close"
    >
      <div
        class="relative h-[min(85vh,800px)] w-[min(94vw,1100px)] rounded-2xl bg-white p-3 shadow-2xl sm:p-5"
        @click.stop
      >
        <MediaFile
          v-if="currentFilePath"
          :allowed-file-extensions="allowedFileExtensions"
          :file-path="currentFilePath"
          :media-base-path="mediaBasePath"
          variant="gallery"
          :enable-image-modal="false"
        />
        <template v-if="hasMultiple">
          <button
            type="button"
            class="absolute left-5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            data-testid="media-image-carousel-modal-prev"
            :aria-label="t('galleryPreviousMedia')"
            @click="moveToSlide(-1)"
          >
            <ChevronLeft class="h-5 w-5" />
          </button>
          <button
            type="button"
            class="absolute right-5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            data-testid="media-image-carousel-modal-next"
            :aria-label="t('galleryNextMedia')"
            @click="moveToSlide(1)"
          >
            <ChevronRight class="h-5 w-5" />
          </button>
          <div
            class="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5"
            data-testid="media-image-carousel-modal-dots"
          >
            <button
              v-for="(_, index) in filePaths"
              :key="index"
              type="button"
              class="h-2 w-2 rounded-full bg-white/50 ring-1 ring-black/20"
              :class="{ 'bg-violet-600': index === currentIndex }"
              :aria-label="
                t('galleryGoToSlide', {
                  number: index + 1,
                  total: filePaths.length,
                })
              "
              :aria-selected="index === currentIndex"
              role="tab"
              @click="currentIndex = index"
            ></button>
          </div>
        </template>
        <button
          ref="closeButtonRef"
          type="button"
          data-testid="media-image-carousel-modal-close"
          class="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg ring-1 ring-black/10 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          :aria-label="$t('close')"
          @click="close"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
