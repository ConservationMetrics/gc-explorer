import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, onMounted, ref, watch } from "vue";
import ConfigMap from "@/components/config/ConfigMap.vue";
import ConfigMapPreview from "@/components/config/ConfigMapPreview.vue";
import en from "@/i18n/locales/en.json";
import type { ViewConfig } from "@/types";

const mapbox = vi.hoisted(() => ({
  handlers: {} as Record<string, () => void | Promise<void>>,
  center: [10, 20],
  zoom: 3,
  pitch: 4,
  bearing: 5,
  create: vi.fn(),
  jumpTo: vi.fn(),
  remove: vi.fn(),
  resize: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("mapbox-gl", () => ({
  default: {
    Map: class {
      constructor(options: {
        center: number[];
        zoom: number;
        pitch: number;
        bearing: number;
      }) {
        mapbox.create(options);
        mapbox.center = options.center;
        mapbox.zoom = options.zoom;
        mapbox.pitch = options.pitch;
        mapbox.bearing = options.bearing;
      }
      on(event: string, callback: () => void) {
        mapbox.handlers[event] = callback;
      }
      addControl() {}
      getCenter() {
        return {
          wrap: () => ({
            lng: ((((mapbox.center[0] + 180) % 360) + 360) % 360) - 180,
            lat: mapbox.center[1],
          }),
        };
      }
      getZoom() {
        return mapbox.zoom;
      }
      getPitch() {
        return mapbox.pitch;
      }
      getBearing() {
        return mapbox.bearing;
      }
      jumpTo = mapbox.jumpTo;
      remove = mapbox.remove;
      resize = mapbox.resize;
    },
    NavigationControl: vi.fn(),
  },
}));
vi.mock("@vojtechlanka/vue-tags-input", () => ({
  VueTagsInput: { template: "<div></div>" },
}));
vi.mock("vue-3-slider-component", () => ({
  default: { template: "<div></div>" },
}));
vi.mock("@/composables/useTags", () => ({
  updateTags: () => ({ tags: {}, handleTagsChanged: vi.fn() }),
}));

Object.assign(globalThis, { computed, ref, watch, onMounted });

const background = {
  name: "Test background",
  style: "mapbox://styles/mapbox/streets-v12",
  access_token: "pk.eyTest",
};
const config: ViewConfig = {
  MAPBOX_BASEMAPS: JSON.stringify([background]),
  MAPBOX_CENTER_LONGITUDE: "10",
  MAPBOX_CENTER_LATITUDE: "20",
  MAPBOX_ZOOM: 3,
  MAPBOX_PITCH: 4,
  MAPBOX_BEARING: 5,
};
const previewProps = {
  config,
  mapboxStyle: background.style,
  accessToken: background.access_token,
};
const globalOptions = {
  mocks: { $t: (key: string) => key },
  stubs: { "i18n-t": true },
};

beforeEach(() => {
  vi.clearAllMocks();
  mapbox.handlers = {};
  mapbox.jumpTo.mockImplementation(
    (camera: {
      center: number[];
      zoom: number;
      pitch: number;
      bearing: number;
    }) => {
      mapbox.center = camera.center;
      mapbox.zoom = camera.zoom;
      mapbox.pitch = camera.pitch;
      mapbox.bearing = camera.bearing;
      void mapbox.handlers.move();
    },
  );
  mapbox.resize.mockImplementation(() => {
    void mapbox.handlers.move();
  });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect = mapbox.disconnect;
    },
  );
});

describe("ConfigMapPreview", () => {
  it("loads the saved camera and remains hidden until its background loads", async () => {
    const wrapper = mount(ConfigMapPreview, {
      props: previewProps,
      attachTo: document.body,
    });
    expect(mapbox.create).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [10, 20],
        zoom: 3,
        pitch: 4,
        bearing: 5,
        style: background.style,
        accessToken: background.access_token,
      }),
    );
    expect(wrapper.isVisible()).toBe(false);
    const pin = wrapper.get('[data-testid="config-map-center-pin"]');
    expect(pin.isVisible()).toBe(false);
    await mapbox.handlers.load();
    expect(wrapper.isVisible()).toBe(true);
    expect(pin.isVisible()).toBe(true);
    expect(wrapper.emitted("updateConfig")).toBeUndefined();
    wrapper.unmount();
  });

  it("synchronizes map gestures and all manual fields through the parent configuration", async () => {
    const wrapper = mount(ConfigMap, {
      props: {
        config,
        tableName: "test",
        views: ["map"],
        keys: Object.keys(config),
        onUpdateConfig: (patch: Partial<ViewConfig>) => {
          void wrapper.setProps({
            config: { ...wrapper.props("config"), ...patch },
          });
        },
      },
      global: globalOptions,
    });
    await mapbox.handlers.load();
    mapbox.center = [-70.5, -12.25];
    mapbox.zoom = 8.75;
    mapbox.pitch = 45;
    mapbox.bearing = -90;
    await mapbox.handlers.move();
    await wrapper.vm.$nextTick();
    for (const [key, value] of Object.entries({
      MAPBOX_CENTER_LONGITUDE: "-70.5",
      MAPBOX_CENTER_LATITUDE: "-12.25",
      MAPBOX_ZOOM: "8.75",
      MAPBOX_PITCH: "45",
      MAPBOX_BEARING: "-90",
    })) {
      expect(
        (wrapper.get(`#test-${key}`).element as HTMLInputElement).value,
      ).toBe(value);
    }
    expect(mapbox.jumpTo).not.toHaveBeenCalled();
    await wrapper.get("#test-MAPBOX_CENTER_LONGITUDE").setValue("40");
    await wrapper.get("#test-MAPBOX_CENTER_LATITUDE").setValue("-20");
    await wrapper.get("#test-MAPBOX_ZOOM").setValue("6.5");
    await wrapper.get("#test-MAPBOX_PITCH").setValue("30");
    await wrapper.get("#test-MAPBOX_BEARING").setValue("120");
    expect(mapbox.center).toEqual([40, -20]);
    expect(mapbox.zoom).toBe(6.5);
    expect(mapbox.pitch).toBe(30);
    expect(mapbox.bearing).toBe(120);
    expect(wrapper.emitted("updateConfig")).toHaveLength(6);
    await wrapper.get("#test-MAPBOX_CENTER_LATITUDE").setValue("");
    expect(mapbox.center).toEqual([40, -20]);
    wrapper.unmount();
  });

  it("wraps longitude after panning across the antimeridian", async () => {
    const wrapper = mount(ConfigMapPreview, { props: previewProps });
    await mapbox.handlers.load();
    mapbox.center = [190, 20];
    await mapbox.handlers.move();
    expect(wrapper.emitted("updateConfig")?.[0]?.[0]).toMatchObject({
      MAPBOX_CENTER_LONGITUDE: "-170",
    });
    wrapper.unmount();
  });

  it("uses safe camera values for empty or out-of-range saved settings", () => {
    const wrapper = mount(ConfigMapPreview, {
      props: {
        ...previewProps,
        config: {
          MAPBOX_CENTER_LATITUDE: "",
          MAPBOX_CENTER_LONGITUDE: "invalid",
          MAPBOX_ZOOM: 30,
          MAPBOX_PITCH: 100,
        },
      },
    });
    expect(mapbox.create).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [0, 0],
        zoom: 22,
        pitch: 85,
        bearing: 0,
      }),
    );
    expect(wrapper.emitted("updateConfig")).toBeUndefined();
    wrapper.unmount();
  });

  it("hides a failed background and releases map resources", async () => {
    const wrapper = mount(ConfigMapPreview, {
      props: previewProps,
      attachTo: document.body,
    });
    await mapbox.handlers.load();
    await mapbox.handlers.error();
    await wrapper.vm.$nextTick();
    expect(wrapper.isVisible()).toBe(false);
    expect(mapbox.remove).toHaveBeenCalledOnce();
    expect(mapbox.disconnect).toHaveBeenCalledOnce();
    wrapper.unmount();
    expect(mapbox.remove).toHaveBeenCalledOnce();
  });

  it("releases map resources when the settings section closes", () => {
    const wrapper = mount(ConfigMapPreview, { props: previewProps });
    wrapper.unmount();
    expect(mapbox.remove).toHaveBeenCalledOnce();
    expect(mapbox.disconnect).toHaveBeenCalledOnce();
  });
});

