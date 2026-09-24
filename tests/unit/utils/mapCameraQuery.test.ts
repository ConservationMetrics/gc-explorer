import { describe, expect, it, vi } from "vitest";

import {
  attachMapCameraQuerySync,
  buildMapLocationShareUrl,
  getInitialMapCamera,
  hasMapFeatureIdQuery,
  hasSameMapCameraQuery,
  parseMapCameraQuery,
  serializeMapCameraQuery,
} from "@/utils/mapCameraQuery";

const defaults = { lat: -15, lng: 0, zoom: 2.5 };

describe("parseMapCameraQuery", () => {
  it("parses valid lat, lng, and zoom", () => {
    expect(
      parseMapCameraQuery({ lat: "-3.12", lng: "-60.02", zoom: "11.5" }),
    ).toEqual({ lat: -3.12, lng: -60.02, zoom: 11.5 });
  });

  it("returns null when any camera param is missing or invalid", () => {
    expect(parseMapCameraQuery({ lat: "-3.12", lng: "-60.02" })).toBeNull();
    expect(
      parseMapCameraQuery({ lat: "south", lng: "-60.02", zoom: "11.5" }),
    ).toBeNull();
    expect(
      parseMapCameraQuery({ lat: ["-3.12"], lng: "-60.02", zoom: "11.5" }),
    ).toBeNull();
    expect(
      parseMapCameraQuery({ lat: "91", lng: "-60.02", zoom: "11.5" }),
    ).toBeNull();
    expect(
      parseMapCameraQuery({ lat: "-3.12", lng: "200", zoom: "11.5" }),
    ).toBeNull();
    expect(
      parseMapCameraQuery({ lat: "-3.12", lng: "-60.02", zoom: "30" }),
    ).toBeNull();
  });
});

describe("getInitialMapCamera", () => {
  it("uses camera query params when no feature id is present", () => {
    expect(
      getInitialMapCamera(
        { lat: "-3.12", lng: "-60.02", zoom: "11.5" },
        defaults,
      ),
    ).toEqual({ lat: -3.12, lng: -60.02, zoom: 11.5 });
  });

  it("uses the view default camera when a feature id is present", () => {
    expect(
      getInitialMapCamera(
        {
          alertId: "alert-1",
          lat: "-3.12",
          lng: "-60.02",
          zoom: "11.5",
        },
        defaults,
      ),
    ).toEqual(defaults);
    expect(
      getInitialMapCamera(
        {
          incidentId: "inc-1",
          lat: "-3.12",
          lng: "-60.02",
          zoom: "11.5",
        },
        defaults,
      ),
    ).toEqual(defaults);
    expect(
      getInitialMapCamera(
        {
          secondaryDocId: "doc-1",
          lat: "-3.12",
          lng: "-60.02",
          zoom: "11.5",
        },
        defaults,
      ),
    ).toEqual(defaults);
    expect(
      getInitialMapCamera(
        {
          featureId: "rec-1",
          lat: "-3.12",
          lng: "-60.02",
          zoom: "11.5",
        },
        defaults,
      ),
    ).toEqual(defaults);
  });

  it("uses the view default camera when camera params are incomplete", () => {
    expect(getInitialMapCamera({ lat: "-3.12" }, defaults)).toEqual(defaults);
  });
});

describe("hasMapFeatureIdQuery", () => {
  it("ignores empty feature id strings", () => {
    expect(hasMapFeatureIdQuery({ alertId: "" })).toBe(false);
    expect(hasMapFeatureIdQuery({ alertId: "alert-1" })).toBe(true);
  });
});

describe("serializeMapCameraQuery and hasSameMapCameraQuery", () => {
  it("rounds camera values to stable query strings", () => {
    expect(
      serializeMapCameraQuery({ lat: -3.123456, lng: -60.024999, zoom: 11.49 }),
    ).toEqual({
      lat: "-3.12346",
      lng: "-60.02500",
      zoom: "11.49",
    });
  });

  it("detects when the query already matches the camera", () => {
    const camera = { lat: -3.12, lng: -60.02, zoom: 11.5 };
    const serialized = serializeMapCameraQuery(camera);
    expect(hasSameMapCameraQuery(serialized, camera)).toBe(true);
    expect(
      hasSameMapCameraQuery({ ...serialized, lat: "-3.00000" }, camera),
    ).toBe(false);
  });
});

describe("buildMapLocationShareUrl", () => {
  it("sets camera params and removes feature ids", () => {
    const href =
      "http://localhost:8080/alerts/fake_alerts?alertId=a1&incidentId=i1&secondaryDocId=s1&mapeoDocId=m1&featureId=rec-1&lat=1.00000&lng=2.00000&zoom=3.00";
    expect(
      buildMapLocationShareUrl(href, {
        lat: -3.12,
        lng: -60.02,
        zoom: 11.5,
      }),
    ).toBe(
      "http://localhost:8080/alerts/fake_alerts?lat=-3.12000&lng=-60.02000&zoom=11.50",
    );
  });
});

describe("attachMapCameraQuerySync", () => {
  it("replaces the query when the camera differs", () => {
    let moveEnd: (() => void) | undefined;
    const map = {
      on: (event: string, callback: () => void) => {
        if (event === "moveend") {
          moveEnd = callback;
        }
      },
      getCenter: () => ({ lat: -3.12, lng: -60.02 }),
      getZoom: () => 11.5,
    };
    const route = { query: {} };
    const router = { replace: vi.fn() };

    attachMapCameraQuerySync(map as never, route as never, router as never);
    moveEnd?.();

    expect(router.replace).toHaveBeenCalledWith({
      query: {
        lat: "-3.12000",
        lng: "-60.02000",
        zoom: "11.50",
      },
    });
  });

  it("does not replace the query when the camera already matches", () => {
    let moveEnd: (() => void) | undefined;
    const map = {
      on: (event: string, callback: () => void) => {
        if (event === "moveend") {
          moveEnd = callback;
        }
      },
      getCenter: () => ({ lat: -3.12, lng: -60.02 }),
      getZoom: () => 11.5,
    };
    const route = {
      query: { lat: "-3.12000", lng: "-60.02000", zoom: "11.50" },
    };
    const router = { replace: vi.fn() };

    attachMapCameraQuerySync(map as never, route as never, router as never);
    moveEnd?.();

    expect(router.replace).not.toHaveBeenCalled();
  });
});
