import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref, computed, watch, onMounted, nextTick } from "vue";
import ConfigCard from "@/components/config/ConfigCard.vue";
import ConfigMedia from "@/components/config/ConfigMedia.vue";
import type { ViewConfig } from "@/types";

Object.assign(globalThis, {
  ref,
  computed,
  watch,
  onMounted,
  nextTick,
});

vi.mock("@/utils/mediaHelpers", () => ({
  extractShareId: vi.fn((input: string) => {
    if (!input || !input.trim()) return "";
    try {
      const u = new URL(input);
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = Math.max(parts.indexOf("share"), parts.indexOf("dl"));
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    } catch {
      /* not a URL */
    }
    return input.trim();
  }),
  deriveFilesOrigin: vi.fn(() => "https://files.demo.guardianconnector.net"),
  buildFilebrowserBase: vi.fn(
    (origin: string) => `${origin.replace(/\/+$/, "")}/api/public/dl/`,
  ),
  getBaseUrlFromInput: vi.fn((_input: string, defaultBaseUrl: string) => {
    return defaultBaseUrl;
  }),
  isValidFilebrowserInput: vi.fn(() => true),
}));

vi.mock("@/utils/identifierUtils", () => ({
  toCamelCase: (value: string) => value,
}));

Object.defineProperty(window, "location", {
  value: { hostname: "explorer.demo.guardianconnector.net" },
  writable: true,
});

const savedMediaConfig = {
  MEDIA_BASE_PATH:
    "https://files.demo.guardianconnector.net/api/public/dl/saved-share",
  MEDIA_COLUMN: "photos",
  DATASET_TABLE: "Test Gallery",
  ROUTE_LEVEL_PERMISSION: "member",
} as ViewConfig;

const mountConfigCard = () =>
  mount(ConfigCard, {
    props: {
      tableName: "test_table",
      viewType: "gallery",
      viewConfig: savedMediaConfig,
      configToCopy: null,
    },
    global: {
      components: {
        ConfigMedia,
      },
      stubs: {
        ConfigViews: true,
        ConfigMap: true,
        ConfigAlerts: true,
        ConfigFilters: true,
        ConfigDatasetInfo: true,
        ConfigPermissions: {
          template: "<div />",
          emits: ["updateConfig", "updateValidation"],
        },
        ConfigCollapsibleSection: {
          template: "<div><slot /></div>",
        },
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });

describe("ConfigCard media initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("populates ConfigMedia share input from saved viewConfig after card mount", async () => {
    const wrapper = mountConfigCard();

    await flushPromises();
    await nextTick();
    await nextTick();

    const shareInput = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-basePath"]',
    );
    expect(shareInput.exists()).toBe(true);
    expect(shareInput.element.value).toBe("saved-share");
  });

  it("keeps saved media values when submitting without editing media", async () => {
    const wrapper = mountConfigCard();

    await flushPromises();
    await nextTick();
    await nextTick();

    const cardVm = wrapper.vm as unknown as {
      localConfig: ViewConfig;
      handleSubmit: () => void;
    };
    cardVm.localConfig.DATASET_TABLE = "Test Gallery Updated";
    await nextTick();

    cardVm.handleSubmit();
    await nextTick();

    const submits = wrapper.emitted("submitConfig");
    expect(submits).toBeTruthy();
    const payload = submits![0][0] as {
      config: ViewConfig;
      tableName: string;
    };
    expect(payload.config.MEDIA_BASE_PATH).toBe(
      savedMediaConfig.MEDIA_BASE_PATH,
    );
    expect(payload.config.MEDIA_COLUMN).toBe("photos");
  });
});
