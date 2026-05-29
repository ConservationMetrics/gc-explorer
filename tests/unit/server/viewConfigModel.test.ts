import { describe, expect, it, vi } from "vitest";

import type { ViewConfig } from "@/types";
import { buildViewConfigColumns } from "@/server/database/dbOperations";

// dbConnection instantiates Postgres clients at import time via the Nuxt
// runtime config, which is unavailable here. Stub it so the pure helper under
// test can be imported without a database.
vi.mock("@/server/database/dbConnection", () => ({
  configDb: {},
  warehouseDb: {},
  schema: {},
}));

vi.mock("/server/database/dbConnection", () => ({
  configDb: {},
  warehouseDb: {},
  schema: {},
}));

describe("buildViewConfigColumns", () => {
  it("sets secondaryDataset from MAPEO_TABLE and viewType for alerts views", () => {
    const config: ViewConfig = {
      DATASET_TABLE: "Fake Alerts",
      MAPEO_TABLE: "mapeo_data",
      ROUTE_LEVEL_PERMISSION: "anyone",
    };

    const columns = buildViewConfigColumns(
      "fake_alerts",
      config,
      JSON.stringify(config),
      "alerts",
    );

    expect(columns.viewType).toBe("alerts");
    expect(columns.secondaryDataset).toBe("mapeo_data");
    expect(columns.primaryDataset).toBe("fake_alerts");
    expect(columns.viewName).toBe("Fake Alerts");
  });

  it("leaves secondaryDataset null for map and gallery views", () => {
    const config: ViewConfig = {
      DATASET_TABLE: "BCM Form Responses",
      MAPEO_TABLE: "mapeo_data",
    };

    const mapColumns = buildViewConfigColumns(
      "bcmform_responses",
      config,
      JSON.stringify(config),
      "map",
    );
    const galleryColumns = buildViewConfigColumns(
      "bcmform_responses",
      config,
      JSON.stringify(config),
      "gallery",
    );

    expect(mapColumns.secondaryDataset).toBeNull();
    expect(galleryColumns.secondaryDataset).toBeNull();
  });

  it("does not include a VIEWS key in the serialized view config", () => {
    const config: ViewConfig = {
      DATASET_TABLE: "Survey",
      MAPBOX_ZOOM: 16,
    };

    const columns = buildViewConfigColumns(
      "seed_survey_data",
      config,
      JSON.stringify(config),
      "gallery",
    );

    expect(JSON.parse(columns.viewConfig)).not.toHaveProperty("VIEWS");
  });

  it("falls back to primaryDataset for viewName when DATASET_TABLE is absent", () => {
    const config: ViewConfig = { MAPBOX_ZOOM: 16 };

    const columns = buildViewConfigColumns(
      "seed_survey_data",
      config,
      JSON.stringify(config),
      "gallery",
    );

    expect(columns.viewName).toBe("seed_survey_data");
  });
});
