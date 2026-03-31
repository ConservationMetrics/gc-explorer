import { describe, it, expect } from "vitest";
import { sanitizeFilenameSegment } from "@/utils/identifierUtils";

describe("sanitizeFilenameSegment", () => {
  it("replaces runs of unsafe characters with a single underscore", () => {
    expect(sanitizeFilenameSegment("Hello / World!")).toBe("Hello_World_");
  });

  it("preserves hyphens and underscores and letter case", () => {
    expect(sanitizeFilenameSegment("My-Incident_v2")).toBe("My-Incident_v2");
  });

  it("strips diacritics for ASCII-safe names", () => {
    expect(sanitizeFilenameSegment("Vigilância")).toBe("Vigilancia");
  });

  it("truncates to maxLength", () => {
    expect(sanitizeFilenameSegment("abcdefghij", 5)).toBe("abcde");
  });

  it("uses fallback when the label is empty", () => {
    expect(sanitizeFilenameSegment("")).toBe("incident");
  });
});
