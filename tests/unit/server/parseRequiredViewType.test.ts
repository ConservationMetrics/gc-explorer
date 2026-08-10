import { describe, expect, it } from "vitest";

import { parseRequiredViewType } from "@/server/utils/dbHelpers";

describe("parseRequiredViewType", () => {
  it("accepts alerts, map, and gallery", () => {
    expect(parseRequiredViewType("alerts")).toBe("alerts");
    expect(parseRequiredViewType("map")).toBe("map");
    expect(parseRequiredViewType("gallery")).toBe("gallery");
  });

  it("rejects missing, empty, repeated, and unknown values with status 400", () => {
    for (const raw of [undefined, "", ["alerts", "map"], "dashboard", 1]) {
      try {
        parseRequiredViewType(raw);
        expect.unreachable(`expected rejection for ${JSON.stringify(raw)}`);
      } catch (error) {
        expect(error).toMatchObject({ statusCode: 400 });
      }
    }
  });
});
