import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import {
  computed,
  defineComponent,
  h,
  onMounted,
  ref,
  Suspense,
  watch,
} from "vue";

const useFetchMock = vi.fn();
const useRuntimeConfigMock = vi.fn();
const useUserSessionMock = vi.fn();
const useToastMock = vi.fn();
const useI18nMock = vi.fn();
const useRouteMock = vi.fn();
const useRouterMock = vi.fn();

Object.assign(globalThis, {
  ref,
  computed,
  watch,
  onMounted,
  useFetch: (...args: unknown[]) => useFetchMock(...args),
  useRuntimeConfig: () => useRuntimeConfigMock(),
  useUserSession: () => useUserSessionMock(),
  useToast: () => useToastMock(),
  useI18n: () => useI18nMock(),
  useRoute: () => useRouteMock(),
  useRouter: () => useRouterMock(),
  useHead: vi.fn(),
  definePageMeta: vi.fn(),
});

vi.mock("#imports", () => ({
  useFetch: (...args: unknown[]) => useFetchMock(...args),
  useRuntimeConfig: () => useRuntimeConfigMock(),
  useUserSession: () => useUserSessionMock(),
  useToast: () => useToastMock(),
  useI18n: () => useI18nMock(),
  useRoute: () => useRouteMock(),
  useRouter: () => useRouterMock(),
  useHead: vi.fn(),
  definePageMeta: vi.fn(),
}));

vi.mock("lucide-vue-next", () => ({
  Plus: {
    name: "Plus",
    template: "<svg data-testid='plus-icon' />",
  },
}));

const mountIndex = async () => {
  // Dynamic import so Nuxt auto-import mocks on globalThis are registered first.
  const { default: IndexPage } = await import("@/pages/index.vue");

  const Wrapper = defineComponent({
    setup() {
      return () =>
        h(Suspense, null, {
          default: () => h(IndexPage),
          fallback: () => h("div", { "data-testid": "suspense-fallback" }),
        });
    },
  });

  const wrapper = mount(Wrapper, {
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      stubs: {
        DataLoadError: true,
        EmptyStateIllustration: {
          props: ["variant"],
          template: '<div data-testid="empty-illustration">{{ variant }}</div>',
        },
        SearchBar: true,
        ViewTypeFilter: {
          template: '<div data-testid="view-type-filter" />',
        },
        DatasetCard: true,
      },
    },
  });

  await flushPromises();
  return wrapper;
};

describe("index page empty state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Page always shows the config link when CI is set; clear it so role checks apply.
    vi.stubEnv("CI", "");

    useRuntimeConfigMock.mockReturnValue({
      public: { authStrategy: "none" },
    });
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole: 3 }),
    });
    useToastMock.mockReturnValue({
      error: vi.fn(),
      info: vi.fn(),
    });
    useI18nMock.mockReturnValue({
      t: (key: string) => key,
    });
    useRouteMock.mockReturnValue({
      query: {},
      path: "/",
    });
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows add new dataset view button when there are no views", async () => {
    useFetchMock.mockResolvedValue({
      data: ref({ views: [], availableTables: [] }),
      error: ref(null),
      refresh: vi.fn(),
    });

    const wrapper = await mountIndex();

    expect(wrapper.text()).toContain("noDatasetViewsAvailable");
    expect(wrapper.find("[data-testid='view-type-filter']").exists()).toBe(
      false,
    );

    const addButton = wrapper.get(
      "[data-testid='add-new-dataset-view-button']",
    );
    expect(addButton.attributes("href")).toBe("/config/new");
  });

  it("hides add button in empty state when user cannot manage config", async () => {
    useRuntimeConfigMock.mockReturnValue({
      public: { authStrategy: "auth0" },
    });
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole: 0 }),
    });
    useFetchMock.mockResolvedValue({
      data: ref({ views: [], availableTables: [] }),
      error: ref(null),
      refresh: vi.fn(),
    });

    const wrapper = await mountIndex();

    expect(wrapper.text()).toContain("noDatasetViewsAvailable");
    expect(
      wrapper.find("[data-testid='add-new-dataset-view-button']").exists(),
    ).toBe(false);
  });
});
