<script setup lang="ts">
import type { AnnotatedCollection, CollectionEntry } from "@/types/types";

const props = defineProps<{
  incidents: AnnotatedCollection[];
  selectedSources: Array<{
    source_table: string;
    source_id: string;
    notes?: string;
  }>;
  isLoading: boolean;
  isCreating: boolean;
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
  createIncident: [
    data: {
      name: string;
      description?: string;
      incident_type?: string;
      responsible_party?: string;
      impact_description?: string;
      supporting_evidence?: Record<string, unknown>;
    },
  ];
  removeSource: [sourceTable: string, sourceId: string];
  clearSources: [];
}>();

const showCreateForm = ref(false);
const formData = ref({
  name: "",
  description: "",
  incident_type: "",
  responsible_party: "",
  impact_description: "",
  supporting_evidence: {} as Record<string, unknown>,
});

const incidentTypes = [
  "Deforestation",
  "Illegal Logging",
  "Mining",
  "Poaching",
  "Encroachment",
  "Fire",
  "Other",
];

const handleSubmit = () => {
  if (!formData.value.name.trim()) {
    return;
  }

  emit("createIncident", {
    name: formData.value.name,
    description: formData.value.description || undefined,
    incident_type: formData.value.incident_type || undefined,
    responsible_party: formData.value.responsible_party || undefined,
    impact_description: formData.value.impact_description || undefined,
    supporting_evidence: Object.keys(formData.value.supporting_evidence).length
      ? formData.value.supporting_evidence
      : undefined,
  });

  // Reset form
  formData.value = {
    name: "",
    description: "",
    incident_type: "",
    responsible_party: "",
    impact_description: "",
    supporting_evidence: {},
  };
  showCreateForm.value = false;
};

const handleClose = () => {
  showCreateForm.value = false;
  emit("close");
};
</script>

<template>
  <div v-if="show" class="incidents-sidebar">
    <div class="sidebar-header">
      <h2>Incidents</h2>
      <button class="close-btn" @click="handleClose" title="Close">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="sidebar-content">
      <!-- Selected Sources Section -->
      <div v-if="selectedSources.length > 0" class="selected-sources">
        <h3>Selected Sources ({{ selectedSources.length }})</h3>
        <div class="sources-list">
          <div
            v-for="(source, index) in selectedSources"
            :key="`${source.source_table}-${source.source_id}-${index}`"
            class="source-item"
          >
            <div class="source-info">
              <span class="source-table">{{ source.source_table }}</span>
              <span class="source-id">{{ source.source_id }}</span>
            </div>
            <button
              class="remove-btn"
              @click="
                emit('removeSource', source.source_table, source.source_id)
              "
              title="Remove"
            >
              ×
            </button>
          </div>
        </div>
        <button class="clear-btn" @click="emit('clearSources')">
          Clear All
        </button>
      </div>

      <!-- Create Incident Form -->
      <div v-if="showCreateForm" class="create-form">
        <h3>Create New Incident</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="name">Name *</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              required
              placeholder="Enter incident name"
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="formData.description"
              rows="3"
              placeholder="Enter description"
            />
          </div>

          <div class="form-group">
            <label for="incident_type">Incident Type</label>
            <select id="incident_type" v-model="formData.incident_type">
              <option value="">Select type</option>
              <option v-for="type in incidentTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="responsible_party">Responsible Party</label>
            <input
              id="responsible_party"
              v-model="formData.responsible_party"
              type="text"
              placeholder="Enter responsible party"
            />
          </div>

          <div class="form-group">
            <label for="impact_description">Impact Description</label>
            <textarea
              id="impact_description"
              v-model="formData.impact_description"
              rows="3"
              placeholder="Describe the impact"
            />
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="isCreating" class="submit-btn">
              {{ isCreating ? "Creating..." : "Create Incident" }}
            </button>
            <button
              type="button"
              @click="showCreateForm = false"
              class="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Incidents List -->
      <div class="incidents-list">
        <div class="list-header">
          <h3>Saved Incidents ({{ incidents.length }})</h3>
          <button
            v-if="!showCreateForm"
            class="create-btn"
            @click="showCreateForm = true"
          >
            + New Incident
          </button>
        </div>

        <div v-if="isLoading" class="loading">Loading incidents...</div>

        <div v-else-if="incidents.length === 0" class="empty-state">
          <p>No incidents yet. Create your first incident!</p>
        </div>

        <div v-else class="incidents-items">
          <div
            v-for="incident in incidents"
            :key="incident.id"
            class="incident-item"
          >
            <div class="incident-header">
              <h4>{{ incident.name }}</h4>
              <span class="incident-type">{{ incident.collection_type }}</span>
            </div>
            <p v-if="incident.description" class="incident-description">
              {{ incident.description }}
            </p>
            <div class="incident-meta">
              <span
                >Created:
                {{ new Date(incident.created_at).toLocaleDateString() }}</span
              >
              <span>By: {{ incident.created_by }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.incidents-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  height: 100%;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.selected-sources {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.selected-sources h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.source-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.source-table {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.source-id {
  font-size: 12px;
  color: #666;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #999;
  padding: 0 8px;
}

.remove-btn:hover {
  color: #e74c3c;
}

.clear-btn {
  width: 100%;
  padding: 8px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn:hover {
  background: #e0e0e0;
}

.create-form {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.create-form h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.submit-btn {
  flex: 1;
  padding: 10px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.submit-btn:hover:not(:disabled) {
  background: #357abd;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  flex: 1;
  padding: 10px;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.incidents-list {
  margin-top: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.create-btn {
  padding: 6px 12px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.create-btn:hover {
  background: #357abd;
}

.loading,
.empty-state {
  text-align: center;
  padding: 32px;
  color: #666;
}

.incidents-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.incident-item {
  padding: 12px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.incident-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.incident-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.incident-type {
  font-size: 12px;
  padding: 2px 8px;
  background: #e0e0e0;
  border-radius: 12px;
  color: #666;
}

.incident-description {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.incident-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>
