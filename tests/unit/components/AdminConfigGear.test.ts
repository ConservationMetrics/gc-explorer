import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref } from "vue";
import { Role } from "@/types";
import AdminConfigGear from "@/components/shared/AdminConfigGear.vue";

const { useRuntimeConfigMock, useUserSessionMock } = vi.hoisted(() => ({
  useRuntimeConfigMock: vi.fn(),
  useUserSessionMock: vi.fn(),
}));

vi.mock("#imports", () => ({
  useRuntimeConfig: () => useRuntimeConfigMock(),
  useUserSession: () => useUserSessionMock(),
}));

Object.assign(globalThis, { computed, ref });

const nuxtLinkStub = {
  props: ["to", "target", "rel"],
  template:
    '<a :href="to.path + \'?view_type=\' + to.query.view_type" :target="target" :rel="rel" v-bind="$attrs"><slot /></a>',
};

const mountGear = (viewType: "gallery" | "map" | "alerts" = "gallery") =>
  mount(AdminConfigGear, {
    props: { tableName: "bcmform_responses", viewType },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: { NuxtLink: nuxtLinkStub },
    },
  });

describe("AdminConfigGear", () => {
  beforeEach(() => {
    vi.stubEnv("CI", "");
    useRuntimeConfigMock.mockReturnValue({
      public: { authStrategy: "auth0" },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows for an authenticated admin and links to config in a new tab", () => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole: Role.Admin }),
    });

    const wrapper = mountGear();
    const link = wrapper.get('[data-testid="admin-config-gear"]');
    expect(link.attributes("href")).toBe(
      "/config/bcmform_responses?view_type=gallery",
    );
    expect(link.attributes("target")).toBe("_blank");
    expect(link.attributes("rel")).toBe("noopener noreferrer");
    expect(link.attributes("aria-label")).toBe("accessConfig");
    expect(link.attributes("title")).toBe("accessConfig");
  });

  it.each([
    ["signed-in", Role.SignedIn],
    ["guest", Role.Guest],
    ["member", Role.Member],
  ] as const)("hides for a %s user", (_label, userRole) => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(true),
      user: ref({ userRole }),
    });

    const wrapper = mountGear("map");
    expect(wrapper.find('[data-testid="admin-config-gear"]').exists()).toBe(
      false,
    );
  });

  it("hides when the user is logged out", () => {
    useUserSessionMock.mockReturnValue({
      loggedIn: ref(false),
      user: ref(null),
    });

    const wrapper = mountGear("alerts");
    expect(wrapper.find('[data-testid="admin-config-gear"]').exists()).toBe(
      false,
    );
  });
});
