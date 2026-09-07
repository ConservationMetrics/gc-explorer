import { describe, expect, it, vi } from "vitest";

import { parseBasemaps } from "@/server/utils";
import type { ViewConfig } from "@/types";

vi.mock("/server/database/dbConnection", () => ({
  warehouseDb: {},
}));
vi.mock("@/server/database/dbConnection", () => ({
  warehouseDb: {},
}));

const streetsStyle = "mapbox://styles/mapbox/streets-v12";
const satelliteStyle = "mapbox://styles/mapbox/satellite-v9";

describe("parseBasemaps", () => {
  it("returns the default basemap style and token", () => {
    const tableConfig: ViewConfig = {
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "Streets",
          style: streetsStyle,
          access_token: "pk.default",
          isDefault: true,
        },
      ]),
    };

    expect(parseBasemaps(tableConfig)).toEqual({
      basemaps: [
        {
          name: "Streets",
          style: streetsStyle,
          access_token: "pk.default",
          isDefault: true,
        },
      ],
      defaultMapboxStyle: streetsStyle,
      defaultAccessToken: "pk.default",
    });
  });

  it("uses the isDefault basemap when multiple basemaps are configured", () => {
    const tableConfig: ViewConfig = {
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "Streets",
          style: streetsStyle,
          access_token: "pk.streets",
          isDefault: false,
        },
        {
          name: "Satellite",
          style: satelliteStyle,
          access_token: "pk.satellite",
          isDefault: true,
        },
      ]),
    };

    const parsed = parseBasemaps(tableConfig);

    expect(parsed.basemaps).toHaveLength(2);
    expect(parsed.defaultMapboxStyle).toBe(satelliteStyle);
    expect(parsed.defaultAccessToken).toBe("pk.satellite");
  });

  it("falls back to the first basemap when isDefault is absent", () => {
    const tableConfig: ViewConfig = {
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "Streets",
          style: streetsStyle,
          access_token: "pk.first",
        },
        {
          name: "Satellite",
          style: satelliteStyle,
          access_token: "pk.second",
        },
      ]),
    };

    const parsed = parseBasemaps(tableConfig);

    expect(parsed.defaultMapboxStyle).toBe(streetsStyle);
    expect(parsed.defaultAccessToken).toBe("pk.first");
  });

  it("returns empty basemaps when MAPBOX_BASEMAPS is missing", () => {
    expect(parseBasemaps({})).toEqual({
      basemaps: [],
      defaultMapboxStyle: undefined,
      defaultAccessToken: undefined,
    });
  });

  it("returns empty basemaps when MAPBOX_BASEMAPS is not valid JSON", () => {
    expect(parseBasemaps({ MAPBOX_BASEMAPS: "{not-json" })).toEqual({
      basemaps: [],
      defaultMapboxStyle: undefined,
      defaultAccessToken: undefined,
    });
  });
});
