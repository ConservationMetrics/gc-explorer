import { describe, expect, it } from "vitest";

import {
  alertMapLayers,
  getAlertGeometryRenderKind,
  getAlertSourceFeatures,
} from "@/utils/alertMapLayers";
import type { Feature } from "geojson";

const point: Feature = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [1, 2] },
  properties: { alertID: "point" },
};

const polygon: Feature = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ],
    ],
  },
  properties: { alertID: "polygon", geographicCentroid: "1,2" },
};

const multiPolygon: Feature = {
  type: "Feature",
  geometry: {
    type: "MultiPolygon",
    coordinates: [
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    ],
  },
  properties: { alertID: "multipolygon", geographicCentroid: "3,4" },
};

const lineString: Feature = {
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: [
      [0, 0],
      [1, 1],
    ],
  },
  properties: { alertID: "line", geographicCentroid: "5,6" },
};

describe("alertMapLayers", () => {
  it("defines every stable alert source and layer ID once", () => {
    expect(alertMapLayers).toEqual([
      expect.objectContaining({
        period: "mostRecent",
        kind: "point",
        sourceId: "most-recent-alerts-point",
        layerId: "most-recent-alerts-point",
      }),
      expect.objectContaining({
        period: "mostRecent",
        kind: "polygon",
        sourceId: "most-recent-alerts-polygon",
        layerId: "most-recent-alerts-polygon",
      }),
      expect.objectContaining({
        period: "mostRecent",
        kind: "linestring",
        sourceId: "most-recent-alerts-linestring",
        layerId: "most-recent-alerts-linestring",
      }),
      expect.objectContaining({
        period: "mostRecent",
        kind: "centroids",
        sourceId: "most-recent-alerts-centroids",
        layerId: "most-recent-alerts-centroids",
      }),
      expect.objectContaining({
        period: "previous",
        kind: "point",
        sourceId: "previous-alerts-point",
        layerId: "previous-alerts-point",
      }),
      expect.objectContaining({
        period: "previous",
        kind: "polygon",
        sourceId: "previous-alerts-polygon",
        layerId: "previous-alerts-polygon",
      }),
      expect.objectContaining({
        period: "previous",
        kind: "linestring",
        sourceId: "previous-alerts-linestring",
        layerId: "previous-alerts-linestring",
      }),
      expect.objectContaining({
        period: "previous",
        kind: "centroids",
        sourceId: "previous-alerts-centroids",
        layerId: "previous-alerts-centroids",
      }),
    ]);
  });

  it("classifies Polygon and MultiPolygon features as polygon renderings", () => {
    expect(getAlertGeometryRenderKind(point)).toBe("point");
    expect(getAlertGeometryRenderKind(polygon)).toBe("polygon");
    expect(getAlertGeometryRenderKind(multiPolygon)).toBe("polygon");
    expect(getAlertGeometryRenderKind(lineString)).toBe("linestring");
  });

  it("projects each geometry kind and centroid source consistently", () => {
    const features = [point, polygon, multiPolygon, lineString];

    expect(getAlertSourceFeatures(features, "point")).toEqual([point]);
    expect(getAlertSourceFeatures(features, "polygon")).toEqual([
      polygon,
      multiPolygon,
    ]);
    expect(getAlertSourceFeatures(features, "linestring")).toEqual([
      lineString,
    ]);
    expect(getAlertSourceFeatures(features, "centroids")).toEqual([
      expect.objectContaining({
        geometry: { type: "Point", coordinates: [2, 1] },
        properties: expect.objectContaining({ alertID: "polygon" }),
      }),
      expect.objectContaining({
        geometry: { type: "Point", coordinates: [4, 3] },
        properties: expect.objectContaining({ alertID: "multipolygon" }),
      }),
      expect.objectContaining({
        geometry: { type: "Point", coordinates: [6, 5] },
        properties: expect.objectContaining({ alertID: "line" }),
      }),
    ]);
  });

  it("excludes point features and features without a geographic centroid", () => {
    const polygonWithoutCentroid = {
      ...polygon,
      properties: { alertID: "missing-centroid" },
    };

    expect(
      getAlertSourceFeatures([point, polygonWithoutCentroid], "centroids"),
    ).toEqual([]);
  });
});
