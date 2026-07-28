import { describe, expect, it } from "vitest";

import { normalizeTableName } from "@/utils/identifierUtils";

describe("normalizeTableName", () => {
  const thaiTable = "แม่ยางมิ้น_observations";

  it("decodes percent-encoded Thai table names used as warehouse identifiers", () => {
    expect(normalizeTableName(encodeURIComponent(thaiTable))).toBe(thaiTable);
  });

  it("leaves already-decoded Unicode names unchanged", () => {
    expect(normalizeTableName(thaiTable)).toBe(thaiTable);
  });

  it("strips wrapping quotes before decoding", () => {
    expect(normalizeTableName(`"${encodeURIComponent(thaiTable)}"`)).toBe(
      thaiTable,
    );
  });

  it("leaves ASCII table names unchanged", () => {
    expect(normalizeTableName("comapeo_project_observations")).toBe(
      "comapeo_project_observations",
    );
  });
});
