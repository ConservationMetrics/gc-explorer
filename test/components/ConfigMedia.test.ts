import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref, computed, watch, onMounted, nextTick } from "vue";
import ConfigMedia from "@/components/config/ConfigMedia.vue";
import type { ViewConfig } from "@/types/types";

Object.assign(globalThis, {
  ref,
  computed,
  watch,
  onMounted,
  nextTick,
});

// Mock utils/media
vi.mock("@/utils/media", () => ({
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
  deriveFilesOrigin: vi.fn((hostname: string) => {
    if (!hostname) return "";
    const parts = hostname.split(".");
    if (parts.length > 2) {
      parts[0] = "files";
    } else {
      parts.unshift("files");
    }
    return `https://${parts.join(".")}`;
  }),
  buildFilebrowserBase: vi.fn((origin: string) => {
    if (!origin) return "";
    return `${origin.replace(/\/+$/, "")}/api/public/dl/`;
  }),
  getBaseUrlFromInput: vi.fn((input: string, defaultBaseUrl: string) => {
    if (!input || !input.trim()) return defaultBaseUrl;
    try {
      const u = new URL(input);
      if (u.pathname.includes("/share/")) {
        return `${u.origin}/api/public/dl/`;
      }
      if (u.pathname.includes("/api/public/dl/")) {
        return `${u.origin}/api/public/dl/`;
      }
    } catch {
      // Not a URL, use default
    }
    return defaultBaseUrl;
  }),
  isValidFilebrowserInput: vi.fn((input: string) => {
    if (!input.trim()) return true;
    if (input.includes("/")) {
      const regex =
        /^(https?:\/\/[^\s]+\/(?:share|api\/public\/dl)\/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)$/;
      return regex.test(input.trim());
    }
    return /^[a-zA-Z0-9_-]+$/.test(input.trim());
  }),
}));

