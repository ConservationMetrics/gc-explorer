import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref, computed, watch, onMounted } from "vue";
import ConfigMap from "@/components/config/ConfigMap.vue";
import type { ViewConfig } from "@/types/types";

Object.assign(globalThis, {
  ref,
  computed,
  watch,
  onMounted,
});

// Mock vue-tags-input and vue-3-slider-component
vi.mock("@vojtechlanka/vue-tags-input", () => ({
  VueTagsInput: {
    name: "VueTagsInput",
    template: "<div></div>",
  },
}));

vi.mock("vue-3-slider-component", () => ({
  default: {
    name: "VueSlider",
    template: "<div></div>",
  },
}));

// Mock composables
vi.mock("@/composables/useTags", () => ({
  updateTags: () => ({
    tags: { MAP_LEGEND_LAYER_IDS: [] },
    handleTagsChanged: vi.fn(),
  }),
}));

const baseProps = {
  tableName: "test_table",
  config: {
    MAPBOX_STYLE: "mapbox://styles/mapbox/streets-v12",
    MAPBOX_ACCESS_TOKEN: "pk.test",
    MAPBOX_ZOOM: 10,
    MAPBOX_CENTER_LATITUDE: "10",
    MAPBOX_CENTER_LONGITUDE: "10",
    MAPBOX_PROJECTION: "mercator",
    MAPBOX_BEARING: 0,
    MAPBOX_PITCH: 0,
    MAPBOX_3D: false,
    MAPBOX_3D_TERRAIN_EXAGGERATION: 1.5,
  } as ViewConfig,
  views: ["map"],
  keys: [
    "MAPBOX_STYLE",
    "MAPBOX_ACCESS_TOKEN",
    "MAPBOX_ZOOM",
    "MAPBOX_CENTER_LATITUDE",
    "MAPBOX_CENTER_LONGITUDE",
    "MAPBOX_PROJECTION",
    "MAPBOX_BEARING",
    "MAPBOX_PITCH",
    "MAPBOX_3D",
    "MAPBOX_3D_TERRAIN_EXAGGERATION",
  ],
};

const globalConfig = {
  mocks: {
    $t: (key: string) => key,
  },
};

