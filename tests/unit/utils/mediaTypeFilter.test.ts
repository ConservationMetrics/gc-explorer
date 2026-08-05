import { describe, expect, it } from "vitest";

import { filterByMediaTypes, getMediaTypesForEntry } from "@/utils";

const extensions = {
  audio: ["mp3", "m4a"],
  image: ["jpg", "png"],
  video: ["mp4"],
};

describe("getMediaTypesForEntry", () => {
  it("detects image, audio, and video from a media column", () => {
    expect(
      getMediaTypesForEntry(
        { photo: "a.jpg, clip.mp3, reel.mp4" },
        extensions,
        "photo",
      ).sort(),
    ).toEqual(["audio", "image", "video"]);
  });

  it("returns empty when no matching extensions are present", () => {
    expect(
      getMediaTypesForEntry({ photo: "notes.txt" }, extensions, "photo"),
    ).toEqual([]);
  });
});

describe("filterByMediaTypes", () => {
  const items = [
    { _id: "1", photo: "a.jpg" },
    { _id: "2", photo: "b.mp3" },
    { _id: "3", photo: "c.jpg, d.mp3" },
  ];

  it("returns all items when no media types are selected", () => {
    expect(filterByMediaTypes(items, [], extensions, "photo")).toEqual(items);
  });

  it("keeps entries that include any selected type", () => {
    expect(
      filterByMediaTypes(items, ["audio"], extensions, "photo").map(
        (i) => i._id,
      ),
    ).toEqual(["2", "3"]);
    expect(
      filterByMediaTypes(items, ["image"], extensions, "photo").map(
        (i) => i._id,
      ),
    ).toEqual(["1", "3"]);
  });
});
