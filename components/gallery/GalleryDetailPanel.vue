<script setup lang="ts">
import { ChevronLeft, X } from "lucide-vue-next";
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
  <div class="w-full" data-testid="gallery-detail-panel">
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-2 text-sm font-medium text-violet-600 transition-colors hover:text-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded"
      data-testid="gallery-detail-back"
      @click="emit('close')"
    >
      <ChevronLeft class="h-5 w-5 shrink-0" aria-hidden="true" />
      {{ $t("gallery") }}
    </button>

    <section
      class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      aria-labelledby="gallery-detail-title"
    >
      <header
        class="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4"
      >
        <h2
          id="gallery-detail-title"
          class="text-lg font-semibold text-gray-900 sm:text-xl"
        >
          {{ $t("galleryImageDetails") }}
        </h2>
        <button
          type="button"
          class="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          data-testid="gallery-detail-close"
          @click="emit('close')"
        >
          <span class="sr-only">{{ $t("incidents.close") }}</span>
          <X class="h-5 w-5" />
        </button>
      </header>

      <div
        class="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:flex-row lg:items-stretch"
      >
        <div
          class="min-h-[240px] flex-1 min-w-0 overflow-hidden rounded-2xl bg-gray-50 sm:min-h-[320px] lg:min-h-[min(70vh,640px)]"
          data-testid="gallery-detail-media"
        >
          <MediaFile
            v-if="previewFilePath"
            class="h-full w-full min-h-[240px] sm:min-h-[320px] lg:min-h-[min(70vh,640px)]"
            :allowed-file-extensions="allowedFileExtensions"
            :file-path="previewFilePath"
            :media-base-path="mediaBasePath"
            variant="gallery"
          />
          <div
            v-else
            class="flex aspect-square min-h-[240px] items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 sm:min-h-[320px]"
          >
            <span class="text-sm text-violet-700">{{
              $t("galleryEmpty")
            }}</span>
          </div>
        </div>

        <div
          class="w-full min-h-0 overflow-y-auto rounded-2xl bg-violet-50 p-4 sm:p-6 lg:w-[380px] lg:flex-shrink-0 lg:max-h-[min(70vh,640px)]"
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
    </section>
  </div>
</template>
