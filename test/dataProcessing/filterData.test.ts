import { describe, it, expect } from "vitest";

import {
  filterUnwantedKeys,
  filterOutUnwantedValues,
  filterGeoData,
  filterDataByExtension,
} from "@/server/dataProcessing/filterData";
import { mapeoData } from "../fixtures/mapeoData";

describe("filterUnwantedKeys", () => {
  it("should filter out unwanted columns and substrings", () => {
    const unwantedColumns = "p__activity,p__aeroway";
    const unwantedSubstrings = "p__";

    const result = filterUnwantedKeys(
      mapeoData,
      null,
      unwantedColumns,
      unwantedSubstrings,
    );

    const containsUnwantedColumnsAndSubstrings = result.some((entry) =>
      Object.keys(entry).some(
        (key) =>
          key.includes("p__activity") ||
          key.includes("p__aeroway") ||
          key.includes("p__"),
      ),
    );

    expect(containsUnwantedColumnsAndSubstrings).toBe(false);
  });
});

describe("filterUnwantedValues", () => {
  it("should filter out unwanted values", () => {
    const unwantedValues = "building,house";
    const columnToFilterBy = "p__categoryid";
    const result = filterOutUnwantedValues(
      mapeoData,
      columnToFilterBy,
      unwantedValues,
    );

    const containsUnwantedValues = result.some((entry) =>
      Object.values(entry).some(
        (value) => value === "building" || value === "house",
      ),
    );
    expect(containsUnwantedValues).toBe(false);
  });
});

describe("filterGeoData", () => {
  it("should filter out data without valid coordinates", () => {
    const result = filterGeoData(mapeoData);

    // the fixture data has 3 entries, but only 2 have valid coordinates
    expect(result).toHaveLength(2);
  });
});

describe("filterDataByExtension", () => {
  it("should filter out data without media attachments", () => {
    const extensions = {
      image: ["jpg", "jpeg", "png", "webp"],
      audio: ["mp3", "ogg", "wav"],
      video: ["mov", "mp4", "avi", "mkv"],
    };
    const result = filterDataByExtension(mapeoData, extensions);

    // the fixture data has 3 entries, but only 1 has media attachments
    expect(result).toHaveLength(1);
  });

  it("should filter data by specific media column when provided", () => {
    const testData = [
      { photo: "image1.jpg", icon: "icon1.png", name: "Feature 1" },
      { photo: "image2.jpg", icon: "icon2.png", name: "Feature 2" },
      { photo: "", icon: "icon3.png", name: "Feature 3" },
    ];
    const extensions = {
      image: ["jpg", "jpeg", "png", "webp"],
      audio: ["mp3", "ogg", "wav"],
      video: ["mov", "mp4", "avi", "mkv"],
    };

    // Filter by 'photo' column only
    const result = filterDataByExtension(testData, extensions, "photo");

    // Should only return entries with valid extensions in the 'photo' column
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Feature 1");
    expect(result[1].name).toBe("Feature 2");
  });
});
