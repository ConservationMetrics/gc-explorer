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
  table: string;
}>();

const {
  public: { appApiKey },
} = useRuntimeConfig();

const filteredData = ref(props.galleryData);
const loadedRecords = ref<Map<string, DataEntry>>(new Map());
const loading = ref(false);

// Pagination per page
const currentPage = ref(1);
const itemsPerPage = 100;
const paginatedData = computed<Dataset>(() => {
  const start = 0;
  const end = currentPage.value * itemsPerPage;
  return filteredData.value.slice(start, end) as Dataset;
});

/** Batch-fetches full records for the given IDs, skipping already-loaded ones. */
const fetchFullRecords = async (ids: string[]) => {
  const idsToFetch = ids.filter((id) => !loadedRecords.value.has(id));
  if (idsToFetch.length === 0) return;

  loading.value = true;
  try {
    const records = await $fetch<DataEntry[]>(`/api/${props.table}/records`, {
      method: "POST",
      body: { ids: idsToFetch },
      headers: { "x-api-key": appApiKey as string },
    });

    for (const record of records) {
      if (record._id) {
        // add to frontend data cache
        loadedRecords.value.set(String(record._id), record);
      }
    }
  } catch (error) {
    console.error("Error batch-fetching gallery records:", error);
  } finally {
    loading.value = false;
  }
};

/** Fetch full records whenever the visible page changes */
watch(
  paginatedData,
  async (items) => {
    const ids = items
      .map((item) => item._id)
      .filter((id): id is string => id != null && String(id).trim() !== "")
      .map(String);
    if (ids.length > 0) {
      await fetchFullRecords(ids);
    }
  },
  { immediate: true },
);

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

/**
 * Returns the full loaded record for a gallery item, falling back to the
 * minimal record if the full record hasn't loaded yet.
 */
const getFullRecord = (minimalItem: DataEntry): DataEntry => {
  const id = String(minimalItem._id);
  return loadedRecords.value.get(id) ?? minimalItem;
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
      :key="feature._id ?? index"
      :allowed-file-extensions="allowedFileExtensions"
      :feature="prepareForDisplay(getFullRecord(feature))"
      :file-paths="
        getFilePathsWithExtension(
          getFullRecord(feature),
          allowedFileExtensions,
          mediaColumn,
        )
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
