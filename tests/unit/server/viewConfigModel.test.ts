import { describe, expect, it, vi } from "vitest";

import type { ViewConfig } from "@/types";
import {
  buildViewConfigColumns,
  updateConfig,
} from "@/server/database/dbOperations";

// dbConnection instantiates Postgres clients at import time via the Nuxt
// runtime config, which is unavailable here. Stub it so the helpers under test
// can be imported without a database. (configDb is left as an empty object: the
// guard under test must throw before any query is attempted on it.)
//
// dbOperations imports it as "./dbConnection", which Vitest resolves to the
// project-root path "/server/database/dbConnection" — that spelling is the one
// that actually intercepts. The "@/"-aliased spelling does not match the
// resolved id; both are declared to be robust to how the import is written.
// (Factories are inlined because vi.mock is hoisted above any local variables.)
vi.mock("/server/database/dbConnection", () => ({
  configDb: {},
  warehouseDb: {},
  schema: {},
}));
vi.mock("@/server/database/dbConnection", () => ({
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

    const columns = buildViewConfigColumns("fake_alerts", config, "alerts");

    expect(columns.viewType).toBe("alerts");
    expect(columns.secondaryDataset).toBe("mapeo_data");
    expect(columns.primaryDataset).toBe("fake_alerts");
    expect(columns.viewName).toBe("Fake Alerts");
    expect(JSON.parse(columns.viewConfig)).not.toHaveProperty("MAPEO_TABLE");
  });

  it("leaves secondaryDataset null for map and gallery views", () => {
    const config: ViewConfig = {
      DATASET_TABLE: "BCM Form Responses",
      MAPEO_TABLE: "mapeo_data",
    };

    const mapColumns = buildViewConfigColumns(
      "bcmform_responses",
      config,
      "map",
    );
    const galleryColumns = buildViewConfigColumns(
      "bcmform_responses",
      config,
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
      "gallery",
    );

    expect(JSON.parse(columns.viewConfig)).not.toHaveProperty("VIEWS");
  });

  it("falls back to primaryDataset for viewName when DATASET_TABLE is absent", () => {
    const config: ViewConfig = { MAPBOX_ZOOM: 16 };

    const columns = buildViewConfigColumns(
      "seed_survey_data",
      config,
      "gallery",
    );

    expect(columns.viewName).toBe("seed_survey_data");
  });
});

describe("updateConfig", () => {
  it("refuses to update without a view type", async () => {
    // A dataset can have several views, so an update must target exactly one
    // (primary_dataset, view_type) row. Without a view type the old code matched
    // every view of the dataset and nulled their type; the guard must reject it.
    // updateConfig logs before rethrowing, so silence that expected error line.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      updateConfig("fake_alerts", { ROUTE_LEVEL_PERMISSION: "anyone" }),
    ).rejects.toThrow(/view type/i);

    errorSpy.mockRestore();
  });
});
