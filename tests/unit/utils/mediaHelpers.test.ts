import { describe, expect, it } from "vitest";

import { inferContentType } from "@/utils/mediaHelpers";

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
