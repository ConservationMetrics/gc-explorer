import type { Feature, FeatureCollection, Geometry } from "geojson";
import type {
  AnnotatedCollection,
  CollectionEntry,
  Incident,
  DataEntry,
} from "@/types";
import { escapeCSVValue, buildCsvFromObjects } from "@/utils/csvUtils";
import { isValidGeolocation } from "@/utils/geoUtils";

const ENTRY_CSV_FIXED_HEADERS = [
  "collection_entry_id",
  "source_table",
  "source_id",
  "entry_notes",
  "entry_added_at",
] as const;

const unionSourceDataKeys = (entries: CollectionEntry[]): string[] => {
  const keys = new Set<string>();
  for (const entry of entries) {
    for (const key of Object.keys(entry.source_data ?? {})) {
      if (!key.startsWith("g__")) keys.add(key);
    }
  }
  return Array.from(keys).sort((a, b) => a.localeCompare(b));
};

/**
 * Builds CSV text: (1) incident/collection field–value rows, then (2) a tabular block
 * with one row per collection entry (same idea as `export.get.ts` CSV), using a union
 * of non-geometry keys from each entry's `source_data`.
 */
export const buildIncidentMetadataCsv = (
  incident: AnnotatedCollection,
  incidentData?: Incident | null,
  entries?: CollectionEntry[],
): string => {
  const metaRows: Array<[string, string]> = [
    ["id", incident.id],
    ["name", incident.name],
    ["description", incident.description ?? ""],
    ["collection_type", incident.collection_type],
    ["created_at", incident.created_at],
    ["updated_at", incident.updated_at],
    ["created_by", incident.created_by ?? ""],
    ["metadata", JSON.stringify(incident.metadata ?? {})],
  ];

  if (incidentData) {
    metaRows.push(
      ["incident_type", incidentData.incident_type ?? ""],
      ["responsible_party", incidentData.responsible_party ?? ""],
      ["status", incidentData.status],
      ["is_active", String(incidentData.is_active)],
      ["impact_description", incidentData.impact_description ?? ""],
      [
        "supporting_evidence",
        JSON.stringify(incidentData.supporting_evidence ?? {}),
      ],
    );
  }

  if (entries?.length) {
    metaRows.push(["entry_count", String(entries.length)]);
  }

  const metaSection = [
    `${escapeCSVValue("field")},${escapeCSVValue("value")}`,
    ...metaRows.map(([k, v]) => `${escapeCSVValue(k)},${escapeCSVValue(v)}`),
  ].join("\n");

  if (!entries?.length) {
    return metaSection;
  }

  const dataKeys = unionSourceDataKeys(entries);
  const tabularHeaders = [...ENTRY_CSV_FIXED_HEADERS, ...dataKeys];
  const tabularRows = entries.map((entry) => {
    const row: Record<string, unknown> = {
      collection_entry_id: entry.id,
      source_table: entry.source_table,
      source_id: entry.source_id,
      entry_notes: entry.notes ?? "",
      entry_added_at: entry.added_at,
    };
    for (const key of dataKeys) {
      row[key] = entry.source_data?.[key];
    }
    return row;
  });

  const tabularSection = buildCsvFromObjects(tabularRows, tabularHeaders);
  return `${metaSection}\n,\n${tabularSection}`;
};

/**
 * Builds a GeoJSON FeatureCollection with one feature per collection entry.
 * Geometry is set when `source_data` has valid g__ fields; otherwise `geometry` is null.
 */
export const buildIncidentEntriesFeatureCollection = (
  entries: CollectionEntry[],
): FeatureCollection<Geometry | null> => {
  const features: Feature<Geometry | null>[] = [];

  for (const entry of entries) {
    const row = entry.source_data as unknown as DataEntry;
    let geometry: Geometry | null = null;

    if (isValidGeolocation(row)) {
      const geoType = row.g__type as string;
      const rawCoords = row.g__coordinates as string;
      try {
        const coordinates = JSON.parse(rawCoords);
        geometry = {
          type: geoType,
          coordinates,
        } as Geometry;
      } catch {
        geometry = null;
      }
    }

    const props: Record<string, unknown> = {
      collection_entry_id: entry.id,
      source_table: entry.source_table,
      source_id: entry.source_id,
      added_at: entry.added_at,
      notes: entry.notes ?? "",
    };
    Object.keys(row).forEach((key) => {
      if (key.startsWith("g__")) return;
      const val = row[key];
      if (val !== undefined && val !== null) {
        props[key] = val;
      }
    });

    features.push({
      type: "Feature",
      geometry,
      properties: props,
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
};

/**
 * Triggers a file download in the browser from text content.
 *
 * @param filename - Suggested download filename.
 * @param content - File body.
 * @param mimeType - MIME type for the blob.
 */
export const triggerTextDownload = (
  filename: string,
  content: string,
  mimeType: string,
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
