<script setup lang="ts">
import { getFilePathsWithExtension } from "@/utils";
import {
  calculateCentroidFromParsedCoords,
  tryParseDataEntryGeoCoordinates,
} from "@/utils/geoUtils";
import {
  filterByDateAndCategory,
  normalizeFilterValues,
  useTimestampFilter,
} from "@/composables/useDateAndCategoryFilter";
import { prepareCoordinatesForSelectedFeature } from "@/utils/mapGLHelpers";
import { useRecordCache } from "@/composables/useRecordCache";
import { transformSurveyEntry } from "@/utils/dataTransformers";

import DataFilter from "@/components/shared/DataFilter.vue";
import TimestampFilter from "@/components/shared/TimestampFilter.vue";
import GalleryDetailPanel from "@/components/gallery/GalleryDetailPanel.vue";
import GalleryGrid from "@/components/gallery/GalleryGrid.vue";
import GalleryTile from "@/components/gallery/GalleryTile.vue";
import EmptyStateIllustration from "@/components/shared/EmptyStateIllustration.vue";
import { useI18n } from "vue-i18n";

import type {
  AllowedFileExtensions,
  Dataset,
  DataEntry,
  FilterValues,
} from "@/types";

const { t } = useI18n();

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  filterColumn?: string;
  galleryData: Dataset;
  mapboxAccessToken?: string;
  mapboxStyle?: string;
  mediaBasePath: string;
  mediaColumn?: string;
  table: string;
  timestampColumn?: string;
}>();

const { fetchRecords, getCachedRecord, cacheSize } = useRecordCache();

const { dateMin, dateMax, setDateRange } = useTimestampFilter();

/** Apply date range then category filter (AND). */
const applyAllFilters = () => {
  const col = props.timestampColumn;
  filteredData.value = filterByDateAndCategory(props.galleryData, {
    timestampColumn: col,
    dateMin: dateMin.value,
    dateMax: dateMax.value,
    filterColumn: props.filterColumn,
    selectedValues: normalizeFilterValues(selectedFilterValues.value),
    getTimestamp: (item) => (col ? item[col] : null),
    getCategory: (item) =>
      props.filterColumn != null ? item[props.filterColumn] : undefined,
  });
};

const selectedFilterValues = ref<FilterValues>([]);
const filteredData = ref(props.galleryData);
const loading = ref(false);
const selectedEntry = ref<DataEntry | null>(null);
const selectedFilePaths = ref<string[]>([]);
const selectedCentroid = ref<string | undefined>();
const isFilteredToEmpty = computed(
  () => props.galleryData.length > 0 && filteredData.value.length === 0,
);

const emptyStateMessage = computed(() =>
  isFilteredToEmpty.value ? t("galleryNoFilterResults") : t("galleryEmpty"),
);

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

const onTimestampFilter = (payload: {
  start: Date | null;
  end: Date | null;
}) => {
  setDateRange(payload);
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

const getRecordFilePaths = (feature: DataEntry): string[] => {
  return getFilePathsWithExtension(
    feature,
    props.allowedFileExtensions,
    props.mediaColumn,
  );
};

const getRecordCentroid = (feature: DataEntry): string | undefined => {
  const parsedCoords = tryParseDataEntryGeoCoordinates(feature);
  if (!parsedCoords) return undefined;

  const centroid = calculateCentroidFromParsedCoords(parsedCoords);
  return centroid || undefined;
};

const openDetail = (feature: DataEntry, event?: Event) => {
  const fullRecord = getFullRecord(feature);
  selectedEntry.value = prepareForDisplay(fullRecord);
  selectedFilePaths.value = getRecordFilePaths(fullRecord);
  selectedCentroid.value = getRecordCentroid(fullRecord);

  if (event?.currentTarget instanceof HTMLElement) {
    event.currentTarget.blur();
  }

  if (typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const closeDetail = () => {
  selectedEntry.value = null;
  selectedFilePaths.value = [];
  selectedCentroid.value = undefined;
};
</script>

<template>
  <div
    id="galleryContainer"
    data-testid="gallery-container"
    class="gallery p-4"
  >
    <GalleryDetailPanel
      v-if="selectedEntry"
      :allowed-file-extensions="allowedFileExtensions"
      :centroid="selectedCentroid"
      :feature="selectedEntry"
      :file-paths="selectedFilePaths"
      :mapbox-access-token="mapboxAccessToken"
      :mapbox-style="mapboxStyle"
      :media-base-path="mediaBasePath"
      @close="closeDetail"
    />
    <template v-else>
      <div
        v-if="filterColumn || timestampColumn"
        class="sticky top-10 right-10 z-10 mb-4 flex flex-col gap-0.5"
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
      <div
        v-if="filteredData.length === 0"
        class="py-12 text-center"
        data-testid="gallery-empty-state"
      >
        <EmptyStateIllustration
          :variant="isFilteredToEmpty ? 'noFilterResults' : 'empty'"
        />
        <p class="text-sm text-gray-500 sm:text-base">
          {{ emptyStateMessage }}
        </p>
      </div>
      <GalleryGrid v-else>
        <GalleryTile
          v-for="(feature, index) in paginatedData"
          :key="feature._id ?? index"
          :allowed-file-extensions="allowedFileExtensions"
          :file-paths="getRecordFilePaths(getFullRecord(feature))"
          :media-base-path="mediaBasePath"
          :test-id="`gallery-item-${index}`"
          @open="openDetail(feature, $event)"
        />
      </GalleryGrid>
    </template>
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
