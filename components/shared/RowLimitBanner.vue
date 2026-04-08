<script setup lang="ts">
import { TriangleAlert, X } from "lucide-vue-next";

defineProps<{ limit: number }>();

const dismissed = ref(false);
const isExiting = ref(false);

const close = () => {
  isExiting.value = true;
  setTimeout(() => {
    dismissed.value = true;
  }, 300);
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="!dismissed"
      style="position: fixed; top: 16px; right: 16px; z-index: 100000"
      class="pointer-events-auto w-full max-w-md overflow-hidden rounded-lg border-l-4 border-yellow-400 bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-out"
      :class="
        isExiting
          ? 'opacity-0 scale-95 translate-y-2'
          : 'opacity-100 scale-100 translate-y-0'
      "
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <TriangleAlert class="h-6 w-6 text-yellow-400" aria-hidden="true" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">
              {{ $t("rowLimitReachedTitle") }}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              {{
                $t("rowLimitReachedMessage", {
                  limit: limit.toLocaleString(),
                })
              }}
            </p>
          </div>
          <div class="ml-4 flex flex-shrink-0">
            <button
              type="button"
              class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform duration-150 hover:scale-110 active:scale-95"
              @click="close"
            >
              <span class="sr-only">Close</span>
              <X class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
