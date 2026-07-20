import { describe, it, expect, beforeEach } from "vitest";
import { ref, computed } from "vue";
import type { ViewConfig, ViewConfigRow, ViewType } from "@/types";
import { copySourceKey, useCopyConfig } from "@/composables/useCopyConfig";

Object.assign(globalThis, { ref, computed });

const makeRow = ({
  viewId,
  primaryDataset,
  viewType,
  viewName,
  viewConfig,
}: {
  viewId: number;
  primaryDataset: string;
  viewType: ViewType;
  viewName: string;
  viewConfig: ViewConfig;
}): ViewConfigRow => ({
  viewId,
  primaryDataset,
  viewType,
  viewName,
  secondaryDataset: null,
  viewConfig,
});

describe("useCopyConfig", () => {
  const mapConfigA: ViewConfig = { MAPBOX_ZOOM: 10, DATASET_TABLE: "Map A" };
  const galleryConfigA: ViewConfig = {
    EMBED_MEDIA: "YES",
    DATASET_TABLE: "Gallery A",
  };
  const mapConfigB: ViewConfig = { MAPBOX_ZOOM: 5, DATASET_TABLE: "Map B" };
  const galleryConfigB: ViewConfig = {
    EMBED_MEDIA: "NO",
    DATASET_TABLE: "Gallery B",
  };

  let viewRows: ReturnType<typeof ref<ViewConfigRow[]>>;

  beforeEach(() => {
    viewRows = ref([
      makeRow({
        viewId: 1,
        primaryDataset: "dataset_a",
        viewType: "map",
        viewName: "Dataset A Map",
        viewConfig: mapConfigA,
      }),
      makeRow({
        viewId: 2,
        primaryDataset: "dataset_a",
        viewType: "gallery",
        viewName: "Dataset A Gallery",
        viewConfig: galleryConfigA,
      }),
      makeRow({
        viewId: 3,
        primaryDataset: "dataset_b",
        viewType: "map",
        viewName: "Dataset B Map",
        viewConfig: mapConfigB,
      }),
      makeRow({
        viewId: 4,
        primaryDataset: "dataset_b",
        viewType: "gallery",
        viewName: "Dataset B Gallery",
        viewConfig: galleryConfigB,
      }),
    ]);
  });

  it("offers only same-type sources when a dataset has multiple views", () => {
    const currentViewType = ref<ViewType | undefined>("map");
    const { otherCopySources } = useCopyConfig(
      viewRows,
      "dataset_a",
      currentViewType,
    );

    expect(otherCopySources.value.map((source) => source.key)).toEqual([
      copySourceKey("dataset_b", "map"),
    ]);
    expect(otherCopySources.value[0].label).toBe("Dataset B Map");
  });

  it("copies the matching view config, not a sibling type on the same dataset", () => {
    const currentViewType = ref<ViewType | undefined>("gallery");
    const {
      otherCopySources,
      selectedCopySource,
      handleConfirmCopy,
      configToCopy,
    } = useCopyConfig(viewRows, "dataset_a", currentViewType);

    expect(otherCopySources.value).toHaveLength(1);
    selectedCopySource.value = otherCopySources.value[0].key;
    handleConfirmCopy();

    expect(configToCopy.value).toEqual(galleryConfigB);
    expect(configToCopy.value).not.toEqual(mapConfigB);
  });

  it("excludes the current view and empty configs", () => {
    viewRows.value.push(
      makeRow({
        viewId: 5,
        primaryDataset: "empty_map",
        viewType: "map",
        viewName: "Empty",
        viewConfig: {},
      }),
    );

    const currentViewType = ref<ViewType | undefined>("map");
    const { otherCopySources } = useCopyConfig(
      viewRows,
      "dataset_a",
      currentViewType,
    );

    expect(otherCopySources.value.map((source) => source.key)).not.toContain(
      copySourceKey("dataset_a", "map"),
    );
    expect(otherCopySources.value.map((source) => source.key)).not.toContain(
      copySourceKey("empty_map", "map"),
    );
  });

  it("returns no sources when the current view type is unset", () => {
    const currentViewType = ref<ViewType | undefined>(undefined);
    const { otherCopySources } = useCopyConfig(
      viewRows,
      "dataset_a",
      currentViewType,
    );

    expect(otherCopySources.value).toEqual([]);
  });
});
