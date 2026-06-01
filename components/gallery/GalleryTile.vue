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
</script>

<template>
  <div class="overflow-hidden rounded-2xl" :data-testid="testId">
    <MediaFile
      v-if="previewFilePath"
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
        $t("galleryEmpty")
      }}</span>
    </div>
  </div>
</template>
