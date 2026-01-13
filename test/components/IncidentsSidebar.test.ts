import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref, nextTick } from "vue";
import IncidentsSidebar from "@/components/alerts/IncidentsSidebar.vue";
import type { AnnotatedCollection } from "@/types/types";

// Mock vue-i18n
vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("IncidentsSidebar component", () => {
  const mockIncidents: AnnotatedCollection[] = [
    {
      id: "1",
      name: "Test Incident 1",
      description: "Test description 1",
      collection_type: "incident",
      created_at: new Date().toISOString(),
      created_by: "test-user",
      metadata: {},
    },
    {
      id: "2",
      name: "Test Incident 2",
      description: "Test description 2",
      collection_type: "incident",
      created_at: new Date().toISOString(),
      created_by: "test-user",
      metadata: {},
    },
  ];

  const mockSelectedSources = [
    { source_table: "mapeo_data", source_id: "source1" },
    { source_table: "alerts", source_id: "source2" },
  ];

  const baseProps = {
    incidents: mockIncidents,
    selectedSources: [],
    isLoading: false,
    isCreating: false,
    show: true,
    openWithCreateForm: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when show is true", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: baseProps,
    });

    expect(wrapper.find(".incidents-sidebar").exists()).toBe(true);
  });

  it("does not render when show is false", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: { ...baseProps, show: false },
    });

    expect(wrapper.find(".incidents-sidebar").exists()).toBe(false);
  });

  it("shows saved incidents when no sources are selected", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: baseProps,
    });

    const heading = wrapper.find(".sidebar-header h2");
    expect(heading.text()).toContain("incidents.savedIncidents");
  });

  it("shows create new incident when sources are selected", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
      },
    });

    const heading = wrapper.find(".sidebar-header h2");
    expect(heading.text()).toContain("incidents.createNewIncident");
  });

  it("displays selected sources list", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
      },
    });

    const selectedSourcesSection = wrapper.find(".selected-sources");
    expect(selectedSourcesSection.exists()).toBe(true);

    const sourceItems = wrapper.findAll(".source-item");
    expect(sourceItems.length).toBe(2);
  });

  it("displays source table and id for each selected source", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
      },
    });

    const sourceItems = wrapper.findAll(".source-item");
    expect(sourceItems[0].text()).toContain("mapeo_data");
    expect(sourceItems[0].text()).toContain("source1");
    expect(sourceItems[1].text()).toContain("alerts");
    expect(sourceItems[1].text()).toContain("source2");
  });

  it("emits removeSource when remove button is clicked", async () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
      },
    });

    const removeButtons = wrapper.findAll(".remove-btn");
    await removeButtons[0].trigger("click");

    expect(wrapper.emitted("removeSource")).toBeTruthy();
    expect(wrapper.emitted("removeSource")?.[0]).toEqual([
      "mapeo_data",
      "source1",
    ]);
  });

  it("emits clearSources when clear all button is clicked", async () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
      },
    });

    const clearButton = wrapper.find(".clear-btn");
    await clearButton.trigger("click");

    expect(wrapper.emitted("clearSources")).toBeTruthy();
  });

  it("shows create form when openWithCreateForm is true", async () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
        openWithCreateForm: true,
      },
    });

    await flushPromises();
    await nextTick();

    const createForm = wrapper.find(".create-form");
    expect(createForm.exists()).toBe(true);
  });

  it("does not show create form when openWithCreateForm is false", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
        openWithCreateForm: false,
      },
    });

    const createForm = wrapper.find(".create-form");
    expect(createForm.exists()).toBe(false);
  });

  it("shows saved incidents list when no sources selected and form not shown", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: baseProps,
    });

    const incidentsList = wrapper.find(".incidents-list");
    expect(incidentsList.exists()).toBe(true);
  });

  it("displays all incidents in the list", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: baseProps,
    });

    const incidentItems = wrapper.findAll(".incident-item");
    expect(incidentItems.length).toBe(2);
  });

  it("displays incident name and description", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: baseProps,
    });

    const firstIncident = wrapper.findAll(".incident-item")[0];
    expect(firstIncident.text()).toContain("Test Incident 1");
    expect(firstIncident.text()).toContain("Test description 1");
  });

  it("shows loading state", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        isLoading: true,
      },
    });

    const loadingText = wrapper.find(".loading");
    expect(loadingText.exists()).toBe(true);
    expect(loadingText.text()).toContain("incidents.loadingIncidents");
  });

  it("shows empty state when no incidents", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        incidents: [],
        isLoading: false,
      },
    });

    const emptyState = wrapper.find(".empty-state");
    expect(emptyState.exists()).toBe(true);
    expect(emptyState.text()).toContain("incidents.noIncidentsYet");
  });

  it("emits close when close button is clicked", async () => {
    const wrapper = mount(IncidentsSidebar, {
      props: baseProps,
    });

    const closeButton = wrapper.find(".close-btn");
    await closeButton.trigger("click");

    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("emits createIncident with form data when form is submitted", async () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
        openWithCreateForm: true,
      },
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
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
        openWithCreateForm: true,
      },
    });

    await flushPromises();
    await nextTick();

    // Try to submit without filling name
    const form = wrapper.find("form");
    await form.trigger("submit.prevent");

    expect(wrapper.emitted("createIncident")).toBeFalsy();
  });

  it("resets form after successful submission", async () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
        openWithCreateForm: true,
      },
    });

    await flushPromises();
    await nextTick();

    const nameInput = wrapper.find('input[id="name"]');
    await nameInput.setValue("Test Incident");

    const form = wrapper.find("form");
    await form.trigger("submit.prevent");

    await nextTick();

    // Form should be reset (name should be empty)
    const nameInputAfter = wrapper.find('input[id="name"]');
    expect((nameInputAfter.element as HTMLInputElement).value).toBe("");
  });

  it("hides create form after cancel button is clicked", async () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
        openWithCreateForm: true,
      },
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
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
        openWithCreateForm: false,
      },
    });

    const createButton = wrapper.find(".new-incident-prompt .create-btn");
    expect(createButton.exists()).toBe(true);
  });

  it("shows create form when create button is clicked", async () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
        openWithCreateForm: false,
      },
    });

    const createButton = wrapper.find(".new-incident-prompt .create-btn");
    await createButton.trigger("click");
    await nextTick();

    expect(wrapper.find(".create-form").exists()).toBe(true);
  });

  it("disables submit button when isCreating is true", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
        openWithCreateForm: true,
        isCreating: true,
      },
    });

    const submitButton = wrapper.find(".submit-btn");
    expect((submitButton.element as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows creating text when isCreating is true", () => {
    const wrapper = mount(IncidentsSidebar, {
      props: {
        ...baseProps,
        selectedSources: mockSelectedSources,
        openWithCreateForm: true,
        isCreating: true,
      },
    });

    const submitButton = wrapper.find(".submit-btn");
    expect(submitButton.text()).toContain("incidents.creating");
  });
});
