import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ref } from "vue";
import { Role } from "@/types";
import { useCanAccessIncidents } from "@/composables/useCanAccessIncidents";

const { useRuntimeConfigMock, useUserSessionMock } = vi.hoisted(() => ({
  useRuntimeConfigMock: vi.fn(),
  useUserSessionMock: vi.fn(),
}));

vi.mock("#imports", () => ({
  useRuntimeConfig: () => useRuntimeConfigMock(),
  useUserSession: () => useUserSessionMock(),
}));

describe("useCanAccessIncidents", () => {
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

  it("returns true when authStrategy is none", () => {
    useRuntimeConfigMock.mockReturnValue({
      public: { authStrategy: "none" },
    });
    expect(useCanAccessIncidents().value).toBe(true);
  });

  it.each([
    ["member", Role.Member],
    ["admin", Role.Admin],
  ] as const)("returns true for a %s user", (_label, userRole) => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole }),
    });
    expect(useCanAccessIncidents().value).toBe(true);
  });

  it.each([
    ["signed-in", Role.SignedIn],
    ["guest", Role.Guest],
  ] as const)("returns false for a %s user", (_label, userRole) => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole }),
    });
    expect(useCanAccessIncidents().value).toBe(false);
  });

  it("returns false when the user is logged out", () => {
    expect(useCanAccessIncidents().value).toBe(false);
  });

  it("returns false when the user is logged in without a user record", () => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref(null),
    });
    expect(useCanAccessIncidents().value).toBe(false);
  });

  it("returns false when an authenticated user has no role", () => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({}),
    });
    expect(useCanAccessIncidents().value).toBe(false);
  });

  it("returns false in CI when the user is logged out", () => {
    vi.stubEnv("CI", "true");
    expect(useCanAccessIncidents().value).toBe(false);
  });
});
