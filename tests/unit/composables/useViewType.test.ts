import { describe, it, expect } from "vitest";

import { resolveViewTypeForTable } from "@/composables/useViewType";

// resolveViewTypeForTable decides whether a data request should carry a
// view_type, and which one. It encodes two deliberate guards that this suite
// pins down: (1) only the route's OWN dataset gets the route's view type, and
// (2) the first path segment is whitelisted, never returned raw. Deleting
// either guard must break a test here.
describe("resolveViewTypeForTable", () => {
  it("returns the view type for the route's own dataset on each view route", () => {
    expect(
      resolveViewTypeForTable(
        { path: "/map/springfield", params: { tablename: "springfield" } },
        "springfield",
      ),
    ).toBe("map");

    expect(
      resolveViewTypeForTable(
        { path: "/gallery/springfield", params: { tablename: "springfield" } },
        "springfield",
      ),
    ).toBe("gallery");

    expect(
      resolveViewTypeForTable(
        { path: "/alerts/springfield", params: { tablename: "springfield" } },
        "springfield",
      ),
    ).toBe("alerts");
  });

  it("returns undefined for a cross-table read (secondary Mapeo table) on an alerts page", () => {
    // The alerts page reads records from its secondary Mapeo table, which has
    // no alerts view of its own; attaching view_type=alerts would make the
    // server look up a non-existent (mapeo_data, alerts) row and fail.
    expect(
      resolveViewTypeForTable(
        { path: "/alerts/springfield", params: { tablename: "springfield" } },
        "mapeo_data",
      ),
    ).toBeUndefined();
  });

  it("returns undefined on a non-view route whose first segment is a real word", () => {
    // /dataset/:table passes the own-dataset guard (table matches) but is not a
    // view route; the whitelist must keep "dataset" from leaking as a view type.
    expect(
      resolveViewTypeForTable(
        { path: "/dataset/springfield", params: { tablename: "springfield" } },
        "springfield",
      ),
    ).toBeUndefined();
  });

  it("returns undefined when the route has no tablename param", () => {
    expect(
      resolveViewTypeForTable(
        { path: "/map/springfield", params: {} },
        "springfield",
      ),
    ).toBeUndefined();
  });

  it("returns undefined for the root route", () => {
    expect(
      resolveViewTypeForTable({ path: "/", params: {} }, "springfield"),
    ).toBeUndefined();
  });
});
