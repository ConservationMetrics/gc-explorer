<script setup lang="ts">
import GalleryMediaCarousel from "@/components/gallery/GalleryMediaCarousel.vue";

import type { AllowedFileExtensions } from "@/types";

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  filePaths: string[];
  mediaBasePath: string;
  suppressOverlay?: boolean;
  testId: string;
}>();

const emit = defineEmits<{
  open: [event: Event];
}>();

const hasMedia = computed(() => props.filePaths.length > 0);

const showOverlay = computed(() => hasMedia.value && !props.suppressOverlay);

const tileEl = ref<HTMLElement | null>(null);
const isHovered = ref(false);
/** True only when the tile root itself is focused (keyboard), not carousel controls. */
const isTileRootFocused = ref(false);

const isOverlayVisible = computed(
  () => showOverlay.value && (isHovered.value || isTileRootFocused.value),
);

const handleTileFocusIn = (event: FocusEvent) => {
  if (event.target === tileEl.value) {
    isTileRootFocused.value = true;
  }
};

const handleTileFocusOut = (event: FocusEvent) => {
  const next = event.relatedTarget as Node | null;
  if (!next || !tileEl.value?.contains(next)) {
    isTileRootFocused.value = false;
  }
};

const handleTileMouseLeave = () => {
  isHovered.value = false;
  const active = document.activeElement;
  if (active instanceof HTMLElement && tileEl.value?.contains(active)) {
    active.blur();
  }
};

const handleTileClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (
    target.closest(
      "audio, video, a, [data-testid='gallery-carousel-prev'], [data-testid='gallery-carousel-next'], [data-testid^='gallery-carousel-dot-']",
    )
  ) {
    return;
  }
  emit("open", event);
};

const handleTileKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    emit("open", event);
  }
};
</script>

<template>
  <div
    ref="tileEl"
    class="relative rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
    :data-testid="testId"
    tabindex="0"
    role="button"
    @click="handleTileClick"
    @keydown="handleTileKeydown"
    @focusin="handleTileFocusIn"
    @focusout="handleTileFocusOut"
    @mouseenter="isHovered = true"
    @mouseleave="handleTileMouseLeave"
  >
    <div class="relative w-full aspect-square overflow-hidden rounded-2xl">
      <GalleryMediaCarousel
        v-if="hasMedia"
        class="h-full w-full"
        :allowed-file-extensions="allowedFileExtensions"
        :file-paths="filePaths"
        :media-base-path="mediaBasePath"
        variant="gallery"
      />
      <div
        v-else
        class="aspect-square rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center p-4"
        data-testid="gallery-tile-no-media"
      >
        <span class="text-sm text-violet-700 text-center">{{
          $t("galleryEmpty")
        }}</span>
      </div>

      <div
        v-if="showOverlay"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300"
        :class="isOverlayVisible ? 'opacity-100' : 'opacity-70 lg:opacity-0'"
        data-testid="gallery-tile-overlay"
      >
        <span
          class="px-3 py-1.5 text-sm font-medium text-white rounded-lg bg-black/30"
        >
          {{ $t("galleryClickToViewDetails") }}
        </span>
      </div>
    </div>
  </div>
</template>
