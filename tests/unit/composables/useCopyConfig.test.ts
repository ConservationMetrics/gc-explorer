import { describe, it, expect, beforeEach } from "vitest";
import { ref, computed } from "vue";
import type { ViewConfig, ViewConfigRow, ViewType } from "@/types";
import {
  copySourceKey,
  useCopyConfig,
  VIEW_INFO_CONFIG_KEYS,
} from "@/composables/useCopyConfig";

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

    expect(configToCopy.value).toEqual({ EMBED_MEDIA: "NO" });
    expect(configToCopy.value).not.toHaveProperty("DATASET_TABLE");
    expect(configToCopy.value).not.toEqual(mapConfigB);
  });

  it("excludes the current view, empty configs, and view-info-only configs", () => {
    viewRows.value.push(
      makeRow({
        viewId: 5,
        primaryDataset: "empty_map",
        viewType: "map",
        viewName: "Empty",
        viewConfig: {},
      }),
      makeRow({
        viewId: 6,
        primaryDataset: "identity_only",
        viewType: "map",
        viewName: "Identity Only",
        viewConfig: {
          DATASET_TABLE: "Named",
          VIEW_DESCRIPTION: "Desc",
          VIEW_HEADER_IMAGE: "https://example.test/header.jpg",
          LOGO_URL: "https://example.test/logo.png",
        },
      }),
    );

    const currentViewType = ref<ViewType | undefined>("map");
    const { otherCopySources } = useCopyConfig(
      viewRows,
      "dataset_a",
      currentViewType,
    );

    const sourceKeys = otherCopySources.value.map((source) => source.key);
    expect(sourceKeys).not.toContain(copySourceKey("dataset_a", "map"));
    expect(sourceKeys).not.toContain(copySourceKey("empty_map", "map"));
    expect(sourceKeys).not.toContain(copySourceKey("identity_only", "map"));
  });

  it("omits all ConfigViewInfo fields from the copied config", () => {
    const currentViewType = ref<ViewType | undefined>("map");
    const {
      otherCopySources,
      selectedCopySource,
      handleConfirmCopy,
      configToCopy,
    } = useCopyConfig(viewRows, "dataset_a", currentViewType);

    selectedCopySource.value = otherCopySources.value[0].key;
    handleConfirmCopy();

    expect(configToCopy.value).toEqual({ MAPBOX_ZOOM: 5 });
    for (const key of VIEW_INFO_CONFIG_KEYS) {
      expect(configToCopy.value).not.toHaveProperty(key);
    }
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

  it("reacts when the current primary dataset ref changes", () => {
    const currentViewType = ref<ViewType | undefined>("map");
    const currentDataset = ref("dataset_a");
    const { otherCopySources } = useCopyConfig(
      viewRows,
      currentDataset,
      currentViewType,
    );

    expect(otherCopySources.value.map((source) => source.key)).toEqual([
      copySourceKey("dataset_b", "map"),
    ]);

    currentDataset.value = "dataset_b";
    expect(otherCopySources.value.map((source) => source.key)).toEqual([
      copySourceKey("dataset_a", "map"),
    ]);
  });

  it("copies secondaryDataset from the source view along with viewConfig", () => {
    viewRows.value = [
      makeRow({
        viewId: 1,
        primaryDataset: "fake_alerts",
        viewType: "alerts",
        viewName: "Fake Alerts",
        viewConfig: { SECONDARY_FILTER_VALUES: "threat" },
      }),
      {
        ...makeRow({
          viewId: 2,
          primaryDataset: "gfw_alerts_viirs",
          viewType: "alerts",
          viewName: "GFW Alerts",
          viewConfig: { SECONDARY_FILTER_VALUES: "threat" },
        }),
        secondaryDataset: "mapeo_data",
      },
    ];

    const currentViewType = ref<ViewType | undefined>("alerts");
    const {
      otherCopySources,
      selectedCopySource,
      handleConfirmCopy,
      configToCopy,
      secondaryDatasetToCopy,
    } = useCopyConfig(viewRows, "fake_alerts", currentViewType);

    selectedCopySource.value = otherCopySources.value[0].key;
    handleConfirmCopy();

    expect(configToCopy.value).toEqual({ SECONDARY_FILTER_VALUES: "threat" });
    expect(secondaryDatasetToCopy.value).toBe("mapeo_data");
  });
});
