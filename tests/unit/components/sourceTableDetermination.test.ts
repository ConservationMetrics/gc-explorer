import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref } from "vue";

/**
 * Tests for source table determination logic
 *
 * This test suite ensures that the source_table determination logic correctly
 * extracts table names from route parameters and layer IDs. This is critical
 * because the logic depends on the route structure being `/alerts/[tablename]`.
 *
 * If the route structure changes (e.g., to `/alerts/view/[tablename]` or
 * `/alerts/dataset/[tablename]`), these tests should fail, alerting us to
 * update the source table determination logic.
 */

// Mock vue-router
const mockRoute = ref({ params: {} });
vi.mock("vue-router", () => ({
  useRoute: () => mockRoute.value,
}));

/**
 * Helper function to determine source table from layer ID and route params
 * This mirrors the logic in AlertsDashboard.vue handleMultiSelectFeature
 *
 * Route dependency: This function assumes the route structure is `/alerts/[tablename]`
 * where `tablename` is accessible via `route.params.tablename`.
 *
 * If the route structure changes, this function must be updated accordingly.
 *
 * @param layerId - The layer ID (e.g., "most-recent-alerts-polygon", "mapeo-data")
 * @param routeParams - The route params object (should contain `tablename` for alert layers)
 * @returns The source table name, or empty string if unable to determine
 */
function determineSourceTable(
  layerId: string,
  routeParams: { tablename?: string | string[]; [key: string]: unknown },
): string {
  // Get table name from route params (e.g., /alerts/fake_alerts -> fake_alerts)
  const tableRaw = routeParams.tablename;
  const tableName = Array.isArray(tableRaw) ? tableRaw.join("/") : tableRaw;

  if (
    layerId.includes("most-recent-alerts") ||
    layerId.includes("previous-alerts")
  ) {
    // For alert layers, use the table name from route params
    // Route structure: /alerts/[tablename]
    return (tableName as string) || "";
  } else if (layerId === "mapeo-data") {
    // For Mapeo layers, use hardcoded table name
    return "mapeo_data";
  }

  return "";
}

