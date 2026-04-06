<script setup lang="ts">
import {
  faCircleQuestion,
  faImages,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

defineProps<{
  variant:
    | "empty"
    | "noFilterResults"
    | "notConfigured"
    | "indexSearchNoResults"
    | "indexNoDatasets";
}>();

const baseIconClass = "!h-15 !w-15 scale-150";
const iconColorClass = "text-purple-500";
</script>

<template>
  <div
    class="mx-auto mb-10 w-full max-w-xl h-auto flex items-center justify-center"
    aria-hidden="true"
  >
    <FontAwesomeIcon
      v-if="variant === 'empty'"
      :icon="faImages"
      :class="[baseIconClass, iconColorClass]"
    />

    <FontAwesomeIcon
      v-else-if="variant === 'noFilterResults'"
      :icon="faXmark"
      :class="[baseIconClass, iconColorClass]"
    />

    <FontAwesomeIcon
      v-else-if="variant === 'notConfigured'"
      :icon="faCircleQuestion"
      :class="[baseIconClass, iconColorClass]"
    />

    <FontAwesomeIcon
      v-else-if="variant === 'indexSearchNoResults'"
      :icon="faXmark"
      :class="[baseIconClass, iconColorClass]"
    />

    <FontAwesomeIcon
      v-else-if="variant === 'indexNoDatasets'"
      :icon="faXmark"
      :class="[baseIconClass, iconColorClass]"
    />
  </div>
</template>
