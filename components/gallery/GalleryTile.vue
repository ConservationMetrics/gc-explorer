<script setup lang="ts">
import MediaFile from "@/components/shared/MediaFile.vue";

import type { AllowedFileExtensions } from "@/types";

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  filePaths: string[];
  mediaBasePath: string;
  testId: string;
}>();

const previewFilePath = computed(() => props.filePaths[0] ?? null);

const handleTileClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest("audio, video, a")) {
    return;
  }
};

const handleTileKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
  }
};
</script>

<template>
  <div
    class="group relative rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
    :data-testid="testId"
    tabindex="0"
    role="button"
    @click="handleTileClick"
    @keydown="handleTileKeydown"
  >
    <div class="relative w-full aspect-square overflow-hidden rounded-2xl">
      <MediaFile
        v-if="previewFilePath"
        class="h-full w-full"
        :allowed-file-extensions="allowedFileExtensions"
        :file-path="previewFilePath"
        :media-base-path="mediaBasePath"
        variant="gallery"
      />
      <div
        v-else
        class="aspect-square rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center p-4"
        data-testid="gallery-tile-no-media"
      >
        <span class="text-sm text-violet-700 text-center">{{
          $t("galleryNoMedia")
        }}</span>
      </div>

      <div
        v-if="previewFilePath"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-70 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
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
