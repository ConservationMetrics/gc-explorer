import { describe, expect, it } from "vitest";

import { useAppConfig } from "#imports";
import { parseRequiredViewType } from "@/server/utils/dbHelpers";

describe("parseRequiredViewType", () => {
  it("accepts every configured view type", () => {
    for (const viewType of useAppConfig().viewTypes) {
      expect(parseRequiredViewType(viewType)).toBe(viewType);
    }
  });

  it("rejects missing, empty, repeated, and unknown values with status 400", () => {
    for (const raw of [undefined, "", ["alerts", "map"], "dashboard", 1]) {
      try {
        parseRequiredViewType(raw);
        expect.unreachable(`expected rejection for ${JSON.stringify(raw)}`);
      } catch (error) {
        expect(error).toMatchObject({ statusCode: 400 });
        for (const viewType of useAppConfig().viewTypes) {
          expect((error as Error).message).toContain(viewType);
        }
      }
    }
  });
});
