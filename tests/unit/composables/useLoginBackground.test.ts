import { describe, it, expect, vi, beforeEach } from "vitest";

import { useLoginBackground } from "@/composables/useLoginBackground";

const { useFetchMock } = vi.hoisted(() => ({
  useFetchMock: vi.fn(),
}));

vi.mock("#imports", () => ({
  useFetch: (...args: unknown[]) => useFetchMock(...args),
}));

describe("useLoginBackground", () => {
  beforeEach(() => {
    useFetchMock.mockReturnValue({
      data: { value: { backgroundImage: "" } },
    });
  });

  it("falls back to /background.jpg when the setting is empty", () => {
    expect(useLoginBackground().backgroundImage.value).toBe("/background.jpg");
  });

  it("uses gc_settings.background_image when set", () => {
    useFetchMock.mockReturnValue({
      data: { value: { backgroundImage: "https://cdn.example/bg.jpg" } },
    });
    expect(useLoginBackground().backgroundImage.value).toBe(
      "https://cdn.example/bg.jpg",
    );
  });
});
