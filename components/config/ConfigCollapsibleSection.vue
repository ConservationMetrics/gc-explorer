<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";

interface Props {
  title: string;
  defaultOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: true,
});

const isOpen = ref(props.defaultOpen);

const toggle = () => {
  isOpen.value = !isOpen.value;
};
</script>

<template>
  <div
    data-testid="config-section-collapsible"
    class="bg-violet-50 rounded-lg border border-violet-200 mb-4 overflow-hidden"
  >
    <button
      type="button"
      :data-testid="`config-section-${title.toLowerCase()}-toggle`"
      class="w-full flex items-center justify-between p-4 bg-violet-100 hover:bg-violet-200 transition-colors text-left"
      @click="toggle"
    >
      <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
      <ChevronDown
        class="w-5 h-5 text-violet-700 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>
    <div v-show="isOpen" class="p-4">
      <slot></slot>
    </div>
  </div>
</template>
