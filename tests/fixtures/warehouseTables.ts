import type { WarehouseTestTable } from "@/types";

/** Synthetic survey responses for gallery and map views. */
export const surveyTable: WarehouseTestTable = {
  columns: ["_id", "community", "photo", "audio", "g__type", "g__coordinates"],
  rows: [
    {
      _id: "survey-1",
      community: "Test Setting 130",
      photo: "survey-1.webp",
      audio: "survey-1.mp3",
      g__type: "Point",
      g__coordinates: "[-76.53995,3.44704]",
    },
    {
      _id: "survey-2",
      community: "Test Setting 131",
      photo: "survey-2.webp",
      audio: null,
      g__type: "Point",
      g__coordinates: "[-76.5399,3.4471]",
    },
  ],
};

/**
 * Synthetic alerts around the alerts view center (38, -79). March 2024 is
 * the most recent month; the other rows fall in earlier months.
 */
export const alertsTable: WarehouseTestTable = {
  columns: [
    "_id",
    "alert_id",
    "alert_type",
    "area_alert_ha",
    "month_detec",
    "year_detec",
    "territory_name",
    "g__type",
    "g__coordinates",
  ],
  rows: [
    {
      _id: "202403000000001",
      alert_id: "202403000000001",
      alert_type: "gold_mining",
      area_alert_ha: "1.5",
      month_detec: "03",
      year_detec: "2024",
      territory_name: "Test Territory 130",
      g__type: "MultiPolygon",
      g__coordinates:
        "[[[[-80.7,38.9],[-80.5,38.9],[-80.5,38.7],[-80.7,38.7],[-80.7,38.9]]],[[[-80.4,38.9],[-80.2,38.9],[-80.2,38.7],[-80.4,38.7],[-80.4,38.9]]]]",
    },
    {
      _id: "202403000000002",
      alert_id: "202403000000002",
      alert_type: "gold_mining",
      area_alert_ha: "1.5",
      month_detec: "03",
      year_detec: "2024",
      territory_name: "Test Territory 130",
      g__type: "Polygon",
      g__coordinates:
        "[[[-79.6,38.5],[-78.4,38.5],[-78.4,37.5],[-79.6,37.5],[-79.6,38.5]]]",
    },
    {
      _id: "202403000000003",
      alert_id: "202403000000003",
      alert_type: "gold_mining",
      area_alert_ha: "1.5",
      month_detec: "03",
      year_detec: "2024",
      territory_name: "Test Territory 130",
      g__type: "LineString",
      g__coordinates: "[[-81,38],[-77,38]]",
    },
    {
      _id: "202401000000001",
      alert_id: "202401000000001",
      alert_type: "gold_mining",
      area_alert_ha: "1.5",
      month_detec: "01",
      year_detec: "2024",
      territory_name: "Test Territory 130",
      g__type: "Polygon",
      g__coordinates:
        "[[[-80.9,37.5],[-80.7,37.5],[-80.7,37.3],[-80.9,37.3],[-80.9,37.5]]]",
    },
    {
      _id: "202312000000001",
      alert_id: "202312000000001",
      alert_type: "gold_mining",
      area_alert_ha: "1.5",
      month_detec: "12",
      year_detec: "2023",
      territory_name: "Test Territory 130",
      g__type: "Point",
      g__coordinates: "[-78.4,37.1]",
    },
    {
      _id: "202310000000001",
      alert_id: "202310000000001",
      alert_type: "gold_mining",
      area_alert_ha: "1.5",
      month_detec: "10",
      year_detec: "2023",
      territory_name: "Test Territory 130",
      g__type: "LineString",
      g__coordinates: "[[-77.9,38.6],[-77.6,38.8]]",
    },
  ],
};

/** Synthetic Mapeo observations; two of three match the "threat" filter. */
export const mapeoTable: WarehouseTestTable = {
  columns: ["_id", "p__categoryid", "g__type", "g__coordinates"],
  rows: [
    {
      _id: "mapeo-threat-1",
      p__categoryid: "threat",
      g__type: "Point",
      g__coordinates: "[-79.05,38.05]",
    },
    {
      _id: "mapeo-threat-2",
      p__categoryid: "threat",
      g__type: "Point",
      g__coordinates: "[-79.15,38.15]",
    },
    {
      _id: "mapeo-animal-1",
      p__categoryid: "animal",
      g__type: "Point",
      g__coordinates: "[-79.25,38.25]",
    },
  ],
};
