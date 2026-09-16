import { describe, expect, it } from "vitest";

import { allowedFileExtensionsFixture as extensions } from "@/tests/unit/fixtures/allowedFileExtensions";
import {
  getFilePathsWithExtension,
  inferContentType,
  isImageFilePath,
} from "@/utils/mediaHelpers";

describe("inferContentType", () => {
  it.each([
    ["https://files.example.com/api/public/dl/abc/icon.png", "image/png"],
    ["https://files.example.com/api/public/dl/abc/icon.jpg", "image/jpeg"],
    ["https://files.example.com/api/public/dl/abc/icon.jpeg", "image/jpeg"],
    ["https://files.example.com/api/public/dl/abc/icon.gif", "image/gif"],
    ["https://files.example.com/api/public/dl/abc/icon.svg", "image/svg+xml"],
    ["https://files.example.com/api/public/dl/abc/icon.webp", "image/webp"],
  ])("maps %s to the matching MIME type", (url, expected) => {
    expect(inferContentType(url, null)).toBe(expected);
  });

  it("matches the extension case-insensitively", () => {
    expect(inferContentType("https://files.example.com/icon.SVG", null)).toBe(
      "image/svg+xml",
    );
  });

  it("ignores query strings and fragments when matching", () => {
    expect(
      inferContentType("https://files.example.com/icon.png?v=2#x", null),
    ).toBe("image/png");
  });

  it("falls back to the supplied content-type for unknown extensions", () => {
    expect(
      inferContentType("https://files.example.com/data.bin", "application/pdf"),
    ).toBe("application/pdf");
  });

  it("falls back to application/octet-stream when neither extension nor fallback resolve", () => {
    expect(inferContentType("https://files.example.com/data", null)).toBe(
      "application/octet-stream",
    );
  });

  it("falls back for non-URL inputs", () => {
    expect(inferContentType("not-a-url", "image/png")).toBe("image/png");
  });
});

describe("isImageFilePath", () => {
  it("matches configured image extensions case-insensitively", () => {
    expect(isImageFilePath("folder/photo.JPG", ["jpg"])).toBe(true);
    expect(isImageFilePath("folder/audio.mp3", ["jpg"])).toBe(false);
  });

  it("supports configured extensions with a leading dot", () => {
    expect(isImageFilePath("photo.webp", [".webp"])).toBe(true);
  });
});

describe("getFilePathsWithExtension", () => {
  it("cleans quoted list strings and keeps matching media paths", () => {
    expect(
      getFilePathsWithExtension(
        { photo: '["5bf52de27e1a7b36f2d2cec254b766c8.jpg"], notes.txt' },
        extensions,
        "photo",
      ),
    ).toEqual(["5bf52de27e1a7b36f2d2cec254b766c8.jpg"]);
  });

  it("skips attachment metadata strings", () => {
    expect(
      getFilePathsWithExtension(
        { photo: "download/attachment/1.jpg" },
        extensions,
        "photo",
      ),
    ).toEqual([]);
  });

  it("keeps bare filenames and drops remote URLs", () => {
    expect(
      getFilePathsWithExtension(
        {
          photo:
            "medium.jpg, https://inaturalist-open-data.s3.amazonaws.com/photos/639345356/medium.jpg",
        },
        extensions,
        "photo",
      ),
    ).toEqual(["medium.jpg"]);
  });

  it("drops paths where the filename is preceded by a slash", () => {
    expect(
      getFilePathsWithExtension(
        {
          photo:
            "Https:/inaturalist-open-data.s3.amazonaws.com/photos/639345356/medium.jpg, photos/nested.jpg",
        },
        extensions,
        "photo",
      ),
    ).toEqual([]);
  });
});
