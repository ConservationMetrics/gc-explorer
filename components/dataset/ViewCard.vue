<script setup lang="ts">
import {
  faChevronRight,
  faImages,
  faMap,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  view: string;
  tableName: string;
}

const props = defineProps<Props>();
const { t } = useI18n();

const viewDisplayName = computed(() => {
  return t(props.view) || props.view;
});

const viewDescription = computed(() => {
  switch (props.view) {
    case "map":
      return t("viewDescriptionMap");
    case "gallery":
      return t("viewDescriptionGallery");
    case "alerts":
      return t("viewDescriptionAlerts");
    default:
      return "";
  }
});

const showMapIcon = computed(() => props.view === "map");
const showGalleryIcon = computed(() => props.view === "gallery");
const showAlertsIcon = computed(() => props.view === "alerts");

const viewRoute = computed(() => {
  return `/${props.view}/${props.tableName}`;
});
</script>

<template>
  <NuxtLink
    :to="viewRoute"
    :data-testid="`view-card-${view}`"
    class="bg-purple-50 rounded-lg p-4 sm:p-6 shadow-sm border border-purple-100 hover:bg-purple-100 hover:shadow-md transition-all duration-200 flex flex-col"
  >
    <div class="mb-4 text-purple-700">
      <FontAwesomeIcon
        v-if="showMapIcon"
        :icon="faMap"
        class="w-6 h-6 sm:w-8 sm:h-8"
      />
      <FontAwesomeIcon
        v-else-if="showGalleryIcon"
        :icon="faImages"
        class="w-6 h-6 sm:w-8 sm:h-8"
      />
      <FontAwesomeIcon
        v-else-if="showAlertsIcon"
        :icon="faTriangleExclamation"
        class="w-6 h-6 sm:w-8 sm:h-8"
      />
    </div>

    <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
      {{ viewDisplayName }}
    </h3>

    <p v-if="viewDescription" class="text-sm sm:text-base text-gray-600 flex-1">
      {{ viewDescription }}
    </p>

    <div class="mt-4 flex justify-end">
      <FontAwesomeIcon :icon="faChevronRight" class="w-5 h-5 text-purple-700" />
    </div>
  </NuxtLink>
</template>
