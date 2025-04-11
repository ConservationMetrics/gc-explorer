<script setup lang="ts">
import type { AllowedFileExtensions } from "@/types/types";

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  filePath: string;
  mediaBasePath: string;
}>();

/** Conditional rendering based on file extension */
const isAudio = computed(() =>
  checkExtensions(props.allowedFileExtensions.audio),
);
const isImage = computed(() =>
  checkExtensions(props.allowedFileExtensions.image),
);
const isVideo = computed(() =>
  checkExtensions(props.allowedFileExtensions.video),
);

const getExtension = (filePath: string) => {
  return (filePath.split(".").pop() || "").toLowerCase();
};

const checkExtensions = (extensions: string[]) => {
  if (!extensions) return false;
  const extension = getExtension(props.filePath);
  return extensions.includes(extension);
};
</script>

<template>
  <div>
    <div v-if="isImage" class="mb-4">
      <a
        :href="mediaBasePath + '/' + filePath"
        target="_blank"
        :data-lightbox="filePath"
        :data-title="filePath"
      >
        <img
          :src="mediaBasePath + '/' + filePath"
          alt="Image"
          class="w-full h-auto rounded-lg"
          loading="lazy"
        />
      </a>
      <div v-if="filePath" class="text-center">
        <span v-if="filePath.includes('t0.jpg')" class="italic">{{
          $t("before")
        }}</span>
        <span v-else-if="filePath.includes('t1.jpg')" class="italic">{{
          $t("after")
        }}</span>
      </div>
    </div>
    <div v-if="isAudio" class="mb-4">
      <audio controls class="w-full" preload="none">
        <source
          :src="mediaBasePath + '/' + filePath"
          :type="
            getExtension(filePath) === 'm4a'
              ? 'audio/x-m4a'
              : 'audio/' + getExtension(filePath)
          "
        />
        {{ $t("browserDoesntSupportAudio") }}.
      </audio>
    </div>
    <div v-if="isVideo" class="mb-4">
      <video controls class="w-full h-auto rounded-lg" preload="none">
        <source
          :src="mediaBasePath + '/' + filePath"
          :type="'video/' + getExtension(filePath)"
        />
        {{ $t("browserDoesntSupportVideo") }}.
      </video>
    </div>
  </div>
</template>
