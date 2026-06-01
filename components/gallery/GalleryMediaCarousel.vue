<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import MediaFile from "@/components/shared/MediaFile.vue";

import type { AllowedFileExtensions } from "@/types";

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  filePaths: string[];
  mediaBasePath: string;
  variant?: "gallery" | "default";
}>();

const { t } = useI18n();

const currentIndex = ref(0);

const hasMultiple = computed(() => props.filePaths.length > 1);

const currentFilePath = computed(
  () => props.filePaths[currentIndex.value] ?? null,
);

const slideLabel = computed(() =>
  t("gallerySlideOf", {
    current: currentIndex.value + 1,
    total: props.filePaths.length,
  }),
);

watch(
  () => props.filePaths,
  () => {
    currentIndex.value = 0;
  },
);

const goToPrevious = () => {
  if (!hasMultiple.value) return;
  currentIndex.value =
    (currentIndex.value - 1 + props.filePaths.length) % props.filePaths.length;
};

const goToNext = () => {
  if (!hasMultiple.value) return;
  currentIndex.value = (currentIndex.value + 1) % props.filePaths.length;
};

const goToIndex = (index: number) => {
  if (index >= 0 && index < props.filePaths.length) {
    currentIndex.value = index;
  }
};
</script>

<template>
  <div class="relative h-full w-full" data-testid="gallery-media-carousel">
    <MediaFile
      v-if="currentFilePath"
      :key="currentFilePath"
      class="h-full w-full"
      :allowed-file-extensions="allowedFileExtensions"
      :file-path="currentFilePath"
      :media-base-path="mediaBasePath"
      :variant="variant ?? 'gallery'"
    />

    <template v-if="hasMultiple">
      <button
        type="button"
        class="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        data-testid="gallery-carousel-prev"
        :aria-label="t('galleryPreviousMedia')"
        @click.stop="goToPrevious"
      >
        <ChevronLeft class="h-5 w-5" />
      </button>
      <button
        type="button"
        class="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        data-testid="gallery-carousel-next"
        :aria-label="t('galleryNextMedia')"
        @click.stop="goToNext"
      >
        <ChevronRight class="h-5 w-5" />
      </button>

      <div
        class="absolute bottom-2 left-0 right-0 z-10 flex flex-col items-center gap-1"
        data-testid="gallery-carousel-dots"
      >
        <span class="sr-only">{{ slideLabel }}</span>
        <div class="flex items-center gap-1.5" role="tablist">
          <button
            v-for="(_, index) in filePaths"
            :key="index"
            type="button"
            class="h-2 w-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            :class="
              index === currentIndex
                ? 'bg-white'
                : 'bg-white/50 hover:bg-white/80'
            "
            role="tab"
            :aria-selected="index === currentIndex"
            :aria-label="
              t('galleryGoToSlide', {
                number: index + 1,
                total: filePaths.length,
              })
            "
            :data-testid="`gallery-carousel-dot-${index}`"
            @click.stop="goToIndex(index)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
