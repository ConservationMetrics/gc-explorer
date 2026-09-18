import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ref } from "vue";

import {
  COPY_ALERT_LINK_EXCLUDE_PARAMS,
  COPY_INCIDENT_LINK_EXCLUDE_PARAMS,
  useCopyLink,
  useCopyMapLocation,
} from "@/composables/useCopyLink";

Object.assign(globalThis, { ref });

const pageUrl =
  "http://localhost:8080/alerts/fake_alerts?alertId=a1&incidentId=i1&lat=1.00000&lng=2.00000&zoom=3.00";

describe("useCopyLink", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("location", { href: pageUrl });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("omits camera params from an alert copy URL", async () => {
    const { copyLink } = useCopyLink(COPY_ALERT_LINK_EXCLUDE_PARAMS);
    await copyLink();
    expect(writeText).toHaveBeenCalledWith(
      "http://localhost:8080/alerts/fake_alerts?alertId=a1",
    );
  });

  it("omits camera params from an incident copy URL", async () => {
    const { copyLink } = useCopyLink(COPY_INCIDENT_LINK_EXCLUDE_PARAMS);
    await copyLink();
    expect(writeText).toHaveBeenCalledWith(
      "http://localhost:8080/alerts/fake_alerts?incidentId=i1",
    );
  });
});

describe("useCopyMapLocation", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("location", { href: pageUrl });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("copies the current camera and strips feature ids", async () => {
    const map = ref({
      getCenter: () => ({ lat: -3.12, lng: -60.02 }),
      getZoom: () => 11.5,
    });
    const { copyLocation } = useCopyMapLocation(map as never);
    await copyLocation();
    expect(writeText).toHaveBeenCalledWith(
      "http://localhost:8080/alerts/fake_alerts?lat=-3.12000&lng=-60.02000&zoom=11.50",
    );
  });
});
