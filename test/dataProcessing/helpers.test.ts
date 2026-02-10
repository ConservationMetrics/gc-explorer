import { describe, it, expect } from "vitest";

import { calculateCentroid } from "@/utils/dataProcessing/helpers";

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
