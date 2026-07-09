<script setup lang="ts">
import { buildGalleryMinimapUrl } from "@/utils/galleryMinimap";

const props = defineProps<{
  centroid?: string;
  mapboxAccessToken?: string;
  mapboxStyle?: string;
}>();

const imageVisible = ref(true);

const imageUrl = computed(() => {
  if (!props.mapboxAccessToken || !props.centroid) return null;

  return buildGalleryMinimapUrl({
    accessToken: props.mapboxAccessToken,
    centroid: props.centroid,
    mapboxStyle: props.mapboxStyle,
  });
});

const showImage = computed(() => imageVisible.value && imageUrl.value !== null);

const handleImageError = () => {
  imageVisible.value = false;
};

watch(
  () => [props.centroid, props.mapboxAccessToken, props.mapboxStyle],
  () => {
    imageVisible.value = true;
  },
);
</script>

<template>
  <div
    v-if="showImage"
    class="overflow-hidden rounded-xl border border-violet-100"
    data-testid="gallery-detail-minimap"
  >
    <img
      :src="imageUrl ?? undefined"
      :alt="$t('galleryLocation')"
      class="block h-auto w-full"
      data-testid="gallery-detail-minimap-image"
      @error="handleImageError"
    />
  </div>
</template>
