<script setup lang="ts">
defineProps<{
  variant:
    | "empty"
    | "noFilterResults"
    | "notConfigured"
    | "indexSearchNoResults"
    | "indexNoDatasets";
}>();

const sid = useId();
const clip = (name: string) => `esi-${name}-${sid}`;
</script>

<template>
  <div
    class="mx-auto mb-5 flex h-28 max-w-[11rem] items-center justify-center sm:h-32 sm:max-w-[13rem]"
    aria-hidden="true"
  >
    <!-- Gallery: no items yet -->
    <svg
      v-if="variant === 'empty'"
      class="h-full w-full text-gray-300"
      viewBox="0 0 160 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath :id="clip('gc-lc')">
          <rect x="6" y="28" width="42" height="54" rx="4" />
        </clipPath>
        <clipPath :id="clip('gc-cc')">
          <rect x="59" y="16" width="42" height="66" rx="4" />
        </clipPath>
        <clipPath :id="clip('gc-rc')">
          <rect x="112" y="28" width="42" height="54" rx="4" />
        </clipPath>
      </defs>

      <rect
        x="6"
        y="28"
        width="42"
        height="54"
        rx="4"
        stroke="currentColor"
        stroke-width="1.75"
      />
      <path
        d="M8 78 L22 56 L34 66 L48 46"
        stroke="currentColor"
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.45"
        :clip-path="`url(#${clip('gc-lc')})`"
      />

      <rect
        x="59"
        y="16"
        width="42"
        height="66"
        rx="4"
        stroke="currentColor"
        stroke-width="1.75"
      />
      <path
        d="M61 74 L72 57 L82 65 L92 51 L99 60"
        stroke="currentColor"
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.45"
        :clip-path="`url(#${clip('gc-cc')})`"
      />
      <path
        d="M 73 38 L 87 54 M 87 38 L 73 54"
        class="text-purple-600"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="square"
      />

      <rect
        x="112"
        y="28"
        width="42"
        height="54"
        rx="4"
        stroke="currentColor"
        stroke-width="1.75"
      />
      <path
        d="M114 78 L126 60 L138 68 L152 48"
        stroke="currentColor"
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.45"
        :clip-path="`url(#${clip('gc-rc')})`"
      />
    </svg>

    <!-- Gallery: filters exclude everything — funnel + gap + badge (ref: open spout, gray strokes, purple X) -->
    <svg
      v-else-if="variant === 'noFilterResults'"
      class="h-full w-full text-gray-300"
      viewBox="0 0 160 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!--
        Funnel outline (single stroke, open at bottom-right for badge):
        wide top → waist → short right spout | long left spout → diagonal closing toward right
      -->
      <path
        d="
          M 34 22
          L 126 22
          L 94 54
          L 94 64
          M 66 54
          L 66 90
          L 84 96
          M 66 54
          L 34 22
        "
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="104" cy="82" r="14" stroke="currentColor" stroke-width="2" />
      <path
        d="M 97 75 L 111 89 M 111 75 L 97 89"
        class="text-purple-700"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>

    <!-- Gallery: not configured -->
    <svg
      v-else-if="variant === 'notConfigured'"
      class="h-full w-full text-gray-300"
      viewBox="0 0 160 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="20"
        y="18"
        width="120"
        height="78"
        rx="6"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-dasharray="7 5"
      />
      <path
        d="M36 80 L52 56 L66 68 L86 44 L106 62 L122 50"
        stroke="currentColor"
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.3"
      />
      <circle
        cx="118"
        cy="38"
        r="16"
        class="text-purple-400"
        stroke="currentColor"
        stroke-width="1.75"
      />
      <path
        d="M 113 33 C 113 27.5 123 27.5 123 33 C 123 37.5 118.5 38 118.5 42"
        class="text-purple-500"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        fill="none"
      />
      <circle
        cx="118.5"
        cy="46"
        r="1.25"
        class="text-purple-500"
        fill="currentColor"
      />
    </svg>

    <!-- Index: search returned nothing — gray magnifier, purple X in the lens -->
    <svg
      v-else-if="variant === 'indexSearchNoResults'"
      class="h-full w-full text-gray-300"
      viewBox="0 0 160 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="72" cy="56" r="26" stroke="currentColor" stroke-width="2.5" />
      <path
        d="M 92 76 L 118 102"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <path
        d="M 60 44 L 84 68 M 84 44 L 60 68"
        class="text-purple-700"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="square"
      />
    </svg>

    <!-- Index: no dataset views available -->
    <svg
      v-else-if="variant === 'indexNoDatasets'"
      class="h-full w-full text-gray-300"
      viewBox="0 0 160 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="38"
        y="34"
        width="84"
        height="52"
        rx="5"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-dasharray="6 4"
        opacity="0.45"
      />
      <rect
        x="28"
        y="24"
        width="92"
        height="58"
        rx="5"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-dasharray="7 5"
      />
      <path
        d="M44 66 L58 50 L72 60 L88 42 L102 54 L116 44"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.35"
      />
      <rect
        x="108"
        y="18"
        width="28"
        height="20"
        rx="3"
        class="text-purple-400"
        stroke="currentColor"
        stroke-width="1.5"
        opacity="0.55"
      />
      <path
        d="M116 26h12M122 22v8"
        class="text-purple-500"
        stroke="currentColor"
        stroke-width="1.35"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>
