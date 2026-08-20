import { describe, it, expect } from "vitest";

import { mapboxStyleToStudioUrl } from "@/utils/mapboxStyle";

describe("mapboxStyleToStudioUrl", () => {
  it("returns a Studio URL for mapbox://styles/ values", () => {
    expect(
      mapboxStyleToStudioUrl("mapbox://styles/mapbox/satellite-streets-v12"),
    ).toBe(
      "https://console.mapbox.com/studio/styles/mapbox/satellite-streets-v12",
    );
    expect(mapboxStyleToStudioUrl("mapbox://styles/myuser/mystyle")).toBe(
      "https://console.mapbox.com/studio/styles/myuser/mystyle",
    );
  });

  it("returns null for empty or non-mapbox style values", () => {
    expect(mapboxStyleToStudioUrl("")).toBeNull();
    expect(mapboxStyleToStudioUrl("https://example.com/style.json")).toBeNull();
    expect(
      mapboxStyleToStudioUrl("mapbox://tilesets/mapbox/streets"),
    ).toBeNull();
  });
});