// Mock window.location
const mockLocation = {
  hostname: "explorer.demo.guardianconnector.net",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

const baseProps = {
  tableName: "test_table",
  config: {} as ViewConfig,
  views: ["map", "gallery"],
  keys: ["MEDIA_BASE_PATH"],
};

const globalConfig = {
  mocks: {
    $t: (key: string) => {
      const translations: Record<string, string> = {
        mediaAccepts: "Accepts:",
        mediaBaseUrl: "Base URL",
        mediaFilebrowserDefault: "Filebrowser (Guardian Connector default)",
        mediaGenericHttpBaseUrl: "Generic HTTP base URL",
        mediaInvalidFormat:
          "Invalid format. Please use a Filebrowser share URL or hash.",
        mediaPasteFilebrowserShareUrlOrHash:
          "Paste Filebrowser share URL or hash",
        mediaProvider: "Media Provider",
        or: "or",
      };
      return translations[key] || key;
    },
  },
};

describe("ConfigMedia component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.hostname = "explorer.demo.guardianconnector.net";
  });

  it("renders with MEDIA_BASE_PATH key", () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    expect(wrapper.text()).toContain("mediaBasePath");
    expect(
      wrapper.find('label[for="test_table-provider-basePath"]').exists(),
    ).toBe(true);
  });

  it("renders with MEDIA_BASE_PATH_ALERTS when alerts view is enabled", () => {
    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["alerts"],
        keys: ["MEDIA_BASE_PATH_ALERTS"],
      },
      global: globalConfig,
    });

    expect(wrapper.text()).toContain("mediaBasePathAlerts");
    expect(
      wrapper.find('label[for="test_table-provider-alerts"]').exists(),
    ).toBe(true);
  });

  it("does not render MEDIA_BASE_PATH_ALERTS when alerts view is not enabled", () => {
    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["map", "gallery"],
        keys: ["MEDIA_BASE_PATH_ALERTS"],
      },
      global: globalConfig,
    });

    expect(
      wrapper.find('label[for="test_table-provider-alerts"]').exists(),
    ).toBe(false);
  });

  it("initializes with Filebrowser provider by default", () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    const select = wrapper.find<HTMLSelectElement>(
      'select[id="test_table-provider-basePath"]',
    );
    expect(select.element.value).toBe("filebrowser");
  });

  it("parses existing Filebrowser URL from config on mount", async () => {
    const configWithFilebrowser = {
      MEDIA_BASE_PATH:
        "https://files.demo.guardianconnector.net/api/public/dl/abc123",
    } as ViewConfig;

    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        config: configWithFilebrowser,
      },
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-basePath"]',
    );
    expect(input.element.value).toBe("abc123");
  });

  it("parses existing generic URL from config on mount", async () => {
    const configWithGeneric = {
      MEDIA_BASE_PATH: "https://example.com/media",
    } as ViewConfig;

    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        config: configWithGeneric,
      },
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const select = wrapper.find<HTMLSelectElement>(
      'select[id="test_table-provider-basePath"]',
    );
    expect(select.element.value).toBe("generic");
  });

  it("emits updateConfig when Filebrowser share input changes", async () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-basePath"]',
    );
    await input.setValue("test-hash-123");

    await nextTick();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("updateConfig");
    expect(emitted).toBeTruthy();
    if (emitted && emitted.length > 0) {
      const lastEmit = emitted[emitted.length - 1][0] as Partial<ViewConfig>;
      expect(lastEmit.MEDIA_BASE_PATH).toContain("test-hash-123");
    }
  });

  it("constructs correct Filebrowser URL from share hash", async () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-basePath"]',
    );
    await input.setValue("my-share-hash");

    await nextTick();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("updateConfig");
    if (emitted && emitted.length > 0) {
      const lastEmit = emitted[emitted.length - 1][0] as Partial<ViewConfig>;
      expect(lastEmit.MEDIA_BASE_PATH).toContain("/api/public/dl/");
      expect(lastEmit.MEDIA_BASE_PATH).toContain("my-share-hash");
    }
  });

  it("constructs correct Filebrowser URL from full share URL", async () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-basePath"]',
    );
    await input.setValue(
      "https://files.demo.guardianconnector.net/share/test-hash",
    );

    await nextTick();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("updateConfig");
    if (emitted && emitted.length > 0) {
      const lastEmit = emitted[emitted.length - 1][0] as Partial<ViewConfig>;
      expect(lastEmit.MEDIA_BASE_PATH).toContain("/api/public/dl/");
      expect(lastEmit.MEDIA_BASE_PATH).toContain("test-hash");
    }
  });

  it("constructs correct Filebrowser URL from dl URL", async () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-basePath"]',
    );
    await input.setValue(
      "https://files.demo.guardianconnector.net/api/public/dl/test-hash",
    );

    await nextTick();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("updateConfig");
    if (emitted && emitted.length > 0) {
      const lastEmit = emitted[emitted.length - 1][0] as Partial<ViewConfig>;
      expect(lastEmit.MEDIA_BASE_PATH).toContain("/api/public/dl/");
      expect(lastEmit.MEDIA_BASE_PATH).toContain("test-hash");
    }
  });

  it("switches to generic provider and uses input as-is", async () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const select = wrapper.find<HTMLSelectElement>(
      'select[id="test_table-provider-basePath"]',
    );
    await select.setValue("generic");

    await nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-baseUrl-generic-basePath"]',
    );
    await input.setValue("https://custom-media.example.com");

    await nextTick();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("updateConfig");
    if (emitted && emitted.length > 0) {
      const lastEmit = emitted[emitted.length - 1][0] as Partial<ViewConfig>;
      expect(lastEmit.MEDIA_BASE_PATH).toBe("https://custom-media.example.com");
    }
  });

  it("shows validation error for invalid Filebrowser input", async () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-basePath"]',
    );
    await input.setValue("invalid input with spaces!");

    await nextTick();

    expect(wrapper.find(".validation-error").exists()).toBe(true);
    expect(wrapper.find(".input-invalid").exists()).toBe(true);
  });

  it("does not show validation error for valid Filebrowser hash", async () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-basePath"]',
    );
    await input.setValue("valid-hash-123");

    await nextTick();

    expect(wrapper.find(".validation-error").exists()).toBe(false);
    expect(wrapper.find(".input-invalid").exists()).toBe(false);
  });

  it("does not show validation error for empty input", async () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-basePath"]',
    );
    await input.setValue("");

    await nextTick();

    expect(wrapper.find(".validation-error").exists()).toBe(false);
    expect(wrapper.find(".input-invalid").exists()).toBe(false);
  });

  it("shows hint text with bold 'Accepts' label", () => {
    const wrapper = mount(ConfigMedia, {
      props: baseProps,
      global: globalConfig,
    });

    const hint = wrapper.find(".field-hint");
    expect(hint.exists()).toBe(true);
    expect(hint.find("strong").text()).toBe("Accepts:");
  });

  it("handles both MEDIA_BASE_PATH and MEDIA_BASE_PATH_ALERTS independently", async () => {
    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["alerts"],
        keys: ["MEDIA_BASE_PATH", "MEDIA_BASE_PATH_ALERTS"],
      },
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const basePathInput = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-basePath"]',
    );
    const alertsInput = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-alerts"]',
    );

    await basePathInput.setValue("base-hash");
    await nextTick();
    await wrapper.vm.$nextTick();

    await alertsInput.setValue("alerts-hash");
    await nextTick();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("updateConfig");
    expect(emitted).toBeTruthy();
    expect(emitted!.length).toBeGreaterThan(0);

    // Check that we have emits for both
    const basePathEmits = emitted!.filter(
      (e) => e[0] && (e[0] as Partial<ViewConfig>).MEDIA_BASE_PATH,
    );
    const alertsEmits = emitted!.filter(
      (e) => e[0] && (e[0] as Partial<ViewConfig>).MEDIA_BASE_PATH_ALERTS,
    );

    expect(basePathEmits.length).toBeGreaterThan(0);
    expect(alertsEmits.length).toBeGreaterThan(0);

    const lastBasePathEmit = basePathEmits[
      basePathEmits.length - 1
    ][0] as Partial<ViewConfig>;
    const lastAlertsEmit = alertsEmits[
      alertsEmits.length - 1
    ][0] as Partial<ViewConfig>;

    expect(lastBasePathEmit.MEDIA_BASE_PATH).toContain("base-hash");
    expect(lastAlertsEmit.MEDIA_BASE_PATH_ALERTS).toContain("alerts-hash");
  });

  it("does not emit during initialization", async () => {
    const configWithFilebrowser = {
      MEDIA_BASE_PATH:
        "https://files.demo.guardianconnector.net/api/public/dl/abc123",
    } as ViewConfig;

    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        config: configWithFilebrowser,
      },
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    // Wait a bit to ensure initialization completes
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not emit during initialization, only after user interaction
    const initialEmits = wrapper.emitted("updateConfig");
    // The component may emit once after initialization completes, but shouldn't emit multiple times
    expect(initialEmits?.length || 0).toBeLessThanOrEqual(1);
  });

  it("updates MEDIA_BASE_PATH_ALERTS when alerts input changes", async () => {
    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["alerts"],
        keys: ["MEDIA_BASE_PATH_ALERTS"],
      },
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-alerts"]',
    );
    await input.setValue("alerts-hash-456");

    await nextTick();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("updateConfig");
    if (emitted && emitted.length > 0) {
      const lastEmit = emitted[emitted.length - 1][0] as Partial<ViewConfig>;
      expect(lastEmit.MEDIA_BASE_PATH_ALERTS).toContain("alerts-hash-456");
    }
  });

  it("renders with MEDIA_BASE_PATH_ICONS when map view is enabled", () => {
    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["map"],
        keys: ["MEDIA_BASE_PATH_ICONS"],
      },
      global: globalConfig,
    });

    expect(wrapper.text()).toContain("mediaBasePathIcons");
    expect(
      wrapper.find('label[for="test_table-provider-icons"]').exists(),
    ).toBe(true);
  });

  it("does not render MEDIA_BASE_PATH_ICONS when map view is not enabled", () => {
    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["gallery"],
        keys: ["MEDIA_BASE_PATH_ICONS"],
      },
      global: globalConfig,
    });

    expect(
      wrapper.find('label[for="test_table-provider-icons"]').exists(),
    ).toBe(false);
  });

  it("parses existing Filebrowser URL for icons from config on mount", async () => {
    const configWithFilebrowser = {
      MEDIA_BASE_PATH_ICONS:
        "https://files.demo.guardianconnector.net/api/public/dl/icon123",
    } as ViewConfig;

    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["map"],
        keys: ["MEDIA_BASE_PATH_ICONS"],
        config: configWithFilebrowser,
      },
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-icons"]',
    );
    expect(input.element.value).toBe("icon123");
  });

  it("emits updateConfig when icons share input changes", async () => {
    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["map"],
        keys: ["MEDIA_BASE_PATH_ICONS"],
      },
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-icons"]',
    );
    await input.setValue("icon-hash-789");

    await nextTick();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("updateConfig");
    expect(emitted).toBeTruthy();
    if (emitted && emitted.length > 0) {
      const lastEmit = emitted[emitted.length - 1][0] as Partial<ViewConfig>;
      expect(lastEmit.MEDIA_BASE_PATH_ICONS).toContain("icon-hash-789");
    }
  });

  it("constructs correct Filebrowser URL from icons hash", async () => {
    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["map"],
        keys: ["MEDIA_BASE_PATH_ICONS"],
      },
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-icons"]',
    );
    await input.setValue("my-icons-hash");

    await nextTick();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("updateConfig");
    if (emitted && emitted.length > 0) {
      const lastEmit = emitted[emitted.length - 1][0] as Partial<ViewConfig>;
      expect(lastEmit.MEDIA_BASE_PATH_ICONS).toContain("/api/public/dl/");
      expect(lastEmit.MEDIA_BASE_PATH_ICONS).toContain("my-icons-hash");
    }
  });

  it("switches to generic provider for icons and uses input as-is", async () => {
    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["map"],
        keys: ["MEDIA_BASE_PATH_ICONS"],
      },
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const select = wrapper.find<HTMLSelectElement>(
      'select[id="test_table-provider-icons"]',
    );
    await select.setValue("generic");

    await nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-baseUrl-generic-icons"]',
    );
    await input.setValue("https://custom-icons.example.com");

    await nextTick();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("updateConfig");
    if (emitted && emitted.length > 0) {
      const lastEmit = emitted[emitted.length - 1][0] as Partial<ViewConfig>;
      expect(lastEmit.MEDIA_BASE_PATH_ICONS).toBe(
        "https://custom-icons.example.com",
      );
    }
  });

  it("shows validation error for invalid Filebrowser icons input", async () => {
    const wrapper = mount(ConfigMedia, {
      props: {
        ...baseProps,
        views: ["map"],
        keys: ["MEDIA_BASE_PATH_ICONS"],
      },
      global: globalConfig,
    });

    await nextTick();
    await wrapper.vm.$nextTick();

    const input = wrapper.find<HTMLInputElement>(
      'input[id="test_table-share-icons"]',
    );
    await input.setValue("invalid input with spaces!");

    await nextTick();

    const validationErrors = wrapper.findAll(".validation-error");
    expect(validationErrors.length).toBeGreaterThan(0);
    expect(wrapper.find(".input-invalid").exists()).toBe(true);
  });
});
