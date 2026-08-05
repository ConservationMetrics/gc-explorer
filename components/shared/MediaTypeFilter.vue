<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { getMediaTypeFilterOptions, type MediaTypeFilterValue } from "@/utils";

import type { AllowedFileExtensions } from "@/types";

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  data: Array<{ [key: string]: unknown }>;
  mediaColumn?: string;
}>();

const emit = defineEmits<{
  (e: "filter", selected: MediaTypeFilterValue[]): void;
}>();

const selectedTypes = ref<MediaTypeFilterValue[]>([]);

const availableOptions = computed(() =>
  getMediaTypeFilterOptions(
    props.data,
    props.allowedFileExtensions,
    props.mediaColumn,
  ),
);

const labelKeyFor = (type: MediaTypeFilterValue) => {
  if (type === "image") return "mediaTypeImage";
  if (type === "audio") return "mediaTypeAudio";
  if (type === "video") return "mediaTypeVideo";
  return "mediaTypeNone";
};

const toggleType = (type: MediaTypeFilterValue) => {
  if (selectedTypes.value.includes(type)) {
    selectedTypes.value = selectedTypes.value.filter((t) => t !== type);
  } else {
    selectedTypes.value = [...selectedTypes.value, type];
  }
  emit("filter", [...selectedTypes.value]);
};

/** Drop selections that are no longer offered (e.g. "none" after data change). */
watch(availableOptions, (options) => {
  const next = selectedTypes.value.filter((t) => options.includes(t));
  if (next.length !== selectedTypes.value.length) {
    selectedTypes.value = next;
    emit("filter", [...next]);
  }
});
</script>

<template>
  <div
    v-if="availableOptions.length"
    class="rounded-xl border border-violet-200 bg-white p-2.5"
    data-testid="media-type-filter"
  >
    <h4
      class="m-0 mb-2 text-lg text-gray-800"
      data-testid="media-type-filter-heading"
    >
      {{ $t("filterByMediaType") }}
    </h4>
    <div class="flex flex-wrap gap-2">
      <label
        v-for="type in availableOptions"
        :key="type"
        class="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-violet-200 px-3 py-2 text-sm text-violet-900 transition-colors hover:bg-violet-50 has-[:checked]:border-violet-500 has-[:checked]:bg-violet-100"
        :data-testid="`media-type-option-${type}`"
      >
        <input
          type="checkbox"
          class="h-4 w-4 accent-violet-600"
          :value="type"
          :checked="selectedTypes.includes(type)"
          :data-testid="`media-type-checkbox-${type}`"
          @change="toggleType(type)"
        />
        {{ $t(labelKeyFor(type)) }}
      </label>
    </div>
  </div>
</template>
