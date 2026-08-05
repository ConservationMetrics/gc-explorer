<script setup lang="ts">
import {
  filterByMediaTypes,
  getFilePathsWithExtension,
  getMediaTypeFilterOptions,
} from "@/utils";
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
import MediaTypeFilter from "@/components/shared/MediaTypeFilter.vue";
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
import type { MediaTypeFilterValue } from "@/utils";

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
  viewName?: string;
  viewDescription?: string;
}>();

const displayName = computed(
  () => props.viewName?.trim() || props.table?.trim() || "",
);
const fullDescription = computed(() => props.viewDescription?.trim() || "");

const { fetchRecords, getCachedRecord, cacheSize } = useRecordCache();

const { dateMin, dateMax, setDateRange } = useTimestampFilter();

const selectedFilterValues = ref<FilterValues>([]);
const selectedMediaTypes = ref<MediaTypeFilterValue[]>([]);
const filteredData = ref(props.galleryData);
const loading = ref(false);
const selectedEntry = ref<DataEntry | null>(null);
const selectedFilePaths = ref<string[]>([]);
const selectedCentroid = ref<string | undefined>();
const showFilters = ref(false);
const filterResetKey = ref(0);

const mediaTypeFilterOptions = computed(() =>
  getMediaTypeFilterOptions(
    props.galleryData,
    props.allowedFileExtensions,
    props.mediaColumn,
  ),
);

const hasFilters = computed(
  () =>
    Boolean(props.filterColumn) ||
    Boolean(props.timestampColumn) ||
    mediaTypeFilterOptions.value.length > 0,
);

/** Apply date range then category then media type filters (AND across axes). */
const applyAllFilters = () => {
  const col = props.timestampColumn;
  let result = filterByDateAndCategory(props.galleryData, {
    timestampColumn: col,
    dateMin: dateMin.value,
    dateMax: dateMax.value,
    filterColumn: props.filterColumn,
    selectedValues: normalizeFilterValues(selectedFilterValues.value),
    getTimestamp: (item) => (col ? item[col] : null),
    getCategory: (item) =>
      props.filterColumn != null ? item[props.filterColumn] : undefined,
  });
  result = filterByMediaTypes(
    result,
    selectedMediaTypes.value,
    props.allowedFileExtensions,
    props.mediaColumn,
  );
  filteredData.value = result;
};

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

const onMediaTypeFilter = (types: MediaTypeFilterValue[]) => {
  selectedMediaTypes.value = types;
  applyAllFilters();
};

const clearAllFilters = () => {
  selectedFilterValues.value = [];
  selectedMediaTypes.value = [];
  setDateRange({ start: null, end: null });
  filterResetKey.value++;
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
      <header
        v-if="displayName || fullDescription"
        class="mb-4 space-y-1"
        data-testid="gallery-view-header"
      >
        <h1
          v-if="displayName"
          class="text-2xl font-semibold tracking-tight text-gray-900 break-words"
          style="overflow-wrap: anywhere; word-break: break-word"
          data-testid="gallery-view-title"
        >
          {{ displayName }}
        </h1>
        <p
          v-if="fullDescription"
          class="text-sm text-gray-600"
          data-testid="gallery-view-description"
        >
          {{ fullDescription }}
        </p>
      </header>
      <div v-if="hasFilters" class="mb-4" data-testid="filter-toolbar">
        <div class="flex justify-end">
          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            data-testid="filter-toggle"
            aria-controls="gallery-filter-panel"
            :aria-expanded="showFilters"
            @click="showFilters = !showFilters"
          >
            {{ $t("filters") }}
          </button>
        </div>
        <div
          v-show="showFilters"
          id="gallery-filter-panel"
          class="gallery-filter-panel mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3 shadow-sm"
          data-testid="filter-container"
        >
          <div class="mb-3 flex justify-end">
            <button
              type="button"
              class="inline-flex min-h-10 items-center justify-center rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              data-testid="clear-all-filters"
              @click="clearAllFilters"
            >
              {{ $t("clearAll") }}
            </button>
          </div>
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start">
            <DataFilter
              v-if="filterColumn"
              :key="`filter-${filterResetKey}`"
              :data="galleryData"
              :filter-column="filterColumn"
              @filter="filterValues"
            />
            <TimestampFilter
              v-if="timestampColumn"
              :key="`timestamp-${filterResetKey}`"
              :data="galleryData"
              :timestamp-column="timestampColumn"
              @filter="onTimestampFilter"
            />
            <MediaTypeFilter
              v-if="mediaTypeFilterOptions.length"
              :key="`media-${filterResetKey}`"
              :allowed-file-extensions="allowedFileExtensions"
              :data="galleryData"
              :media-column="mediaColumn"
              @filter="onMediaTypeFilter"
            />
          </div>
        </div>
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

<style scoped>
.gallery-filter-panel :deep(.filter-modal),
.gallery-filter-panel :deep([data-testid="timestamp-filter"]) {
  min-width: 0;
  max-width: none;
  width: 100%;
  margin-bottom: 0;
  border: 1px solid #ddd6fe;
  background: white;
  box-shadow: none;
}

.gallery-filter-panel :deep([data-testid="reset-date-button"]) {
  background-color: #7c3aed;
}

.gallery-filter-panel :deep([data-testid="reset-date-button"]:hover) {
  background-color: #6d28d9;
}

.gallery-filter-panel :deep(.vue-slider-process) {
  background-color: #7c3aed !important;
}

@media (min-width: 1024px) {
  .gallery-filter-panel :deep(.filter-modal),
  .gallery-filter-panel :deep([data-testid="timestamp-filter"]),
  .gallery-filter-panel :deep([data-testid="media-type-filter"]) {
    flex: 1 1 0;
  }
}
</style>
