<script setup lang="ts">
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
    class="bg-purple-50 rounded-lg border border-purple-200 mb-4 overflow-hidden"
  >
    <button
      type="button"
      class="w-full flex items-center justify-between p-4 bg-purple-100 hover:bg-purple-200 transition-colors text-left"
      @click="toggle"
    >
      <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
      <svg
        class="w-5 h-5 text-purple-700 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
    <div v-show="isOpen" class="p-4">
      <slot ></slot>
    </div>
  </div>
</template>
