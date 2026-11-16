import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/composables/auth/useAuth";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("#imports", () => ({
  useRouter: () => ({ currentRoute: { value: { query: {} } }, push }),
  useLocalePath: () => (path: string) => path,
}));

vi.mock("@/utils/authRedirect", () => ({ safeAuthRedirect: vi.fn() }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("OAuth login callback", () => {
  it("preserves code and state encoding without injecting extra parameters", () => {
    const code = "code+value&extra=ignored";
    const state = "state+/=&value";
    const location = {
      search: `?${new URLSearchParams({ code, state })}`,
      href: "",
    };
    vi.stubGlobal("window", { location });

    // Existing sessions must not trigger another navigation after the callback.
    useAuth({ value: true });

    const callback = new URL(location.href, "https://workspace.invalid");
    expect(callback.pathname).toBe("/api/auth/auth0");
    expect([...callback.searchParams]).toEqual([
      ["code", code],
      ["state", state],
    ]);
    expect(push).not.toHaveBeenCalled();
  });

  it("forwards missing state unchanged so the server can reject it", () => {
    const location = { search: "?code=dummy", href: "" };
    vi.stubGlobal("window", { location });

    useAuth({ value: false });

    const callback = new URL(location.href, "https://workspace.invalid");
    expect(callback.searchParams.get("code")).toBe("dummy");
    expect(callback.searchParams.has("state")).toBe(false);
  });
});