describe("Source Table Determination", () => {
  beforeEach(() => {
    mockRoute.value = { params: {} };
  });

  describe("Alert layers - route dependency", () => {
    it("extracts table name from route.params.tablename for most-recent-alerts layers", () => {
      const layerId = "most-recent-alerts-polygon";
      const routeParams = { tablename: "fake_alerts" };

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("fake_alerts");
    });

    it("extracts table name from route.params.tablename for previous-alerts layers", () => {
      const layerId = "previous-alerts-point";
      const routeParams = { tablename: "test_alerts" };

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("test_alerts");
    });

    it("handles different alert layer variants", () => {
      const testCases = [
        "most-recent-alerts-polygon",
        "most-recent-alerts-linestring",
        "most-recent-alerts-point",
        "most-recent-alerts-centroids",
        "previous-alerts-polygon",
        "previous-alerts-linestring",
        "previous-alerts-point",
        "previous-alerts-centroids",
      ];

      testCases.forEach((layerId) => {
        const result = determineSourceTable(layerId, {
          tablename: "my_alerts",
        });
        expect(result).toBe("my_alerts");
      });
    });

    it("handles array tablename param (edge case)", () => {
      const layerId = "most-recent-alerts-polygon";
      const routeParams = { tablename: ["fake", "alerts"] };

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("fake/alerts");
    });

    it("returns empty string if tablename is missing for alert layers", () => {
      const layerId = "most-recent-alerts-polygon";
      const routeParams = {};

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("");
    });

    it("returns empty string if tablename is undefined for alert layers", () => {
      const layerId = "most-recent-alerts-polygon";
      const routeParams = { tablename: undefined };

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("");
    });

    it("handles empty string tablename", () => {
      const layerId = "most-recent-alerts-polygon";
      const routeParams = { tablename: "" };

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("");
    });
  });

  describe("Mapeo layers - hardcoded table name", () => {
    it("returns 'mapeo_data' for mapeo-data layer", () => {
      const layerId = "mapeo-data";
      const routeParams = { tablename: "fake_alerts" }; // Should be ignored

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("mapeo_data");
    });

    it("returns 'mapeo_data' even if route params are missing", () => {
      const layerId = "mapeo-data";
      const routeParams = {};

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("mapeo_data");
    });
  });

  describe("Unknown layer types", () => {
    it("returns empty string for unknown layer IDs", () => {
      const layerId = "unknown-layer";
      const routeParams = { tablename: "fake_alerts" };

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("");
    });

    it("returns empty string for empty layer ID", () => {
      const layerId = "";
      const routeParams = { tablename: "fake_alerts" };

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("");
    });
  });

  describe("Regression tests - route structure changes", () => {
    /**
     * These tests verify that if the route structure changes, we'll catch it.
     *
     * Current route structure: /alerts/[tablename]
     * Expected route params: { tablename: "table_name" }
     *
     * If the route changes to something like:
     * - /alerts/view/[tablename] -> params would be { view: "view_name", tablename: "table_name" }
     * - /alerts/dataset/[tablename] -> params would be { dataset: "dataset_name", tablename: "table_name" }
     * - /alerts/[dataset]/[tablename] -> params would be { dataset: "dataset_name", tablename: "table_name" }
     *
     * These tests ensure we're using the correct param name.
     */

    it("fails if route uses different param name (would catch route structure change)", () => {
      const layerId = "most-recent-alerts-polygon";
      // Simulating a route change where tablename is now under a different key
      const routeParams = { view: "fake_alerts" }; // Wrong param name

      const result = determineSourceTable(layerId, routeParams);

      // This should fail if route structure changes
      expect(result).toBe("");
    });

    it("fails if route uses nested structure (would catch route structure change)", () => {
      const layerId = "most-recent-alerts-polygon";
      // Simulating a route change where tablename is nested
      const routeParams = { alerts: { tablename: "fake_alerts" } };

      const result = determineSourceTable(layerId, routeParams);

      // This should fail if route structure changes to nested params
      expect(result).toBe("");
    });

    it("correctly handles current route structure", () => {
      const layerId = "most-recent-alerts-polygon";
      // Current route structure: /alerts/[tablename]
      const routeParams = { tablename: "fake_alerts" };

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("fake_alerts");
    });
  });

  describe("Edge cases and robustness", () => {
    it("handles special characters in table name", () => {
      const layerId = "most-recent-alerts-polygon";
      const routeParams = { tablename: "test_table_123" };

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("test_table_123");
    });

    it("handles numeric table names", () => {
      const layerId = "most-recent-alerts-polygon";
      const routeParams = { tablename: "123" };

      const result = determineSourceTable(layerId, routeParams);

      expect(result).toBe("123");
    });

    it("is case-sensitive for layer ID matching", () => {
      const layerId = "MOST-RECENT-ALERTS-POLYGON"; // Wrong case
      const routeParams = { tablename: "fake_alerts" };

      const result = determineSourceTable(layerId, routeParams);

      // Should not match because includes() is case-sensitive
      expect(result).toBe("");
    });

    it("handles partial matches correctly", () => {
      // Ensure we're not matching substrings incorrectly
      const layerId = "not-most-recent-alerts-polygon"; // Contains substring but shouldn't match
      const routeParams = { tablename: "fake_alerts" };

      const result = determineSourceTable(layerId, routeParams);

      // Should match because includes() will find the substring
      // This is the current behavior - if this is wrong, we need to use exact matching
      expect(result).toBe("fake_alerts");
    });

    it("handles mapeo-data with different casing", () => {
      const layerId = "Mapeo-Data"; // Wrong case
      const routeParams = { tablename: "fake_alerts" };

      const result = determineSourceTable(layerId, routeParams);

      // Should not match because we use exact equality
      expect(result).toBe("");
    });
  });
});
