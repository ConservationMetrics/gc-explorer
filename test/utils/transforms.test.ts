import { describe, it, expect } from "vitest";

import {
  transformSurveyData,
  transformSurveyDataKey,
  transformSurveyDataValue,
  transformRecord,
} from "@/utils/transforms";
import { mapeoData } from "../fixtures/mapeoData";

describe("transformSurveyDataKey", () => {
  it("should remove g__ prefix and replace with geo", () => {
    expect(transformSurveyDataKey("g__coordinates")).toBe("geocoordinates");
    expect(transformSurveyDataKey("g__type")).toBe("geotype");
  });

  it("should remove p__ prefix", () => {
    expect(transformSurveyDataKey("p__notes")).toBe("notes");
    expect(transformSurveyDataKey("p__activity")).toBe("activity");
  });

  it("should replace underscores with spaces", () => {
    expect(transformSurveyDataKey("building_type")).toBe("building type");
  });

  it("should map 'today' to 'dataCollectedOn'", () => {
    expect(transformSurveyDataKey("today")).toBe("dataCollectedOn");
    expect(transformSurveyDataKey("Today")).toBe("dataCollectedOn");
  });

  it("should map keys containing 'categoryid' to 'category'", () => {
    expect(transformSurveyDataKey("p__categoryid")).toBe("category");
    expect(transformSurveyDataKey("categoryid")).toBe("category");
  });

  it("should preserve icon column key unchanged", () => {
    expect(transformSurveyDataKey("my_icon_col", "my_icon_col")).toBe(
      "my_icon_col",
    );
  });
});

describe("transformSurveyDataValue", () => {
  it("should return null for null values", () => {
    expect(transformSurveyDataValue("any_key", null)).toBeNull();
  });

  it("should preserve g__coordinates values unchanged", () => {
    const coords = "[-4.9876543, 83.1234567]";
    expect(transformSurveyDataValue("g__coordinates", coords)).toBe(coords);
  });

  it("should replace underscores with spaces in strings", () => {
    expect(transformSurveyDataValue("key", "some_value")).toBe("Some value");
  });

  it("should replace semicolons with commas", () => {
    expect(transformSurveyDataValue("key", "a;b;c")).toBe("A, b, c");
  });

  it("should capitalize the first letter", () => {
    expect(transformSurveyDataValue("key", "yes")).toBe("Yes");
  });

  it("should replace dashes with spaces for category keys", () => {
    expect(transformSurveyDataValue("categoryid", "forest-trail")).toBe(
      "Forest trail",
    );
  });

  it("should handle bracket-enclosed lists", () => {
    const input = "['a.jpg', 'b.jpg', 'c.jpg']";
    expect(transformSurveyDataValue("photos", input)).toBe(
      "a.jpg, b.jpg, c.jpg",
    );
  });

  it("should preserve icon column values unchanged", () => {
    expect(
      transformSurveyDataValue("icon_col", "icon_file.png", "icon_col"),
    ).toBe("icon_file.png");
  });

  it("should pass through numeric values", () => {
    expect(transformSurveyDataValue("count", 42)).toBe(42);
  });
});

describe("transformSurveyData", () => {
  it("should transform raw survey data keys and values", () => {
    const result = transformSurveyData(mapeoData);

    result.forEach((item) => {
      expect(item).not.toHaveProperty("g__coordinates");
      expect(item).toHaveProperty("geocoordinates");
      expect(item.category[0]).toBe(item.category[0].toUpperCase());
      // Timestamps are preserved as-is (not formatted into locale strings)
      expect(item.created).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(item.photos).toMatch(/^(\w+\.jpg(, )?)*\w+\.jpg$|^$/);
      expect(item).toHaveProperty("id");
    });
  });

  it("should remove p__ prefix from keys", () => {
    const result = transformSurveyData(mapeoData);
    result.forEach((item) => {
      Object.keys(item).forEach((key) => {
        expect(key).not.toMatch(/^p__/);
      });
    });
  });

  it("should not include entries with null values", () => {
    const data = [{ key1: "value1", key2: null, key3: "value3" }];
    const result = transformSurveyData(data);
    expect(Object.keys(result[0])).toHaveLength(2);
    expect(result[0]).not.toHaveProperty("key2");
  });

  it("should preserve icon column keys and values", () => {
    const data = [
      {
        p__name: "test",
        my_icon: "icon_file.png",
        p__categoryid: "house",
      },
    ];
    const result = transformSurveyData(data, "my_icon");
    expect(result[0]).toHaveProperty("my_icon");
    expect(result[0].my_icon).toBe("icon_file.png");
  });
});

describe("transformRecord", () => {
  it("should transform a single record", () => {
    const rawRecord = mapeoData[0];
    const result = transformRecord(rawRecord);

    expect(result).not.toHaveProperty("g__coordinates");
    expect(result).toHaveProperty("geocoordinates");
    expect(result).toHaveProperty("category");
    expect(result.category[0]).toBe(result.category[0].toUpperCase());
  });

  it("should preserve icon column for single record", () => {
    const record = {
      p__name: "test",
      icon_col: "icon.png",
      p__categoryid: "forest",
    };
    const result = transformRecord(record, "icon_col");
    expect(result.icon_col).toBe("icon.png");
  });
});
