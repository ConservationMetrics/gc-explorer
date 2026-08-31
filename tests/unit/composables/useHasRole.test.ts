import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ref } from "vue";
import { Role } from "@/types";
import { useHasRole } from "@/composables/useHasRole";

const { useRuntimeConfigMock, useUserSessionMock } = vi.hoisted(() => ({
  useRuntimeConfigMock: vi.fn(),
  useUserSessionMock: vi.fn(),
}));

vi.mock("#imports", () => ({
  useRuntimeConfig: () => useRuntimeConfigMock(),
  useUserSession: () => useUserSessionMock(),
}));

describe("useHasRole", () => {
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
    expect(useHasRole().value).toBe(true);
    expect(useHasRole(Role.Admin).value).toBe(true);
  });

  it.each([
    ["member", Role.Member],
    ["admin", Role.Admin],
  ] as const)("defaults to Member and returns true for a %s user", (_label, userRole) => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole }),
    });
    expect(useHasRole().value).toBe(true);
  });

  it.each([
    ["signed-in", Role.SignedIn],
    ["guest", Role.Guest],
  ] as const)("defaults to Member and returns false for a %s user", (_label, userRole) => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole }),
    });
    expect(useHasRole().value).toBe(false);
  });

  it("checks custom minRole correctly", () => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole: Role.Guest }),
    });
    expect(useHasRole(Role.Guest).value).toBe(true);
    expect(useHasRole(Role.Member).value).toBe(false);
    expect(useHasRole(Role.Admin).value).toBe(false);
  });

  it("returns false when the user is logged out", () => {
    expect(useHasRole().value).toBe(false);
  });

  it("returns false when the user is logged in without a user record", () => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref(null),
    });
    expect(useHasRole().value).toBe(false);
  });

  it("returns false when an authenticated user has no role", () => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({}),
    });
    expect(useHasRole().value).toBe(false);
  });

  it("returns false in CI when the user is logged out", () => {
    vi.stubEnv("CI", "true");
    expect(useHasRole().value).toBe(false);
  });
});
