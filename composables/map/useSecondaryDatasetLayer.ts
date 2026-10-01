import { onBeforeUnmount, ref } from "vue";
import type { Ref } from "vue";
import type { Feature, FeatureCollection } from "geojson";
import type { Map as MapboxMap, MapLayerMouseEvent } from "mapbox-gl";
import {
  SECONDARY_SOURCE_ID,
  SECONDARY_INTERACTIVE_LAYER_IDS,
  secondaryMapLayers,
  setSecondaryDataLayerVisibility,
} from "@/utils/secondaryMapLayers";

/** Owns secondary layers and delegated handlers across style recreation. */
export const useSecondaryDatasetLayer = (
  map: Ref<MapboxMap | undefined>,
  getData: () => FeatureCollection | null | undefined,
  onSelect: (feature: Feature, layerId: string) => void,
) => {
  const visible = ref(true);
  let registeredMap: MapboxMap | undefined;
  const handlers = SECONDARY_INTERACTIVE_LAYER_IDS.map((id) => ({
    id,
    click: (event: MapLayerMouseEvent) => {
      if (event.features?.[0]) onSelect(event.features[0], id);
    },
  }));
  const cleanup = () => {
    handlers.forEach(({ id, click }) => {
      registeredMap?.off("click", id, click);
    });
    registeredMap = undefined;
  };
  const setVisible = (value: boolean) => {
    visible.value = value;
    if (map.value)
      setSecondaryDataLayerVisibility(map.value, value ? "visible" : "none");
  };
  const install = () => {
    const current = map.value;
    const data = getData();
    if (!current || !data?.features.length) return;
    if (!current.getSource(SECONDARY_SOURCE_ID))
      current.addSource(SECONDARY_SOURCE_ID, { type: "geojson", data });
    const before = current
      .getStyle()
      ?.layers?.find((layer) =>
        /^(data-layer|most-recent-alerts|previous-alerts)/.test(layer.id),
      )?.id;
    secondaryMapLayers().forEach((layer) => {
      if (!current.getLayer(layer.id)) current.addLayer(layer, before);
    });
    setVisible(visible.value);
    if (registeredMap === current) return;
    cleanup();
    registeredMap = current;
    handlers.forEach(({ id, click }) => {
      current.on("click", id, click);
    });
  };
  onBeforeUnmount(cleanup);
  return { install, setVisible, visible };
};
