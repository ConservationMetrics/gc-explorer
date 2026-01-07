<script setup lang="ts">
import { getFilePathsWithExtension } from "@/utils";
import { prepareCoordinatesForSelectedFeature } from "@/utils/mapFunctions";

import DataFilter from "@/components/shared/DataFilter.vue";
import TimestampFilter from "@/components/shared/TimestampFilter.vue";
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
  timestampColumn?: string;
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

// Filter state
const columnFilterValues = ref<FilterValues>([]);
const timestampRange = ref<{ start: Date | null; end: Date | null }>({
  start: null,
  end: null,
});

/** Apply combined filters (column filter + timestamp filter) */
const applyFilters = () => {
  let result = [...props.galleryData];

  // Apply column filter if not "null"
  if (
    columnFilterValues.value.length > 0 &&
    !columnFilterValues.value.includes("null")
  ) {
    result = result.filter((item) =>
      columnFilterValues.value.includes(item[props.filterColumn].toString()),
    );
  }

  // Apply timestamp filter if column is specified
  if (
    props.timestampColumn &&
    (timestampRange.value.start || timestampRange.value.end)
  ) {
    result = result.filter((item) => {
      const itemTimestamp = item[props.timestampColumn!];
      if (!itemTimestamp) return false;

      const itemDate = new Date(itemTimestamp);
      if (isNaN(itemDate.getTime())) return false;

      if (timestampRange.value.start && itemDate < timestampRange.value.start) {
        return false;
      }
      if (timestampRange.value.end && itemDate > timestampRange.value.end) {
        return false;
      }
      return true;
    });
  }

  filteredData.value = result as Dataset;
  // Reset pagination when filters change
  currentPage.value = 1;
};

/** Filter data based on selected values from DataFilter component  */
const filterValues = (values: FilterValues) => {
  columnFilterValues.value = values;
  applyFilters();
};

/** Filter data based on timestamp range from TimestampFilter component */
const filterByTimestamp = (range: { start: Date | null; end: Date | null }) => {
  timestampRange.value = range;
  applyFilters();
};

/** Prepare coordinates for selected feature */
const featureWithPreparedCoordinates = (feature: DataEntry): DataEntry => {
  const result = {
    ...feature,
    geocoordinates: feature.geocoordinates
      ? prepareCoordinatesForSelectedFeature(feature.geocoordinates)
      : feature.geocoordinates,
  };
  return result as unknown as DataEntry;
};
</script>

<template>
  <div
    id="galleryContainer"
    data-testid="gallery-container"
    class="gallery p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
  >
    <TimestampFilter
      v-if="timestampColumn"
      class="timestamp-filter-gallery"
      :data="galleryData"
      :timestamp-column="timestampColumn"
      @filter="filterByTimestamp"
    />
    <DataFilter
      v-if="filterColumn"
      :data="galleryData"
      :filter-column="filterColumn"
      @filter="filterValues"
    />
    <DataFeature
      v-for="(feature, index) in paginatedData"
      :key="index"
      :allowed-file-extensions="allowedFileExtensions"
      :feature="featureWithPreparedCoordinates(feature)"
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

<style scoped>
.timestamp-filter-gallery {
  position: absolute;
  top: 150px;
  right: 50px;
  z-index: 10;
}
</style>
