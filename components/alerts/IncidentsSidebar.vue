<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Copy, Check } from "lucide-vue-next";
import { useCopyLink } from "@/utils/copyLink";
import type {
  AnnotatedCollection,
  CollectionEntry,
  Incident,
} from "@/types/types";

const { t } = useI18n();

const props = defineProps<{
  incidents: AnnotatedCollection[];
  incidentsTotal?: number;
  isLoadingMore?: boolean;
  selectedIncident?: AnnotatedCollection | null;
  selectedIncidentData?: Incident | null;
  selectedIncidentEntries?: CollectionEntry[];
  isLoadingSelectedIncident?: boolean;
  selectedSources: Array<{
    source_table: string;
    source_id: string;
    notes?: string;
  }>;
  isLoading: boolean;
  isCreating: boolean;
  show: boolean;
  openWithCreateForm?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  backToIncidentsList: [];
  selectIncident: [incidentId: string];
  hoverIncident: [incidentId: string];
  loadMoreIncidents: [];
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
const { showCopied, copyLink } = useCopyLink();
const formData = ref({
  name: "",
  description: "",
  incident_type: "",
  responsible_party: "",
  impact_description: "",
  supporting_evidence: {} as Record<string, unknown>,
});

// Watch for openWithCreateForm prop to show form when sidebar opens
watch(
  () => [props.show, props.openWithCreateForm],
  ([show, openWithCreateForm]) => {
    if (show && openWithCreateForm) {
      showCreateForm.value = true;
    }
  },
  { immediate: true },
);

const incidentTypes = [
  { value: "Deforestation", label: t("incidents.incidentTypes.deforestation") },
  {
    value: "Illegal Logging",
    label: t("incidents.incidentTypes.illegalLogging"),
  },
  { value: "Mining", label: t("incidents.incidentTypes.mining") },
  { value: "Poaching", label: t("incidents.incidentTypes.poaching") },
  { value: "Encroachment", label: t("incidents.incidentTypes.encroachment") },
  { value: "Fire", label: t("incidents.incidentTypes.fire") },
  { value: "Other", label: t("incidents.incidentTypes.other") },
];

const hasMoreIncidents = computed(() => {
  const total = props.incidentsTotal ?? props.incidents.length;
  return props.incidents.length < total;
});

const isLoadingMore = computed(() => props.isLoadingMore === true);

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

const handleBackToList = () => {
  showCreateForm.value = false;
  emit("backToIncidentsList");
};

const handleClose = () => {
  showCreateForm.value = false;
  emit("close");
};
</script>

<template>
  <div v-if="show" class="incidents-sidebar">
    <div class="sidebar-header">
      <div class="header-left">
        <button
          v-if="selectedIncident"
          class="back-btn"
          :title="$t('incidents.backToIncidents')"
          @click="handleBackToList"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2>
          {{
            selectedIncident
              ? selectedIncident.name
              : selectedSources.length > 0
                ? $t("incidents.createNewIncident")
                : $t("incidents.savedIncidents")
          }}
        </h2>
      </div>
      <button
        class="close-btn"
        :title="$t('incidents.close')"
        @click="handleClose"
      >
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
      <div v-if="selectedIncident" class="incident-detail">
        <div v-if="isLoadingSelectedIncident" class="loading">
          {{ $t("incidents.loadingIncident") }}
        </div>

        <template v-else>
          <div class="detail-meta">
            <div class="meta-row">
              <span class="meta-label">{{ $t("incidents.type") }}:</span>
              <span class="meta-value">{{
                selectedIncident.collection_type
              }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">{{ $t("incidents.created") }}:</span>
              <span class="meta-value">
                {{ new Date(selectedIncident.created_at).toLocaleDateString() }}
              </span>
            </div>
            <div class="meta-row">
              <span class="meta-label">{{ $t("incidents.by") }}:</span>
              <span class="meta-value">{{ selectedIncident.created_by }}</span>
            </div>
          </div>

          <p v-if="selectedIncident.description" class="incident-description">
            {{ selectedIncident.description }}
          </p>

          <div v-if="selectedIncidentData" class="incident-extra">
            <div v-if="selectedIncidentData.status" class="meta-row">
              <span class="meta-label">{{ $t("incidents.status") }}:</span>
              <span class="meta-value">{{ selectedIncidentData.status }}</span>
            </div>
            <div v-if="selectedIncidentData.incident_type" class="meta-row">
              <span class="meta-label"
                >{{ $t("incidents.incidentType") }}:</span
              >
              <span class="meta-value">{{
                selectedIncidentData.incident_type
              }}</span>
            </div>
            <div v-if="selectedIncidentData.responsible_party" class="meta-row">
              <span class="meta-label"
                >{{ $t("incidents.responsibleParty") }}:</span
              >
              <span class="meta-value">{{
                selectedIncidentData.responsible_party
              }}</span>
            </div>
            <div
              v-if="selectedIncidentData.impact_description"
              class="meta-row"
            >
              <span class="meta-label"
                >{{ $t("incidents.impactDescription") }}:</span
              >
              <span class="meta-value">{{
                selectedIncidentData.impact_description
              }}</span>
            </div>
          </div>

          <!-- Copy link section -->
          <div
            class="mt-6 pt-4 border-t border-gray-200"
            data-testid="copy-link-section"
          >
            <button
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              data-testid="copy-incident-link-button"
              @click="copyLink"
            >
              <component
                :is="showCopied ? Check : Copy"
                class="w-4 h-4"
                :class="{ 'text-green-500': showCopied }"
              />
              <span>{{
                showCopied ? $t("copied") : $t("incidents.copyLink")
              }}</span>
            </button>
          </div>

          <div class="entries-section">
            <h3>
              {{ $t("incidents.entries") }}
              ({{ selectedIncidentEntries?.length || 0 }})
            </h3>

            <div
              v-if="
                !selectedIncidentEntries || selectedIncidentEntries.length === 0
              "
              class="empty-state"
            >
              <p>{{ $t("incidents.noEntries") }}</p>
            </div>

            <div v-else class="sources-list">
              <div
                v-for="entry in selectedIncidentEntries"
                :key="entry.id"
                class="source-item"
              >
                <div class="source-info">
                  <span class="source-table">{{ entry.source_table }}</span>
                  <span class="source-id">{{ entry.source_id }}</span>
                  <span v-if="entry.notes" class="source-notes">
                    {{ entry.notes }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <template v-else>
        <!-- Selected Sources Section -->
        <div v-if="selectedSources.length > 0" class="selected-sources">
          <h3>
            {{ $t("incidents.selectedSources") }} ({{ selectedSources.length }})
          </h3>
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
                :title="$t('remove')"
                @click="
                  emit('removeSource', source.source_table, source.source_id)
                "
              >
                ×
              </button>
            </div>
          </div>
          <button class="clear-btn" @click="emit('clearSources')">
            {{ $t("incidents.clearAll") }}
          </button>
        </div>

        <!-- Create Incident Form -->
        <div v-if="showCreateForm" class="create-form">
          <h3>{{ $t("incidents.createNewIncident") }}</h3>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="name">{{ $t("incidents.name") }} *</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                :placeholder="$t('incidents.enterIncidentName')"
              />
            </div>

            <div class="form-group">
              <label for="description">{{ $t("incidents.description") }}</label>
              <textarea
                id="description"
                v-model="formData.description"
                rows="3"
                :placeholder="$t('incidents.enterDescription')"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="incident_type">{{
                $t("incidents.incidentType")
              }}</label>
              <select id="incident_type" v-model="formData.incident_type">
                <option value="">{{ $t("incidents.selectType") }}</option>
                <option
                  v-for="type in incidentTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="responsible_party">{{
                $t("incidents.responsibleParty")
              }}</label>
              <input
                id="responsible_party"
                v-model="formData.responsible_party"
                type="text"
                :placeholder="$t('incidents.enterResponsibleParty')"
              />
            </div>

            <div class="form-group">
              <label for="impact_description">{{
                $t("incidents.impactDescription")
              }}</label>
              <textarea
                id="impact_description"
                v-model="formData.impact_description"
                rows="3"
                :placeholder="$t('incidents.describeImpact')"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" :disabled="isCreating" class="submit-btn">
                {{
                  isCreating
                    ? $t("incidents.creating")
                    : $t("incidents.createIncident")
                }}
              </button>
              <button
                type="button"
                class="cancel-btn"
                @click="showCreateForm = false"
              >
                {{ $t("cancel") }}
              </button>
            </div>
          </form>
        </div>

        <!-- Incidents List -->
        <!-- Hide saved incidents when creating a new incident or when sources are selected -->
        <div
          v-if="!showCreateForm && selectedSources.length === 0"
          class="incidents-list"
        >
          <div v-if="isLoading" class="loading">
            {{ $t("incidents.loadingIncidents") }}
          </div>

          <div v-else-if="incidents.length === 0" class="empty-state">
            <p>{{ $t("incidents.noIncidentsYet") }}</p>
          </div>

          <div v-else class="incidents-items">
            <div
              v-for="incident in incidents"
              :key="incident.id"
              class="incident-item"
              role="button"
              tabindex="0"
              @mouseenter="emit('hoverIncident', incident.id)"
              @focus="emit('hoverIncident', incident.id)"
              @click="emit('selectIncident', incident.id)"
              @keydown.enter="emit('selectIncident', incident.id)"
            >
              <div class="incident-header">
                <h4>{{ incident.name }}</h4>
                <span class="incident-type">{{
                  incident.collection_type
                }}</span>
              </div>
              <p v-if="incident.description" class="incident-description">
                {{ incident.description }}
              </p>
              <div class="incident-meta">
                <span
                  >{{ $t("incidents.created") }}:
                  {{ new Date(incident.created_at).toLocaleDateString() }}</span
                >
                <span>{{ $t("incidents.by") }}: {{ incident.created_by }}</span>
              </div>
            </div>

            <div v-if="hasMoreIncidents" class="load-more">
              <button
                class="load-more-btn"
                type="button"
                :disabled="isLoading || isLoadingMore"
                @click="emit('loadMoreIncidents')"
              >
                {{
                  isLoadingMore
                    ? $t("incidents.loadingMore")
                    : $t("incidents.loadMore")
                }}
              </button>
            </div>
          </div>
        </div>

        <!-- Show "Create Incident" button when sources are selected but form is not shown -->
        <div
          v-if="!showCreateForm && selectedSources.length > 0"
          class="new-incident-prompt"
        >
          <button class="create-btn" @click="showCreateForm = true">
            {{ $t("incidents.createNewIncident") }}
          </button>
        </div>
      </template>
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

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  color: #333;
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

.load-more {
  margin-top: 8px;
}

.load-more-btn {
  width: 100%;
  padding: 10px;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.load-more-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.incident-item {
  padding: 12px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
}

.incident-item:hover {
  background: #f0f0f0;
}

.incident-item:focus {
  outline: 2px solid #4a90e2;
  outline-offset: 2px;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-row {
  display: flex;
  gap: 6px;
  font-size: 13px;
}

.meta-label {
  font-weight: 600;
  color: #333;
}

.meta-value {
  color: #666;
}

.entries-section {
  margin-top: 16px;
}

.source-notes {
  font-size: 12px;
  color: #666;
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

.new-incident-prompt {
  margin-top: 24px;
  text-align: center;
  padding: 16px;
}

.new-incident-prompt .create-btn {
  width: 100%;
}
</style>
