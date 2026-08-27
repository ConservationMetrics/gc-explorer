import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Map as MapboxMap } from "mapbox-gl";

import {
  POINT_HALO_RADIUS,
  POINT_CLUSTER_HALO_RADIUS,
  addPulsingHaloLayers,
  stopPulsingHalo,
} from "@/utils/pulsingHalo";

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  stopPulsingHalo();
  vi.unstubAllGlobals();
});

describe("addPulsingHaloLayers", () => {
  it("adds circle halo layers for unclustered points and clusters", () => {
    const map = {
      getLayer: vi.fn(() => undefined),
      addLayer: vi.fn(),
      setPaintProperty: vi.fn(),
    };

    addPulsingHaloLayers(map as unknown as MapboxMap, "most-recent-alerts-point", {
      unclusteredRadius: POINT_HALO_RADIUS,
      clusterRadius: POINT_CLUSTER_HALO_RADIUS,
    });

    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "most-recent-alerts-point-clusters-halo",
        type: "circle",
        source: "most-recent-alerts-point",
        filter: ["has", "point_count"],
      }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "most-recent-alerts-point-halo",
        type: "circle",
        source: "most-recent-alerts-point",
        filter: ["!", ["has", "point_count"]],
      }),
    );

    const clusterLayer = map.addLayer.mock.calls.find(
      ([layer]) => layer.id === "most-recent-alerts-point-clusters-halo",
    )?.[0];
    expect(clusterLayer.paint["circle-radius"]).toEqual([
      "+",
      4,
      POINT_CLUSTER_HALO_RADIUS,
    ]);

    map.getLayer.mockImplementation((id: string) =>
      id.includes("halo") ? { id } : undefined,
    );

    addPulsingHaloLayers(map as unknown as MapboxMap, "most-recent-alerts-point", {
      unclusteredRadius: POINT_HALO_RADIUS,
      clusterRadius: POINT_CLUSTER_HALO_RADIUS,
    });

    expect(map.addLayer).toHaveBeenCalledTimes(2);
  });

  it("forwards maxzoom onto halo layers", () => {
    const map = {
      getLayer: vi.fn(() => undefined),
      addLayer: vi.fn(),
      setPaintProperty: vi.fn(),
    };

    addPulsingHaloLayers(
      map as unknown as MapboxMap,
      "most-recent-alerts-centroids",
      {
        unclusteredRadius: POINT_HALO_RADIUS,
        clusterRadius: POINT_CLUSTER_HALO_RADIUS,
        maxzoom: 12,
      },
    );

    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "most-recent-alerts-centroids-clusters-halo",
        maxzoom: 12,
      }),
    );
  });
});
