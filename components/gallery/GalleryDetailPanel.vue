<script setup lang="ts">
import { X } from "lucide-vue-next";
import DataFeature from "@/components/shared/DataFeature.vue";
import MediaFile from "@/components/shared/MediaFile.vue";

import type { AllowedFileExtensions, DataEntry } from "@/types";

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  feature: DataEntry;
  filePaths: string[];
  mediaBasePath: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const previewFilePath = computed(() => props.filePaths[0] ?? null);

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit("close");
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    emit("close");
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50"
    data-testid="gallery-detail-panel"
    @click="handleBackdropClick"
  >
    <div
      class="relative max-w-6xl w-full max-h-[90vh] flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-detail-title"
    >
      <button
        type="button"
        class="absolute top-2 right-2 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
        data-testid="gallery-detail-close"
        @click="emit('close')"
      >
        <span class="sr-only">Close</span>
        <X class="w-5 h-5 text-gray-700" />
      </button>

      <div
        class="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white p-2 sm:p-4"
        data-testid="gallery-detail-media"
      >
        <MediaFile
          v-if="previewFilePath"
          class="h-full w-full max-h-[50vh] lg:max-h-none"
          :allowed-file-extensions="allowedFileExtensions"
          :file-path="previewFilePath"
          :media-base-path="mediaBasePath"
          variant="gallery"
        />
        <div
          v-else
          class="aspect-square rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center"
        >
          <span class="text-sm text-violet-700">{{ $t("galleryEmpty") }}</span>
        </div>
      </div>

      <div
        id="gallery-detail-title"
        class="w-full lg:w-[380px] lg:flex-shrink-0 min-h-0 overflow-y-auto rounded-2xl bg-violet-50 p-4 sm:p-6"
        data-testid="gallery-detail-metadata"
      >
        <DataFeature
          :allowed-file-extensions="allowedFileExtensions"
          :feature="feature"
          :file-paths="filePaths"
          :media-base-path="mediaBasePath"
          :embedded="true"
          :hide-media="true"
        />
      </div>
    </div>
  </div>
</template>
