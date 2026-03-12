<script setup lang="ts">
import { getFilePathsWithExtension } from "@/utils";
import { parseDateMs } from "@/utils/dateUtils";
import { prepareCoordinatesForSelectedFeature } from "@/utils/mapGLHelpers";
import { useRecordCache } from "@/composables/useRecordCache";
import { transformSurveyEntry } from "@/utils/dataTransformers";

import DataFilter from "@/components/shared/DataFilter.vue";
import TimestampFilter from "@/components/shared/TimestampFilter.vue";
import DataFeature from "@/components/shared/DataFeature.vue";

import type {
  AllowedFileExtensions,
  Dataset,
  DataEntry,
  FilterValues,
} from "@/types";

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  filterColumn: string;
  galleryData: Dataset;
  mediaBasePath: string;
  mediaColumn?: string;
  table: string;
  timestampColumn?: string;
}>();

const { fetchRecords, getCachedRecord, cacheSize } = useRecordCache();

const dateMin = ref<string>("");
const dateMax = ref<string>("");

/** Normalize filter payload: "null" string or array of { value } to string[] */
const normalizedFilterValues = (values: FilterValues): string[] => {
  return values.map((v: string | { value?: unknown }) =>
    typeof v === "object" && v != null && v.value != null
      ? String(v.value)
      : String(v),
  );
};

/** Apply date range then category filter (AND). */
const applyAllFilters = () => {
  let items = props.galleryData;
  const col = props.timestampColumn;
  if (col && (dateMin.value || dateMax.value)) {
    const minMs = dateMin.value ? parseDateMs(dateMin.value) : null;
    const maxMs = dateMax.value ? parseDateMs(dateMax.value) : null;
    items = items.filter((item) => {
      const ms = parseDateMs(item[col]);
      if (ms == null) return false;
      if (minMs != null && ms < minMs) return false;
      if (maxMs != null && ms > maxMs) return false;
      return true;
    });
  }
  const values = normalizedFilterValues(selectedFilterValues.value);
  if (values.length && !values.includes("null")) {
    items = items.filter((item) =>
      values.includes(String(item[props.filterColumn] ?? "")),
    );
  }
  filteredData.value = items;
};

const selectedFilterValues = ref<FilterValues>([]);
const filteredData = ref(props.galleryData);
const loading = ref(false);

// Pagination per page
const currentPage = ref(1);
const itemsPerPage = 100;
const paginatedData = computed<Dataset>(() => {
  const start = 0;
  const end = currentPage.value * itemsPerPage;
  return filteredData.value.slice(start, end) as Dataset;
});

/** Batch-fetches full records for the visible page into the shared cache. */
const fetchFullRecords = async (ids: string[]) => {
  loading.value = true;
  try {
    await fetchRecords(props.table, ids);
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
    const ids = items.map((item) => item._id);
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

/** Filter data based on selected values from DataFilter component */
const filterValues = (values: FilterValues) => {
  selectedFilterValues.value = values;
  applyAllFilters();
};

/** Handle date range from TimestampFilter slider */
const onTimestampFilter = (payload: {
  start: Date | null;
  end: Date | null;
}) => {
  dateMin.value = payload.start ? payload.start.toISOString().slice(0, 10) : "";
  dateMax.value = payload.end ? payload.end.toISOString() : "";
  applyAllFilters();
};

watch([dateMin, dateMax], () => applyAllFilters());
watch(
  () => props.galleryData.length,
  () => applyAllFilters(),
);

/**
 * Returns the full cached record for a gallery item, falling back to the
 * minimal record if the full record hasn't loaded yet.
 */
const getFullRecord = (minimalItem: DataEntry): DataEntry => {
  // Read cacheSize to trigger Vue reactivity when cache updates
  void cacheSize.value;
  const id = String(minimalItem._id);
  return getCachedRecord(props.table, id) ?? minimalItem;
};

/** Transform raw record for display and prepare coordinates for selected feature */
const prepareForDisplay = (feature: DataEntry): DataEntry => {
  const transformed = transformSurveyEntry(feature);
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
      v-if="filterColumn || timestampColumn"
      class="sticky top-10 right-10 z-10 flex flex-col gap-0.5"
      data-testid="filter-container"
    >
      <DataFilter
        v-if="filterColumn"
        :data="galleryData"
        :filter-column="filterColumn"
        @filter="filterValues"
      />
      <TimestampFilter
        v-if="timestampColumn"
        :data="galleryData"
        :timestamp-column="timestampColumn"
        @filter="onTimestampFilter"
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
