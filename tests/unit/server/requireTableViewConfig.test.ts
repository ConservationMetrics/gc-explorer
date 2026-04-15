import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/database/dbOperations", () => ({
  fetchTableNames: vi.fn(),
}));

import { requireTableViewConfig } from "@/server/utils";

describe("requireTableViewConfig", () => {
  it("returns the table config when present", () => {
    const config = requireTableViewConfig(
      {
        gfw_alerts: {
          VIEWS: "alerts",
          ROUTE_LEVEL_PERMISSION: "member",
        },
      },
      "gfw_alerts",
    );

    expect(config.VIEWS).toBe("alerts");
    expect(config.ROUTE_LEVEL_PERMISSION).toBe("member");
  });

  it("throws a 404 when config is missing", () => {
    expect(() => requireTableViewConfig({}, "gfw_alerts")).toThrowError(
      /No view configuration found/,
    );
  });
});
