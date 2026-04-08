<script setup lang="ts">
import { CircleHelp, Images, X } from "lucide-vue-next";

defineProps<{
  variant:
    | "empty"
    | "noFilterResults"
    | "notConfigured"
    | "indexSearchNoResults"
    | "indexNoDatasets";
}>();

const baseIconClass = "w-24 h-24 sm:w-28 sm:h-28";
const iconColorClass = "text-violet-500";
</script>

<template>
  <div
    class="mx-auto mb-10 w-full max-w-xl h-auto flex items-center justify-center"
    aria-hidden="true"
  >
    <Images
      v-if="variant === 'empty'"
      :class="[baseIconClass, iconColorClass]"
    />

    <X
      v-else-if="variant === 'noFilterResults'"
      :class="[baseIconClass, iconColorClass]"
    />

    <CircleHelp
      v-else-if="variant === 'notConfigured'"
      :class="[baseIconClass, iconColorClass]"
    />

    <X
      v-else-if="variant === 'indexSearchNoResults'"
      :class="[baseIconClass, iconColorClass]"
    />

    <X
      v-else-if="variant === 'indexNoDatasets'"
      :class="[baseIconClass, iconColorClass]"
    />
  </div>
</template>
