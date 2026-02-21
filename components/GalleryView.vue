<script setup lang="ts">
import { getFilePathsWithExtension } from "@/utils";
import { prepareCoordinatesForSelectedFeature } from "@/utils/mapFunctions";
import { transformRecord } from "@/utils/transforms";

import DataFilter from "@/components/shared/DataFilter.vue";
import DataFeature from "@/components/shared/DataFeature.vue";

import type {
  AllowedFileExtensions,
  Dataset,
  DataEntry,
  FilterValues,
} from "@/types/types";

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  filterColumn: string;
  galleryData: Dataset;
  mediaBasePath: string;
  mediaColumn?: string;
}>();
const filteredData = ref(props.galleryData);

// Pagination per page
const currentPage = ref(1);
const itemsPerPage = 100;
const paginatedData = computed<Dataset>(() => {
  const start = 0;
  const end = currentPage.value * itemsPerPage;
  return filteredData.value.slice(start, end) as Dataset;
});

const handleScroll = () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    currentPage.value++;
  }
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});

/** Filter data based on selected values from DataFilter component  */
const filterValues = (values: FilterValues) => {
  if (values.includes("null")) {
    filteredData.value = props.galleryData;
  } else {
    filteredData.value = props.galleryData.filter((item) =>
      values.includes(item[props.filterColumn].toString()),
    );
  }
};

/** Transform raw record for display and prepare coordinates for selected feature */
const prepareForDisplay = (feature: DataEntry): DataEntry => {
  const transformed = transformRecord(feature);
  if (transformed.geocoordinates) {
    transformed.geocoordinates = prepareCoordinatesForSelectedFeature(
      transformed.geocoordinates,
    );
  }
  return transformed;
};
</script>

<template>
  <div
    id="galleryContainer"
    data-testid="gallery-container"
    class="gallery p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
  >
    <div
      v-if="filterColumn"
      class="sticky top-10 right-10 z-10"
      data-testid="filter-container"
    >
      <DataFilter
        :data="galleryData"
        :filter-column="filterColumn"
        @filter="filterValues"
      />
    </div>
    <DataFeature
      v-for="(feature, index) in paginatedData"
      :key="index"
      :allowed-file-extensions="allowedFileExtensions"
      :feature="prepareForDisplay(feature)"
      :file-paths="
        getFilePathsWithExtension(feature, allowedFileExtensions, mediaColumn)
      "
      :media-base-path="mediaBasePath"
      :data-testid="`gallery-item-${index}`"
    />
    <!-- Hidden element to track pagination state for testing -->
    <div
      data-testid="pagination-info"
      :data-current-page="currentPage"
      :data-items-per-page="itemsPerPage"
      :data-total-items="filteredData.length"
      :data-paginated-count="paginatedData.length"
      class="hidden"
    ></div>
  </div>
</template>
