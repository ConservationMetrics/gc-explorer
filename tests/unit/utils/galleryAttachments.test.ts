import { describe, it, expect } from "vitest";

import { parseGalleryAttachments } from "@/utils/galleryAttachments";

describe("parseGalleryAttachments", () => {
  it("parses Kobo attachment arrays from _attachments", () => {
    const record = {
      _attachments: JSON.stringify([
        {
          download_url:
            "https://kf.kobotoolbox.org/api/v2/assets/test/data/1/attachments/1/",
          download_large_url:
            "https://kf.kobotoolbox.org/api/v2/assets/test/data/1/attachments/1/large/",
          download_medium_url:
            "https://kf.kobotoolbox.org/api/v2/assets/test/data/1/attachments/1/medium/",
          download_small_url:
            "https://kf.kobotoolbox.org/api/v2/assets/test/data/1/attachments/1/small/",
          mimetype: "image/jpeg",
          filename: "test_dataset/attachments/uuid/example_photo-18_20_56.jpg",
          id: 134806447,
          uid: "attExampleUid",
          media_file_basename: "example_photo-18_20_56.jpg",
          question_xpath: "photo",
        },
      ]),
    };

    const attachments = parseGalleryAttachments(record);

    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toEqual({
      name: "example photo-18 20 56.jpg",
      mimetype: "image/jpeg",
      questionXpath: "photo",
      downloadUrl:
        "https://kf.kobotoolbox.org/api/v2/assets/test/data/1/attachments/1/",
      downloadLargeUrl:
        "https://kf.kobotoolbox.org/api/v2/assets/test/data/1/attachments/1/large/",
      downloadMediumUrl:
        "https://kf.kobotoolbox.org/api/v2/assets/test/data/1/attachments/1/medium/",
      downloadSmallUrl:
        "https://kf.kobotoolbox.org/api/v2/assets/test/data/1/attachments/1/small/",
      id: 134806447,
      uid: "attExampleUid",
    });
  });

  it("returns an empty array when attachment JSON is missing or invalid", () => {
    expect(parseGalleryAttachments({})).toEqual([]);
    expect(parseGalleryAttachments({ _attachments: "not-json" })).toEqual([]);
  });

  it("parses multiple attachments including audio-only and image with size variants", () => {
    const record = {
      _attachments: [
        {
          "download url":
            "https://kf.kobotoolbox.org/api/v2/assets/test/data/254137498/attachments/117093110/",
          mimetype: "audio/mpeg",
          filename:
            "test_dataset/attachments/uuid/file_example_MP3_1MG-14_39_11.mp3",
          id: 117093110,
          uid: "attbkG4kYkoSDxVoFQyYqeBK",
          "media file basename": "file example MP3 1MG-14 39 11.mp3",
          "question xpath": "audio",
        },
        {
          "download url":
            "https://kf.kobotoolbox.org/api/v2/assets/test/data/254137498/attachments/117093108/",
          "download large url":
            "https://kf.kobotoolbox.org/api/v2/assets/test/data/254137498/attachments/117093108/large/",
          "download medium url":
            "https://kf.kobotoolbox.org/api/v2/assets/test/data/254137498/attachments/117093108/medium/",
          "download small url":
            "https://kf.kobotoolbox.org/api/v2/assets/test/data/254137498/attachments/117093108/small/",
          mimetype: "image/webp",
          filename: "test_dataset/attachments/uuid/7222-14_38_37.webp",
          id: 117093108,
          uid: "attJqmfBELb7R6jiY3WtkSLm",
          "media file basename": "7222-14 38 37.webp",
          "question xpath": "photo",
        },
      ],
    };

    const attachments = parseGalleryAttachments(record);

    expect(attachments).toHaveLength(2);
    expect(attachments[0].questionXpath).toBe("audio");
    expect(attachments[0].downloadLargeUrl).toBeUndefined();
    expect(attachments[1].questionXpath).toBe("photo");
    expect(attachments[1].downloadLargeUrl).toContain("/large/");
    expect(attachments[1].downloadSmallUrl).toContain("/small/");
  });

  it("parses a single audio attachment from raw snake_case JSON", () => {
    const record = {
      _attachments: JSON.stringify([
        {
          download_url:
            "https://kf.kobotoolbox.org/api/v2/assets/test/data/443381026/attachments/218696052/",
          mimetype: "audio/mpeg",
          media_file_basename: "1740070748089.m4a",
          question_xpath: "audio",
          id: 218696052,
          uid: "attoCibmG5qrgopSTitfzMKY",
        },
      ]),
    };

    const attachments = parseGalleryAttachments(record);

    expect(attachments).toHaveLength(1);
    expect(attachments[0].name).toBe("1740070748089.m4a");
    expect(attachments[0].mimetype).toBe("audio/mpeg");
    expect(attachments[0].questionXpath).toBe("audio");
  });
});
