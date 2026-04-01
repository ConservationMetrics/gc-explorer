import { describe, it, expect } from "vitest";
import { parsePhotoListString, parsePhotosFromRecord } from "@/utils/index";

describe("parsePhotoListString", () => {
  it("strips bracket-wrapped single filename", () => {
    expect(
      parsePhotoListString("['f6f7afd16f98e821ef0a7a125e270f51.jpg']"),
    ).toEqual(["f6f7afd16f98e821ef0a7a125e270f51.jpg"]);
  });

  it("parses bracket-wrapped list of multiple filenames", () => {
    expect(
      parsePhotoListString("['a.jpg', 'b.jpg', 'c.jpg']"),
    ).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });

  it("parses plain comma-separated filenames", () => {
    expect(parsePhotoListString("one.jpg,two.jpg")).toEqual([
      "one.jpg",
      "two.jpg",
    ]);
    expect(parsePhotoListString("one.jpg, two.jpg , three.jpg")).toEqual([
      "one.jpg",
      "two.jpg",
      "three.jpg",
    ]);
  });

  it("strips quotes and brackets from each token", () => {
    expect(parsePhotoListString('["5bf52de27e1a7b36f2d2cec254b766c8.jpg"]')).toEqual(
      ["5bf52de27e1a7b36f2d2cec254b766c8.jpg"],
    );
  });

  it("replaces spaces with underscores in filenames", () => {
    expect(parsePhotoListString("my photo name.jpg")).toEqual([
      "my_photo_name.jpg",
    ]);
  });

  it("returns empty for nullish or empty", () => {
    expect(parsePhotoListString(null)).toEqual([]);
    expect(parsePhotoListString(undefined)).toEqual([]);
    expect(parsePhotoListString("")).toEqual([]);
  });

  it("filters empty tokens after cleaning", () => {
    expect(parsePhotoListString("a.jpg,,b.jpg")).toEqual(["a.jpg", "b.jpg"]);
  });
});

describe("parsePhotosFromRecord", () => {
  it("prefers photos over _photos", () => {
    expect(
      parsePhotosFromRecord({
        photos: "a.jpg",
        _photos: "b.jpg",
      }),
    ).toEqual(["a.jpg"]);
  });

  it("reads _photos when photos is absent", () => {
    expect(
      parsePhotosFromRecord({
        _photos: "['x.jpg']",
      }),
    ).toEqual(["x.jpg"]);
  });
});
