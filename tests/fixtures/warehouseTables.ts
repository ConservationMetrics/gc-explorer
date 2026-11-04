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

/** Synthetic alerts with one newer month and one earlier month. */
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
      _id: "alert-recent-1",
      alert_id: "alert-recent-1",
      alert_type: "gold_mining",
      area_alert_ha: "1.5",
      month_detec: "03",
      year_detec: "2024",
      territory_name: "Test Territory 130",
      g__type: "Polygon",
      g__coordinates:
        "[[[-79.1,38.1],[-78.9,38.1],[-78.9,37.9],[-79.1,37.9],[-79.1,38.1]]]",
    },
    {
      _id: "alert-previous-1",
      alert_id: "alert-previous-1",
      alert_type: "gold_mining",
      area_alert_ha: "2.5",
      month_detec: "01",
      year_detec: "2024",
      territory_name: "Test Territory 130",
      g__type: "Point",
      g__coordinates: "[-79.2,38.2]",
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
