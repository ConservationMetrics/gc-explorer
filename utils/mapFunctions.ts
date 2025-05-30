import type mapboxgl from "mapbox-gl";

import type { Basemap, MapStyle } from "@/types/types";

/** Map styles configuration for different basemaps */
export const mapStyles: Record<string, MapStyle> = {
  planet: {
    name: `Planet Monthly Visual Basemap`,
    style: {
      version: 8,
      sources: {
        planet: {
          type: "raster",
          tiles: [
            `https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_monthYear_mosaic/gmap/{z}/{x}/{y}?api_key=`,
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: "background",
          type: "background",
          paint: {
            "background-color": "#f9f9f9",
          },
        },
        {
          id: "planet",
          type: "raster",
          source: "planet",
          paint: {},
        },
      ],
    },
  },
};

/** Changes the map style based on the provided basemap and API key */
export const changeMapStyle = (
  map: mapboxgl.Map,
  basemap: Basemap,
  planetApiKey?: string,
) => {
  if (basemap.style) {
    map.setStyle(basemap.style);
  } else if (
    basemap.id === "planet" &&
    mapStyles.planet.style &&
    planetApiKey
  ) {
    const planetStyle = JSON.parse(JSON.stringify(mapStyles.planet.style));
    planetStyle.sources.planet.tiles[0] =
      planetStyle.sources.planet.tiles[0].replace(
        "monthYear",
        basemap.monthYear || "2024-01",
      );
    planetStyle.sources.planet.tiles[0] += planetApiKey;
    map.setStyle(planetStyle);
  } else {
    console.warn("Basemap style not found, or API key not provided");
  }
};

/** Retrieves mapbox layers for the legend based on provided layer IDs */
const getMapboxLayersForLegend = (
  map: mapboxgl.Map,
  mapLegendLayerIds: string,
): mapboxgl.Layer[] => {
  const layerIds = mapLegendLayerIds.split(",");
  const matchingLayers: mapboxgl.Layer[] = [];

  layerIds.forEach((layerId) => {
    layerId = layerId.trim();

    const layer = map.getLayer(layerId);

    if (layer && layer.type !== "custom") {
      matchingLayers.push(layer);
    }
  });

  return matchingLayers;
};

/** Prepares map legend layers with type, id, and color information */
export const prepareMapLegendLayers = (
  map: mapboxgl.Map,
  mapLegendLayerIds: string | null,
  mapeoLegendColor?: string | null,
): unknown[] | undefined => {
  if (!mapLegendLayerIds || !map.isStyleLoaded()) {
    return;
  }

  const mapboxLayersForLegend = getMapboxLayersForLegend(
    map,
    mapLegendLayerIds,
  );

  const mapLegendContent = mapboxLayersForLegend
    .map((layer) => {
      const layerId = layer.id;
      const layerType = layer.type;
      let layerColor = map.getPaintProperty(
        layerId,
        `${layerType}-color` as
          | "fill-color"
          | "line-color"
          | "circle-color"
          | "heatmap-color"
          | "fill-extrusion-color"
          | "raster-opacity"
          | "hillshade-shadow-color"
          | "background-color"
          | "sky-opacity",
      );

      if (!layerColor) {
        return;
      }

      const layerColorColumn = (layerColor as string[])[3];
      if (Array.isArray(layerColorColumn) && mapeoLegendColor) {
        layerColor = mapeoLegendColor;
      }

      let formattedId = layerId
        .replace(/-/g, " ")
        .replace(/^\w/, (m) => m.toUpperCase());

      formattedId = formattedId.replace(/ polygon| linestring| point$/i, "");

      return {
        id: layerId,
        name: formattedId,
        type: layerType,
        color: layerColor,
      };
    })
    .filter(Boolean);

  if (mapLegendContent.length === 0) {
    return;
  }

  return mapLegendContent;
};

/** Reverses [long, lat] coordinates and removes brackets */
export const prepareCoordinatesForSelectedFeature = (
  coordinates: string,
): string => {
  if (typeof coordinates === "object") {
    coordinates = JSON.stringify(coordinates);
  }

  return coordinates
    .replace("[", "")
    .replace("]", "")
    .split(",")
    .reverse()
    .join(",");
};

/** Toggles the visibility of a map layer */
export const toggleLayerVisibility = (
  map: mapboxgl.Map,
  item: { id: string; visible: boolean },
) => {
  const layerId = item.id;
  const visibility = item.visible ? "visible" : "none";

  map.setLayoutProperty(layerId, "visibility", visibility);

  const strokeLayerId = `${layerId}-stroke`;
  if (map.getLayer(strokeLayerId)) {
    map.setLayoutProperty(strokeLayerId, "visibility", visibility);
  }
};
