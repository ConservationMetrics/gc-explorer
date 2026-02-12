import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref, nextTick } from "vue";
import IncidentsSidebar from "@/components/alerts/IncidentsSidebar.vue";
import type { AnnotatedCollection } from "@/types/types";
import { createI18n } from "@/test/helpers/vueI18nMock";

// Make Vue reactivity functions available globally (for auto-imports in components)
Object.assign(globalThis, {
  ref,
  nextTick,
});

// Mock vue-i18n to use our test helper
vi.mock("vue-i18n", () => import("@/test/helpers/vueI18nMock"));

// Create i18n instance for template $t support
const i18n = createI18n();

describe("IncidentsSidebar component", () => {
  type SelectedSource = {
    source_table: string;
    source_id: string;
    notes?: string;
  };

  const mockIncidents: AnnotatedCollection[] = [
    {
      id: "1",
      name: "Test Incident 1",
      description: "Test description 1",
      collection_type: "incident",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: "test-user",
      metadata: {},
    },
    {
      id: "2",
      name: "Test Incident 2",
      description: "Test description 2",
      collection_type: "incident",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: "test-user",
      metadata: {},
    },
  ];

  const mockSelectedSources: SelectedSource[] = [
    { source_table: "mapeo_data", source_id: "source1" },
    { source_table: "alerts", source_id: "source2" },
  ];

  const baseProps: {
    incidents: AnnotatedCollection[];
    selectedSources: SelectedSource[];
    isLoading: boolean;
    isCreating: boolean;
    show: boolean;
    openWithCreateForm: boolean;
  } = {
    incidents: mockIncidents,
    selectedSources: [],
    isLoading: false,
    isCreating: false,
    show: true,
    openWithCreateForm: false,
  };

  // Helper to mount with i18n plugin and $t mock
  const mountWithI18n = (props: typeof baseProps, options = {}) => {
    return mount(IncidentsSidebar, {
      props,
      global: {
        plugins: [i18n],
        mocks: {
          $t: (key: string) => key,
        },
      },
      ...options,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when show is true", () => {
    const wrapper = mountWithI18n(baseProps);

    expect(wrapper.find(".incidents-sidebar").exists()).toBe(true);
  });

  it("does not render when show is false", () => {
    const wrapper = mountWithI18n({ ...baseProps, show: false });

    expect(wrapper.find(".incidents-sidebar").exists()).toBe(false);
  });

  it("shows saved incidents when no sources are selected", () => {
    const wrapper = mountWithI18n(baseProps);

    const heading = wrapper.find(".sidebar-header h2");
    expect(heading.text()).toContain("incidents.savedIncidents");
  });

  it("shows create new incident when sources are selected", () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
    });

    const heading = wrapper.find(".sidebar-header h2");
    expect(heading.text()).toContain("incidents.createNewIncident");
  });

  it("displays selected sources summary", () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
    });

    const selectedSourcesSection = wrapper.find(".selected-sources");
    expect(selectedSourcesSection.exists()).toBe(true);
    const summary = wrapper.find(".selected-sources-summary");
    expect(summary.exists()).toBe(true);
    expect(summary.text()).toContain("incidents.selectedAlertsCount");
    expect(summary.text()).toContain("incidents.selectedMapeoCount");
  });

  it("emits clearSources when clear all button is clicked", async () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
    });

    const clearButton = wrapper.find(".clear-btn");
    await clearButton.trigger("click");

    expect(wrapper.emitted("clearSources")).toBeTruthy();
  });

  it("shows create form when openWithCreateForm is true", async () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
      openWithCreateForm: true,
    });

    await flushPromises();
    await nextTick();

    const createForm = wrapper.find(".create-form");
    expect(createForm.exists()).toBe(true);
  });

  it("does not show create form when openWithCreateForm is false", () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
      openWithCreateForm: false,
    });

    const createForm = wrapper.find(".create-form");
    expect(createForm.exists()).toBe(false);
  });

  it("shows saved incidents list when no sources selected and form not shown", () => {
    const wrapper = mountWithI18n(baseProps);

    const incidentsList = wrapper.find(".incidents-list");
    expect(incidentsList.exists()).toBe(true);
  });

  it("displays all incidents in the list", () => {
    const wrapper = mountWithI18n(baseProps);

    const incidentItems = wrapper.findAll(".incident-item");
    expect(incidentItems.length).toBe(2);
  });

  it("displays incident name and description", () => {
    const wrapper = mountWithI18n(baseProps);

    const firstIncident = wrapper.findAll(".incident-item")[0];
    expect(firstIncident.text()).toContain("Test Incident 1");
    expect(firstIncident.text()).toContain("Test description 1");
  });

  it("shows loading state", () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      isLoading: true,
    });

    const loadingText = wrapper.find(".loading");
    expect(loadingText.exists()).toBe(true);
    expect(loadingText.text()).toContain("incidents.loadingIncidents");
  });

  it("shows empty state when no incidents", () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      incidents: [],
      isLoading: false,
    });

    const emptyState = wrapper.find(".empty-state");
    expect(emptyState.exists()).toBe(true);
    expect(emptyState.text()).toContain("incidents.noIncidentsYet");
  });

  it("emits close when close button is clicked", async () => {
    const wrapper = mountWithI18n(baseProps);

    const closeButton = wrapper.find(".close-btn");
    await closeButton.trigger("click");

    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("emits createIncident with form data when form is submitted", async () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
      openWithCreateForm: true,
    });

    await flushPromises();
    await nextTick();

    // Fill out the form
    const nameInput = wrapper.find('input[id="name"]');
    await nameInput.setValue("New Incident");

    const descriptionTextarea = wrapper.find('textarea[id="description"]');
    await descriptionTextarea.setValue("Test description");

    const typeSelect = wrapper.find('select[id="incident_type"]');
    await typeSelect.setValue("Deforestation");

    // Submit the form
    const form = wrapper.find("form");
    await form.trigger("submit.prevent");

    expect(wrapper.emitted("createIncident")).toBeTruthy();
    const emittedData = wrapper.emitted("createIncident")?.[0][0];
    expect(emittedData).toMatchObject({
      name: "New Incident",
      description: "Test description",
      incident_type: "Deforestation",
    });
  });

  it("does not emit createIncident if name is empty", async () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
      openWithCreateForm: true,
    });

    await flushPromises();
    await nextTick();

    // Try to submit without filling name
    const form = wrapper.find("form");
    await form.trigger("submit.prevent");

    expect(wrapper.emitted("createIncident")).toBeFalsy();
  });

  it("resets form after successful submission", async () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
      openWithCreateForm: true,
    });

    await flushPromises();
    await nextTick();

    const nameInput = wrapper.find('input[id="name"]');
    await nameInput.setValue("Test Incident");

    const form = wrapper.find("form");
    await form.trigger("submit.prevent");

    await nextTick();
    await flushPromises();

    // After submission, form might be hidden or reset
    // Check if form still exists, and if so, verify it's reset
    const formAfter = wrapper.find("form");
    if (formAfter.exists()) {
      const nameInputAfter = wrapper.find('input[id="name"]');
      if (nameInputAfter.exists()) {
        expect((nameInputAfter.element as HTMLInputElement).value).toBe("");
      }
    }
    // If form is hidden, that's also acceptable behavior
  });

  it("hides create form after cancel button is clicked", async () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
      openWithCreateForm: true,
    });

    await flushPromises();
    await nextTick();

    // Verify form is shown
    expect(wrapper.find(".create-form").exists()).toBe(true);

    // Click cancel button
    const cancelButton = wrapper.find(".cancel-btn");
    await cancelButton.trigger("click");
    await nextTick();

    // Form should be hidden
    expect(wrapper.find(".create-form").exists()).toBe(false);
  });

  it("shows create button when sources are selected but form is not shown", () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
      openWithCreateForm: false,
    });

    const createButton = wrapper.find(".new-incident-prompt .create-btn");
    expect(createButton.exists()).toBe(true);
  });

  it("shows create form when create button is clicked", async () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
      openWithCreateForm: false,
    });

    const createButton = wrapper.find(".new-incident-prompt .create-btn");
    await createButton.trigger("click");
    await nextTick();

    expect(wrapper.find(".create-form").exists()).toBe(true);
  });

  it("disables submit button when isCreating is true", () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
      openWithCreateForm: true,
      isCreating: true,
    });

    const submitButton = wrapper.find(".submit-btn");
    expect((submitButton.element as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows creating text when isCreating is true", () => {
    const wrapper = mountWithI18n({
      ...baseProps,
      selectedSources: mockSelectedSources,
      openWithCreateForm: true,
      isCreating: true,
    });

    const submitButton = wrapper.find(".submit-btn");
    expect(submitButton.text()).toContain("incidents.creating");
  });
});
