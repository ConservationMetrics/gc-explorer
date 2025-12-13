import { describe, it, expect } from "vitest";
import { escapeCSVValue } from "@/utils/csvUtils";

describe("escapeCSVValue", () => {
  describe("Newline escaping", () => {
    it("should escape single newline characters", () => {
      expect(escapeCSVValue("Line1\nLine2")).toBe("Line1\\nLine2");
    });

    it("should escape multiple newlines", () => {
      expect(escapeCSVValue("First\nSecond\nThird")).toBe(
        "First\\nSecond\\nThird",
      );
      expect(escapeCSVValue("Alpha\nBeta\nGamma\nDelta")).toBe(
        "Alpha\\nBeta\\nGamma\\nDelta",
      );
    });

    it("should escape carriage return + newline sequences", () => {
      expect(escapeCSVValue("Line1\r\nLine2")).toBe("Line1\\nLine2");
    });

    it("should escape standalone carriage returns", () => {
      expect(escapeCSVValue("Line1\rLine2")).toBe("Line1\\rLine2");
    });

    it("should handle mixed line endings", () => {
      expect(escapeCSVValue("Line1\r\nLine2\nLine3\rLine4")).toBe(
        "Line1\\nLine2\\nLine3\\rLine4",
      );
    });
  });

  describe("Comma escaping", () => {
    it("should wrap values with commas in quotes", () => {
      expect(escapeCSVValue("Test, Location")).toBe('"Test, Location"');
    });

    it("should wrap values with multiple commas", () => {
      expect(escapeCSVValue("First, Second, Third")).toBe(
        '"First, Second, Third"',
      );
    });
  });

  describe("Quote escaping", () => {
    it("should escape quotes by doubling them and wrapping in quotes", () => {
      expect(escapeCSVValue('Test "quoted" value')).toBe(
        '"Test ""quoted"" value"',
      );
    });

    it("should handle multiple quotes", () => {
      expect(escapeCSVValue('A "quoted" "phrase"')).toBe(
        '"A ""quoted"" ""phrase"""',
      );
    });
  });

  describe("Combined special characters", () => {
    it("should handle newlines and commas together", () => {
      expect(escapeCSVValue("Line1\nLine2, with comma")).toBe(
        '"Line1\\nLine2, with comma"',
      );
    });

    it("should handle newlines and quotes together", () => {
      expect(escapeCSVValue('Line1\nLine2 "quoted"')).toBe(
        '"Line1\\nLine2 ""quoted"""',
      );
    });

    it("should handle all three special characters", () => {
      expect(escapeCSVValue('Line1\nLine2, with "quotes"')).toBe(
        '"Line1\\nLine2, with ""quotes"""',
      );
    });

    it("should handle multi-line text data", () => {
      expect(escapeCSVValue("Entry1\nEntry2\nEntry3")).toBe(
        "Entry1\\nEntry2\\nEntry3",
      );
      expect(escapeCSVValue("Data\nWith\nMultiple\nLines")).toBe(
        "Data\\nWith\\nMultiple\\nLines",
      );
    });
  });

  describe("Null and undefined handling", () => {
    it("should convert null to empty string", () => {
      expect(escapeCSVValue(null)).toBe("");
    });

    it("should convert undefined to empty string", () => {
      expect(escapeCSVValue(undefined)).toBe("");
    });
  });

  describe("Empty values", () => {
    it("should preserve empty strings", () => {
      expect(escapeCSVValue("")).toBe("");
    });

    it("should preserve whitespace-only strings", () => {
      expect(escapeCSVValue("   ")).toBe("   ");
    });
  });

  describe("Non-string values", () => {
    it("should convert numbers to strings", () => {
      expect(escapeCSVValue(123)).toBe("123");
      expect(escapeCSVValue(45.67)).toBe("45.67");
    });

    it("should convert booleans to strings", () => {
      expect(escapeCSVValue(true)).toBe("true");
      expect(escapeCSVValue(false)).toBe("false");
    });

    it("should convert objects to strings", () => {
      expect(escapeCSVValue({ key: "value" })).toBe("[object Object]");
    });

    it("should convert arrays to strings", () => {
      expect(escapeCSVValue([1, 2, 3])).toBe('"1,2,3"');
    });
  });

  describe("Already escaped values", () => {
    it("should not double-escape already escaped newlines", () => {
      // If someone passes in "\\n", it should stay as "\\n"
      expect(escapeCSVValue("Line1\\nLine2")).toBe("Line1\\nLine2");
    });

    it("should handle literal backslash-n sequences", () => {
      expect(escapeCSVValue("Path\\name")).toBe("Path\\name");
    });
  });

  describe("Special CSV characters", () => {
    it("should not escape values without special characters", () => {
      expect(escapeCSVValue("Simple value")).toBe("Simple value");
    });

    it("should handle values with only letters and numbers", () => {
      expect(escapeCSVValue("Value123")).toBe("Value123");
    });

    it("should handle values with common punctuation", () => {
      expect(escapeCSVValue("Value!@#$%^&*()")).toBe("Value!@#$%^&*()");
    });
  });
});
