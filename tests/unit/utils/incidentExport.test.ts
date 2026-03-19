import { describe, it, expect } from "vitest";
import {
  buildIncidentMetadataCsv,
  buildIncidentEntriesFeatureCollection,
} from "@/utils/incidentExport";
import type { AnnotatedCollection, CollectionEntry, Incident } from "@/types";

describe("buildIncidentMetadataCsv", () => {
  it("includes metadata section and tabular rows per entry (export-style)", () => {
    const incident: AnnotatedCollection = {
      id: "uuid-1",
      name: "Test",
      description: "Desc",
      collection_type: "incident",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-02T00:00:00.000Z",
      metadata: { foo: "bar" },
    };
    const incidentData: Incident = {
      collection_id: "uuid-1",
      status: "suspected",
      is_active: true,
      incident_type: "fire",
    };
    const entries: CollectionEntry[] = [
      {
        id: "e1",
        collection_id: "uuid-1",
        source_table: "fake_alerts",
        source_id: "123",
        source_data: {},
        added_by: "u",
        added_at: "2024-01-01T00:00:00.000Z",
      },
    ];
    const csv = buildIncidentMetadataCsv(incident, incidentData, entries);
    expect(csv).toContain("field,value");
    expect(csv).toContain("uuid-1");
    expect(csv).toContain("Test");
    expect(csv).toContain("fire");
    expect(csv).toContain("entry_count,1");
    expect(csv).toContain("collection_entry_id,source_table,source_id");
    expect(csv).toContain("fake_alerts");
    expect(csv).toContain("e1");
  });
});

describe("buildIncidentEntriesFeatureCollection", () => {
  it("includes a feature with null geometry when source_data has no valid geo", () => {
    const entries: CollectionEntry[] = [
      {
        id: "e1",
        collection_id: "c1",
        source_table: "t",
        source_id: "1",
        source_data: { foo: 1 },
        added_by: "u",
        added_at: "2024-01-01T00:00:00.000Z",
      },
    ];
    const fc = buildIncidentEntriesFeatureCollection(entries);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry).toBeNull();
    expect(fc.features[0].properties?.foo).toBe(1);
  });

  it("includes a feature when source_data has valid g__ fields", () => {
    const entries: CollectionEntry[] = [
      {
        id: "e1",
        collection_id: "c1",
        source_table: "fake_alerts",
        source_id: "1",
        source_data: {
          g__type: "Point",
          g__coordinates: "[-79, 38]",
          alert_id: "1",
        },
        added_by: "u",
        added_at: "2024-01-01T00:00:00.000Z",
      },
    ];
    const fc = buildIncidentEntriesFeatureCollection(entries);
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry.type).toBe("Point");
    expect(fc.features[0].properties?.source_table).toBe("fake_alerts");
  });
});
