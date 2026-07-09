import { describe, it, expect } from "vitest";

import {
  buildGalleryMinimapUrl,
  mapboxStyleToStaticPath,
  parseCentroidLatLng,
} from "@/utils/galleryMinimap";

describe("mapboxStyleToStaticPath", () => {
  it("returns default style when style is missing", () => {
    expect(mapboxStyleToStaticPath()).toBe("mapbox/satellite-streets-v12");
  });

  it("strips mapbox://styles/ prefix", () => {
    expect(mapboxStyleToStaticPath("mapbox://styles/mapbox/streets-v12")).toBe(
      "mapbox/streets-v12",
    );
  });
});

describe("parseCentroidLatLng", () => {
  it("parses lat,lng strings", () => {
    expect(parseCentroidLatLng("3.447040, -76.539950")).toEqual({
      lat: 3.44704,
      lng: -76.53995,
    });
  });

  it("returns null for invalid centroid strings", () => {
    expect(parseCentroidLatLng("not-a-coordinate")).toBeNull();
    expect(parseCentroidLatLng("1,2,3")).toBeNull();
  });
});

describe("buildGalleryMinimapUrl", () => {
  it("builds a static image URL with pin overlay", () => {
    const url = buildGalleryMinimapUrl({
      accessToken: "pk.test",
      centroid: "3.447040, -76.539950",
      mapboxStyle: "mapbox://styles/mapbox/satellite-streets-v12",
    });

    expect(url).toContain(
      "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/",
    );
    expect(url).toContain("pin-s+7c3aed(-76.53995,3.44704)");
    expect(url).toContain("600x300@2x");
    expect(url).toContain("access_token=pk.test");
  });

  it("returns null when token or centroid is invalid", () => {
    expect(
      buildGalleryMinimapUrl({
        accessToken: "",
        centroid: "3.447040, -76.539950",
      }),
    ).toBeNull();
    expect(
      buildGalleryMinimapUrl({
        accessToken: "pk.test",
        centroid: "invalid",
      }),
    ).toBeNull();
  });
});
