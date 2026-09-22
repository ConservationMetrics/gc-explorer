import { beforeEach, describe, expect, it, vi } from "vitest";

type RoutePath = { path: string };

const { useRouterMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
}));

vi.mock("#imports", () => ({
  useRouter: () => useRouterMock(),
}));

describe("useToast", () => {
  let useToast: typeof import("@/composables/toast/useToast").useToast;
  let navigate: (to: string, from: string) => void;

  beforeEach(async () => {
    navigate = () => {
      throw new Error("router hook was not bound");
    };
    useRouterMock.mockReturnValue({
      beforeEach: (hook: (to: RoutePath, from: RoutePath) => void) => {
        navigate = (to, from) => hook({ path: to }, { path: from });
      },
    });
    vi.resetModules();
    const mod = await import("@/composables/toast/useToast");
    useToast = mod.useToast;
  });

  it("shares toast state across callers", () => {
    const first = useToast();
    first.warning(
      "Partial results",
      "Only the first 10,000 records are shown.",
    );

    expect(useToast().toasts.value).toHaveLength(1);
    expect(useToast().toasts.value[0]?.title).toBe("Partial results");
  });

  it("clears toasts when the route path changes", () => {
    const { toasts, warning } = useToast();
    warning("Partial results", "Only the first 10,000 records are shown.");
    expect(toasts.value).toHaveLength(1);

    navigate("/", "/map/springfield");

    expect(toasts.value).toHaveLength(0);
  });

  it("does not clear toasts when only the query changes", () => {
    const { toasts, info } = useToast();
    info("Page moved", "This page has moved. Please update your bookmarks.");
    expect(toasts.value).toHaveLength(1);

    navigate("/", "/");

    expect(toasts.value).toHaveLength(1);
  });

  it("keeps clearing after a later useToast call (layout remount)", () => {
    const { toasts, warning, error } = useToast();
    warning("Partial results");
    navigate("/", "/map/springfield");
    expect(toasts.value).toHaveLength(0);

    // A second layout's ToastContainer calls useToast again; the router hook
    // must still be the one registered on the first call.
    useToast();
    error("Access denied");
    expect(toasts.value).toHaveLength(1);

    navigate("/alerts/springfield", "/");
    expect(toasts.value).toHaveLength(0);
  });
});
