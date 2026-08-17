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
    class="mb-4 last:mb-0 overflow-hidden rounded-3xl bg-slate-50 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_2px_-1px_rgba(0,0,0,0.06),0px_2px_4px_0px_rgba(0,0,0,0.04)]"
  >
    <button
      type="button"
      :data-testid="`config-section-${title.toLowerCase()}-toggle`"
      class="flex min-h-10 w-full items-center justify-between bg-slate-100 py-4 pl-4 pr-3.5 text-left transition-[background-color] duration-150 ease-out hover:bg-slate-200/80"
      @click="toggle"
    >
      <h3 class="text-balance text-lg font-semibold text-slate-800">
        {{ title }}
      </h3>
      <ChevronDown
        class="h-5 w-5 shrink-0 text-violet-600 transition-transform duration-200 ease-out"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>
    <div
      class="grid transition-[grid-template-rows] duration-200 ease-out"
      :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="min-h-0 overflow-hidden">
        <div class="p-4">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>