describe("ConfigMap component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with legacy MAPBOX_STYLE and converts to basemaps array", () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string; style: string; isDefault: boolean }>;
    };

    expect(vm.basemaps).toHaveLength(1);
    expect(vm.basemaps[0].style).toBe("mapbox://styles/mapbox/streets-v12");
    expect(vm.basemaps[0].isDefault).toBe(true);
  });

  it("parses MAPBOX_BASEMAPS from config", () => {
    const configWithBasemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "Satellite",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: true,
        },
        {
          name: "Streets",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: false,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWithBasemaps },
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string; style: string; isDefault: boolean }>;
    };

    expect(vm.basemaps).toHaveLength(2);
    expect(vm.basemaps[0].name).toBe("Satellite");
    expect(vm.basemaps[0].isDefault).toBe(true);
    expect(vm.basemaps[1].name).toBe("Streets");
    expect(vm.basemaps[1].isDefault).toBe(false);
  });

  it("ensures first basemap is always default", () => {
    const configWithBasemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "First",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: false,
        },
        {
          name: "Second",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: true,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWithBasemaps },
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string; isDefault: boolean }>;
    };

    expect(vm.basemaps[0].isDefault).toBe(true);
    expect(vm.basemaps[1].isDefault).toBe(false);
  });

  it("adds a new basemap when add button is clicked", async () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const addButton = wrapper.find(".add-basemap-button");
    await addButton.trigger("click");

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string; style: string }>;
    };

    expect(vm.basemaps).toHaveLength(2);
    expect(vm.basemaps[1].name).toBe("");
    expect(vm.basemaps[1].style).toBe("");
  });

  it("limits basemaps to 3 maximum", async () => {
    const configWith3Basemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "First",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: true,
        },
        {
          name: "Second",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: false,
        },
        {
          name: "Third",
          style: "mapbox://styles/mapbox/dark-v11",
          isDefault: false,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWith3Basemaps },
      global: globalConfig,
    });

    const addButton = wrapper.find(".add-basemap-button");
    expect(addButton.attributes("disabled")).toBeDefined();
    expect(addButton.classes()).toContain("disabled");

    await addButton.trigger("click");

    const vm = wrapper.vm as unknown as {
      basemaps: Array<unknown>;
    };

    expect(vm.basemaps).toHaveLength(3);
  });

  it("removes a basemap when remove button is clicked", async () => {
    const configWith2Basemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "First",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: true,
        },
        {
          name: "Second",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: false,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWith2Basemaps },
      global: globalConfig,
    });

    const removeButtons = wrapper.findAll(".remove-button");
    expect(removeButtons).toHaveLength(1); // Only second item has remove button

    await removeButtons[0].trigger("click");

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string }>;
    };

    expect(vm.basemaps).toHaveLength(1);
    expect(vm.basemaps[0].name).toBe("First");
  });

  it("prevents removing first basemap", async () => {
    const configWith2Basemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "First",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: true,
        },
        {
          name: "Second",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: false,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWith2Basemaps },
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string }>;
      removeBasemap: (index: number) => void;
    };

    const initialLength = vm.basemaps.length;
    vm.removeBasemap(0);
    expect(vm.basemaps).toHaveLength(initialLength);
  });

  it("prevents removing last basemap (must have at least one)", async () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string }>;
      removeBasemap: (index: number) => void;
    };

    expect(vm.basemaps).toHaveLength(1);
    vm.removeBasemap(0);
    expect(vm.basemaps).toHaveLength(1); // Still has one, cannot remove
  });

  it("updates basemap name when input changes", async () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const nameInput = wrapper.find('input[id="test_table-basemap-name-0"]');
    await nameInput.setValue("My Custom Basemap");

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string }>;
    };

    expect(vm.basemaps[0].name).toBe("My Custom Basemap");
  });

  it("updates basemap style when input changes", async () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const styleInput = wrapper.find('input[id="test_table-basemap-style-0"]');
    await styleInput.setValue("mapbox://styles/myuser/mystyle");

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ style: string }>;
    };

    expect(vm.basemaps[0].style).toBe("mapbox://styles/myuser/mystyle");
  });

  it("validates basemap name is not blank", () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string }>;
      isNameValid: (index: number, name: string) => boolean;
      getValidationError: (index: number, name: string) => string | null;
    };

    expect(vm.isNameValid(0, "")).toBe(false);
    expect(vm.getValidationError(0, "")).toBe("Basemap name cannot be blank");
    expect(vm.isNameValid(0, "   ")).toBe(false); // Whitespace only
    expect(vm.isNameValid(0, "Valid Name")).toBe(true);
  });

  it("validates basemap name is unique", () => {
    const configWith2Basemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "First",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: true,
        },
        {
          name: "Second",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: false,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWith2Basemaps },
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string }>;
      isNameValid: (index: number, name: string) => boolean;
      getValidationError: (index: number, name: string) => string | null;
    };

    // First basemap can have "First" (its own name)
    expect(vm.isNameValid(0, "First")).toBe(true);
    // Second basemap cannot have "First" (duplicate)
    expect(vm.isNameValid(1, "First")).toBe(false);
    expect(vm.getValidationError(1, "First")).toBe(
      "Basemap name must be unique",
    );
    // But second can have a different name
    expect(vm.isNameValid(1, "Second")).toBe(true);
    expect(vm.isNameValid(1, "Unique Name")).toBe(true);
  });

  it("shows validation error for duplicate names", async () => {
    const configWith2Basemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "First",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: true,
        },
        {
          name: "Second",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: false,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWith2Basemaps },
      global: globalConfig,
    });

    const nameInputs = wrapper.findAll('input[id^="test_table-basemap-name-"]');
    await nameInputs[1].setValue("First"); // Duplicate name

    await wrapper.vm.$nextTick();

    const validationErrors = wrapper.findAll(".validation-error");
    expect(validationErrors.length).toBeGreaterThan(0);
    expect(validationErrors[0].text()).toBe("Basemap name must be unique");

    const secondNameInput = nameInputs[1];
    expect(secondNameInput.classes()).toContain("input-error");
  });

  it("emits updateConfig when basemap is added", async () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const addButton = wrapper.find(".add-basemap-button");
    await addButton.trigger("click");

    expect(wrapper.emitted("updateConfig")).toBeTruthy();
    const emitted = wrapper.emitted("updateConfig");
    expect(emitted?.[0]?.[0]).toHaveProperty("MAPBOX_BASEMAPS");
  });

  it("emits updateConfig when basemap is removed", async () => {
    const configWith2Basemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "First",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: true,
        },
        {
          name: "Second",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: false,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWith2Basemaps },
      global: globalConfig,
    });

    const removeButton = wrapper.find(".remove-button");
    await removeButton.trigger("click");

    expect(wrapper.emitted("updateConfig")).toBeTruthy();
  });

  it("emits updateConfig when basemap is updated", async () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const nameInput = wrapper.find('input[id="test_table-basemap-name-0"]');
    await nameInput.setValue("Updated Name");

    expect(wrapper.emitted("updateConfig")).toBeTruthy();
  });

  it("shows default visual cue for first basemap", () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const basemapItems = wrapper.findAll(".basemap-item");
    expect(basemapItems[0].classes()).toContain("basemap-default");
  });

  it("reorders basemaps on drag and drop", async () => {
    const configWith2Basemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "First",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: true,
        },
        {
          name: "Second",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: false,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWith2Basemaps },
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string; isDefault: boolean }>;
      handleDragStart: (index: number) => void;
      handleDrop: (e: DragEvent, dropIndex: number) => void;
    };

    vm.handleDragStart(1);
    const dropEvent = new Event("drop") as DragEvent;
    Object.defineProperty(dropEvent, "preventDefault", {
      value: vi.fn(),
    });
    vm.handleDrop(dropEvent, 0);

    expect(vm.basemaps[0].name).toBe("Second");
    expect(vm.basemaps[1].name).toBe("First");
    // After reorder, first item should be default
    expect(vm.basemaps[0].isDefault).toBe(true);
    expect(vm.basemaps[1].isDefault).toBe(false);
  });

  it("handles drag over event", () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      handleDragOver: (e: DragEvent, index: number) => void;
    };

    const dragOverEvent = new Event("dragover") as DragEvent;
    const preventDefaultSpy = vi.spyOn(dragOverEvent, "preventDefault");
    vm.handleDragOver(dragOverEvent, 0);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("disables add button when 3 basemaps are present", () => {
    const configWith3Basemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "First",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: true,
        },
        {
          name: "Second",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: false,
        },
        {
          name: "Third",
          style: "mapbox://styles/mapbox/dark-v11",
          isDefault: false,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWith3Basemaps },
      global: globalConfig,
    });

    const addButton = wrapper.find(".add-basemap-button");
    expect(addButton.attributes("disabled")).toBeDefined();
    expect(addButton.classes()).toContain("disabled");
  });

  it("enables add button when less than 3 basemaps", () => {
    const wrapper = mount(ConfigMap, {
      props: baseProps,
      global: globalConfig,
    });

    const addButton = wrapper.find(".add-basemap-button");
    expect(addButton.attributes("disabled")).toBeUndefined();
    expect(addButton.classes()).not.toContain("disabled");
  });

  it("updates default basemap when first item is dragged to different position", async () => {
    const configWith2Basemaps = {
      ...baseProps.config,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          name: "First",
          style: "mapbox://styles/mapbox/satellite-v9",
          isDefault: true,
        },
        {
          name: "Second",
          style: "mapbox://styles/mapbox/streets-v12",
          isDefault: false,
        },
      ]),
    };

    const wrapper = mount(ConfigMap, {
      props: { ...baseProps, config: configWith2Basemaps },
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      basemaps: Array<{ name: string; isDefault: boolean }>;
      handleDragStart: (index: number) => void;
      handleDrop: (e: DragEvent, dropIndex: number) => void;
    };

    // Drag first item to second position
    vm.handleDragStart(0);
    const dropEvent = new Event("drop") as DragEvent;
    Object.defineProperty(dropEvent, "preventDefault", {
      value: vi.fn(),
    });
    vm.handleDrop(dropEvent, 1);

    // After drop, the item at position 0 should be default
    expect(vm.basemaps[0].name).toBe("Second");
    expect(vm.basemaps[0].isDefault).toBe(true);
    expect(vm.basemaps[1].name).toBe("First");
    expect(vm.basemaps[1].isDefault).toBe(false);
  });

  it("renders COLOR_COLUMN field when included in keys", () => {
    const propsWithColorColumn = {
      ...baseProps,
      keys: [...baseProps.keys, "COLOR_COLUMN"],
    };

    const wrapper = mount(ConfigMap, {
      props: propsWithColorColumn,
      global: globalConfig,
    });

    const colorColumnInput = wrapper.find('input[id="test_table-COLOR_COLUMN"]');
    expect(colorColumnInput.exists()).toBe(true);
  });

  it("updates COLOR_COLUMN value when input changes", async () => {
    const propsWithColorColumn = {
      ...baseProps,
      keys: [...baseProps.keys, "COLOR_COLUMN"],
    };

    const wrapper = mount(ConfigMap, {
      props: propsWithColorColumn,
      global: globalConfig,
    });

    const colorColumnInput = wrapper.find('input[id="test_table-COLOR_COLUMN"]');
    await colorColumnInput.setValue("color");

    expect(wrapper.emitted("updateConfig")).toBeTruthy();
    const emitted = wrapper.emitted("updateConfig");
    expect(emitted?.[0]?.[0]).toEqual({ COLOR_COLUMN: "color" });
  });

  it("displays placeholder for COLOR_COLUMN field", () => {
    const propsWithColorColumn = {
      ...baseProps,
      keys: [...baseProps.keys, "COLOR_COLUMN"],
    };

    const wrapper = mount(ConfigMap, {
      props: propsWithColorColumn,
      global: globalConfig,
    });

    const colorColumnInput = wrapper.find('input[id="test_table-COLOR_COLUMN"]');
    expect(colorColumnInput.attributes("placeholder")).toBe("color");
  });
});
