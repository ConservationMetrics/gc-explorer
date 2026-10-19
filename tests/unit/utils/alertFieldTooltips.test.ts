import { describe, expect, it } from "vitest";

import {
  alertFieldTooltipKey,
  normalizeTierValidation,
} from "@/utils/alertFieldTooltips";

describe("alertFieldTooltipKey", () => {
  it("resolves confidence copy from the provider and alert type", () => {
    expect(
      alertFieldTooltipKey("confidenceLevel", {
        alertType: "nasa viirs fire alerts",
        dataProvider: "Global Forest Watch",
      }),
    ).toBe("confidenceLevelNasaVIIRSFireAlerts");

    expect(
      alertFieldTooltipKey("confidenceLevel", {
        alertType: "gold mining",
        dataProvider: "Terras",
      }),
    ).toBe("confidenceLevelTerrasImazonGoldMining");

    expect(
      alertFieldTooltipKey("confidenceLevel", {
        alertType: "gold mining",
        dataProvider: "Other",
      }),
    ).toBeUndefined();
  });

  it("resolves tiers 1, 2, 3, and 4", () => {
    expect(alertFieldTooltipKey("tierValidation", { value: "1" })).toBe(
      "tierValidation1",
    );
    expect(alertFieldTooltipKey("tierValidation", { value: "2" })).toBe(
      "tierValidation2",
    );
    expect(alertFieldTooltipKey("tierValidation", { value: "3" })).toBe(
      "tierValidation3",
    );
    expect(alertFieldTooltipKey("tierValidation", { value: "4" })).toBe(
      "tierValidation4",
    );
    expect(
      alertFieldTooltipKey("tierValidation", { value: "3A" }),
    ).toBeUndefined();
  });
});

describe("normalizeTierValidation", () => {
  it("canonicalizes numeric tiers", () => {
    expect(normalizeTierValidation("1.0")).toBe("1");
    expect(normalizeTierValidation(2)).toBe("2");
    expect(normalizeTierValidation("3.0")).toBe("3");
  });
});
