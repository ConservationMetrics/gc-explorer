<script setup lang="ts">
import { XCircle } from "lucide-vue-next";
import type { AllowedFileExtensions } from "@/types/types";
import { useIntersectionObserver } from "@/composables/useIntersectionObserver";
import { useOptimizedImages } from "@/composables/useOptimizedImages";

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

// Generate the full image URL
const rawImageUrl = computed(() => {
  return props.mediaBasePath + "/" + props.filePath;
});

// Get optimized image URL using Nuxt Image
const { getGalleryImageUrl } = useOptimizedImages();
const optimizedImageUrl = computed(() => {
  return getGalleryImageUrl(rawImageUrl.value);
});

// Image loading state
const imageContainer = ref<HTMLElement | null>(null);
const shouldLoadImage = ref(false);
const imageError = ref(false);
const imageLoaded = ref(false);

// Use Intersection Observer for true lazy loading
const { target } = useIntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !shouldLoadImage.value) {
        shouldLoadImage.value = true;
      }
    });
  },
  {
    rootMargin: "100px", // Start loading 100px before entering viewport
    threshold: 0.01,
  },
);

// Watch for when the container element is available
watchEffect(() => {
  if (imageContainer.value && isImage.value) {
    target.value = imageContainer.value;
  }
});

// Handle image load error (404 or other errors)
const handleImageError = () => {
  imageError.value = true;
  imageLoaded.value = false;
};

// Handle successful image load
const handleImageLoad = () => {
  imageError.value = false;
  imageLoaded.value = true;
};
</script>

<template>
  <div>
    <div v-if="isImage" ref="imageContainer" class="mb-4">
      <!-- Error state: Show red X icon when image fails to load (404) -->
      <div
        v-if="shouldLoadImage && imageError"
        class="w-full aspect-video rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-red-500"
      >
        <div
          class="flex flex-col items-center justify-center gap-2 text-red-500"
        >
          <XCircle class="w-12 h-12" />
          <span class="text-sm font-medium">{{
            $t("imageNotFound") || "Image not found"
          }}</span>
        </div>
      </div>

      <!-- Loading state: Show placeholder while waiting to load or while loading -->
      <div
        v-else-if="
          !shouldLoadImage || (shouldLoadImage && !imageLoaded && !imageError)
        "
        class="w-full aspect-video rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
      >
        <div class="text-gray-400 text-sm">
          {{ $t("loading") || "Loading..." }}
        </div>
      </div>

      <!-- Image container: Load and show image when in viewport -->
      <a
        v-if="shouldLoadImage && !imageError"
        :href="rawImageUrl"
        target="_blank"
        :data-lightbox="filePath"
        :data-title="filePath"
        class="block"
        :class="{ hidden: !imageLoaded }"
      >
        <img
          :src="optimizedImageUrl"
          alt="Image"
          class="w-full h-auto rounded-lg"
          @load="handleImageLoad"
          @error="handleImageError"
        />
      </a>

      <div
        v-if="filePath"
        class="text-center flex items-center justify-center mt-2"
      >
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
