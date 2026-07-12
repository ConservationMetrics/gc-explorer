<script setup lang="ts">
import { buildMinimapUrl } from "@/utils/gallery/minimap";

const props = defineProps<{
  alt?: string;
  centroid?: string;
  mapboxAccessToken?: string;
  mapboxStyle?: string;
}>();

const imageVisible = ref(true);

const imageUrl = computed(() => {
  if (!props.mapboxAccessToken || !props.centroid) return null;

  return buildMinimapUrl({
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
    data-testid="detail-minimap"
  >
    <img
      :src="imageUrl ?? undefined"
      :alt="alt ?? ''"
      class="block h-auto w-full"
      data-testid="detail-minimap-image"
      @error="handleImageError"
    />
  </div>
</template>