describe("ConfigMap preview backgrounds", () => {
  it("labels the camera settings below background options and above the preview", () => {
    const wrapper = mount(ConfigMap, {
      props: {
        config,
        tableName: "test",
        views: ["map"],
        keys: ["MAPBOX_BASEMAPS"],
      },
      global: {
        ...globalOptions,
        mocks: { $t: (key: string) => en[key as keyof typeof en] ?? key },
      },
    });
    const heading = wrapper
      .findAll("label")
      .find((label) => label.text() === "Mapbox Settings");
    expect(heading).toBeDefined();
    expect(wrapper.text()).toContain("Set the camera position of the map.");
    const backgrounds = wrapper.get('[data-testid="basemaps-container"]');
    const preview = wrapper.get('[data-testid="config-map-preview"]');
    expect(
      backgrounds.element.compareDocumentPosition(heading!.element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      heading!.element.compareDocumentPosition(preview.element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    wrapper.unmount();
  });
  it.each([
    { style: "", access_token: "pk.eyTest" },
    { style: "invalid", access_token: "pk.eyTest" },
    { style: background.style, access_token: "" },
    { style: background.style, access_token: "invalid" },
    {
      style: { version: 8, sources: {}, layers: [] },
      access_token: "pk.eyTest",
    },
  ])(
    "hides an invalid first background even when the second is valid: %j",
    (invalid) => {
      const wrapper = mount(ConfigMap, {
        props: {
          config: {
            ...config,
            MAPBOX_BASEMAPS: JSON.stringify([
              { name: "Invalid", ...invalid },
              background,
            ]),
          },
          tableName: "test",
          views: ["map"],
          keys: ["MAPBOX_BASEMAPS"],
        },
        global: globalOptions,
      });
      expect(wrapper.findComponent(ConfigMapPreview).exists()).toBe(false);
      expect(mapbox.create).not.toHaveBeenCalled();
      wrapper.unmount();
    },
  );

  it("recovers after fixing credentials and switches to a reordered first background", async () => {
    const wrapper = mount(ConfigMap, {
      props: {
        config,
        tableName: "test",
        views: ["map"],
        keys: ["MAPBOX_BASEMAPS"],
      },
      global: globalOptions,
    });
    await wrapper.get("#test-basemap-access-token-0").setValue("");
    expect(wrapper.findComponent(ConfigMapPreview).exists()).toBe(false);
    expect(mapbox.remove).toHaveBeenCalledOnce();
    await wrapper.get("#test-basemap-access-token-0").setValue("pk.eyFixed");
    expect(mapbox.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ accessToken: "pk.eyFixed" }),
    );
    const reordered = {
      ...background,
      style: "mapbox://styles/mapbox/dark-v11",
      access_token: "pk.eyOther",
    };
    await wrapper.setProps({
      config: {
        ...config,
        MAPBOX_BASEMAPS: JSON.stringify([reordered, background]),
      },
    });
    expect(mapbox.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: reordered.style,
        accessToken: reordered.access_token,
      }),
    );
    expect(mapbox.create).toHaveBeenCalledTimes(3);
    wrapper.unmount();
  });
});
