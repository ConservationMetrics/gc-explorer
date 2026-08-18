<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    fit?: "contain" | "cover";
  }>(),
  {
    fit: "contain",
  },
);

const imageLoaded = ref(false);
const imageFailed = ref(false);
const trimmedSrc = computed(() => props.src.trim());

watch(trimmedSrc, () => {
  imageLoaded.value = false;
  imageFailed.value = false;
});

const handleLoad = () => {
  imageLoaded.value = true;
  imageFailed.value = false;
};

const handleError = () => {
  imageLoaded.value = false;
  imageFailed.value = true;
};
</script>

<template>
  <div
    v-if="trimmedSrc"
    class="relative"
    :class="{
      'rounded-2xl border border-slate-200 bg-white p-2': imageLoaded,
    }"
    :data-testid="imageLoaded ? 'config-image-preview' : undefined"
  >
    <p
      v-if="imageLoaded"
      class="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-500"
    >
      {{ $t("imagePreview") }}
    </p>
    <img
      :key="trimmedSrc"
      :src="trimmedSrc"
      :alt="imageLoaded ? alt : ''"
      class="rounded-lg outline outline-1 -outline-offset-1 outline-black/10"
      :class="
        imageLoaded
          ? fit === 'cover'
            ? 'h-28 w-full object-cover'
            : 'max-h-28 w-auto max-w-full object-contain'
          : 'pointer-events-none absolute h-px w-px opacity-0'
      "
      :aria-hidden="!imageLoaded"
      @load="handleLoad"
      @error="handleError"
    />
    <p
      v-if="imageFailed"
      class="text-pretty text-sm text-red-600"
      role="alert"
      data-testid="config-image-preview-error"
    >
      {{ $t("imagePreviewLoadError") }}
    </p>
  </div>
</template>
