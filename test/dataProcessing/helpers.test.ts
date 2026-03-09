import { describe, it, expect } from "vitest";

import {
  calculateCentroid,
  hasValidCoordinates,
} from "@/server/dataProcessing/helpers";

describe("calculateCentroid", () => {
  it("returns centroid for Point", () => {
    const point = JSON.stringify([-54.28, 3.12]);
    expect(calculateCentroid(point)).toBe("3.120000, -54.280000");
  });

  it("returns centroid for LineString", () => {
    const line = JSON.stringify([
      [-54.28, 3.12],
      [-54.29, 3.13],
    ]);
    expect(calculateCentroid(line)).toBe("3.125000, -54.285000");
  });

  it("returns centroid for Polygon", () => {
    const polygon = JSON.stringify([
      [
        [-54.28, 3.12],
        [-54.29, 3.13],
        [-54.3, 3.14],
      ],
    ]);
    expect(calculateCentroid(polygon)).toBe("3.130000, -54.290000");
  });

  it("returns centroid for MultiPolygon", () => {
    const multipolygon = JSON.stringify([
      [
        [
          [-54.28, 3.12],
          [-54.29, 3.13],
        ],
      ],
      [
        [
          [-54.3, 3.14],
          [-54.31, 3.15],
        ],
      ],
    ]);
    expect(calculateCentroid(multipolygon)).toBe("3.135000, -54.295000");
  });

  it("handles malformed input gracefully", () => {
    const badInput = JSON.stringify("not a geo shape");
    expect(calculateCentroid(badInput)).toBe("");
  });

  it("returns correct value for nested ring structures", () => {
    const ringedPolygon = JSON.stringify([
      [
        [
          [-54.28, 3.12],
          [-54.29, 3.13],
          [-54.3, 3.14],
        ],
        [
          [-54.3, 3.14],
          [-54.31, 3.15],
        ],
      ],
    ]);
    expect(calculateCentroid(ringedPolygon)).toBe("3.136000, -54.296000");
  });
});

describe("hasValidCoordinates", () => {
  it("validates Point coordinates", () => {
    expect(hasValidCoordinates({ g__coordinates: "[-54.28, 3.12]" })).toBe(
      true,
    );
  });

  it("validates Polygon coordinates", () => {
    const polygon =
      "[[[-80.58, 38.77], [-80.57, 38.78], [-80.59, 38.80], [-80.58, 38.77]]]";
    expect(hasValidCoordinates({ g__coordinates: polygon })).toBe(true);
  });

  it("validates LineString coordinates", () => {
    const line = "[[-54.28, 3.12], [-54.29, 3.13]]";
    expect(hasValidCoordinates({ g__coordinates: line })).toBe(true);
  });

  it("validates MultiPolygon coordinates", () => {
    const multi =
      "[[[[-54.28, 3.12], [-54.29, 3.13], [-54.28, 3.12]]], [[[-54.30, 3.14], [-54.31, 3.15], [-54.30, 3.14]]]]";
    expect(hasValidCoordinates({ g__coordinates: multi })).toBe(true);
  });

  it("rejects entries with no coordinate key", () => {
    expect(hasValidCoordinates({ name: "test" })).toBe(false);
  });

  it("rejects entries with null coordinates", () => {
    expect(hasValidCoordinates({ g__coordinates: null })).toBe(false);
  });
});
