<script setup lang="ts">
interface Props {
  view: string;
  tableName: string;
}

const props = defineProps<Props>();
const { t } = useI18n();

// Get view display name
const viewDisplayName = computed(() => {
  return t(props.view) || props.view;
});

// Get view description based on type
const viewDescription = computed(() => {
  switch (props.view) {
    case "map":
      return "Borders, production sites, demographic changes.";
    case "gallery":
      return "Showcase of animal species, habitats and related.";
    case "alerts":
      return "Wildfire, deforestation, extraction, violence rates.";
    default:
      return "";
  }
});

// Determine which icon to show
const showMapIcon = computed(() => props.view === "map");
const showGalleryIcon = computed(() => props.view === "gallery");
const showAlertsIcon = computed(() => props.view === "alerts");

// Route to view page
const viewRoute = computed(() => {
  return `/${props.view}/${props.tableName}`;
});
</script>

<template>
  <NuxtLink
    :to="viewRoute"
    class="bg-purple-50 rounded-lg p-4 sm:p-6 shadow-sm border border-purple-100 hover:bg-purple-100 hover:shadow-md transition-all duration-200 flex flex-col"
  >
    <!-- Icon -->
    <div class="mb-4 text-purple-700">
      <!-- Map Icon -->
      <svg
        v-if="showMapIcon"
        class="w-6 h-6 sm:w-8 sm:h-8"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
          clip-rule="evenodd"
        />
      </svg>
      <!-- Gallery Icon -->
      <svg
        v-else-if="showGalleryIcon"
        class="w-6 h-6 sm:w-8 sm:h-8"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clip-rule="evenodd"
        />
      </svg>
      <!-- Alerts Icon -->
      <svg
        v-else-if="showAlertsIcon"
        class="w-6 h-6 sm:w-8 sm:h-8"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <!-- Title -->
    <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
      {{ viewDisplayName }}
    </h3>

    <!-- Description -->
    <p v-if="viewDescription" class="text-sm sm:text-base text-gray-600 flex-1">
      {{ viewDescription }}
    </p>

    <!-- Arrow Icon -->
    <div class="mt-4 flex justify-end">
      <svg
        class="w-5 h-5 text-purple-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  </NuxtLink>
</template>
