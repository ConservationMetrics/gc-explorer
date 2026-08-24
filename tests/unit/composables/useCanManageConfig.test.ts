import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ref } from "vue";
import { Role } from "@/types";
import { useCanManageConfig } from "@/composables/useCanManageConfig";

const { useRuntimeConfigMock, useUserSessionMock } = vi.hoisted(() => ({
  useRuntimeConfigMock: vi.fn(),
  useUserSessionMock: vi.fn(),
}));

vi.mock("#imports", () => ({
  useRuntimeConfig: () => useRuntimeConfigMock(),
  useUserSession: () => useUserSessionMock(),
}));

describe("useCanManageConfig", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("CI", "");
    useRuntimeConfigMock.mockReturnValue({
      public: { authStrategy: "auth0" },
    });
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(false),
      user: ref(null),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true in CI", () => {
    vi.stubEnv("CI", "true");
    expect(useCanManageConfig().value).toBe(true);
  });

  it("returns true when authStrategy is none", () => {
    useRuntimeConfigMock.mockReturnValue({
      public: { authStrategy: "none" },
    });
    expect(useCanManageConfig().value).toBe(true);
  });

  it("returns true for an authenticated admin", () => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole: Role.Admin }),
    });
    expect(useCanManageConfig().value).toBe(true);
  });

  it.each([
    ["signed-in", Role.SignedIn],
    ["guest", Role.Guest],
    ["member", Role.Member],
  ] as const)("returns false for a %s user", (_label, userRole) => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole }),
    });
    expect(useCanManageConfig().value).toBe(false);
  });

  it("returns false when the user is logged out", () => {
    expect(useCanManageConfig().value).toBe(false);
  });
});
