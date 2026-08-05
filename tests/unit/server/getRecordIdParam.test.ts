import { describe, expect, it } from "vitest";

import { getRecordIdParam } from "@/server/utils/dbHelpers";

import type { H3Event } from "h3";

const eventWithRecordId = (recordId: string | undefined): H3Event =>
  ({
    context: { params: recordId === undefined ? {} : { recordId } },
  }) as H3Event;

describe("getRecordIdParam", () => {
  it("decodes percent-encoded record IDs from the path", () => {
    expect(getRecordIdParam(eventWithRecordId("record%201%2F%E0%B8%81"))).toBe(
      "record 1/ก",
    );
  });

  it("leaves plain UUID-style IDs unchanged", () => {
    expect(getRecordIdParam(eventWithRecordId("abc-123"))).toBe("abc-123");
  });

  it("rejects missing or blank record IDs", () => {
    expect(() => getRecordIdParam(eventWithRecordId(undefined))).toThrow(
      "Invalid record ID",
    );
    expect(() => getRecordIdParam(eventWithRecordId("   "))).toThrow(
      "Invalid record ID",
    );
  });
});
