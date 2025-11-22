<script setup lang="ts">
import { toCamelCase } from "@/utils";
import {
  extractShareId,
  deriveFilesOrigin,
  buildFilebrowserBase,
  getBaseUrlFromInput,
  isValidFilebrowserInput,
} from "@/utils/media";
import type { ViewConfig } from "@/types/types";

const props = defineProps<{
  tableName: string;
  config: ViewConfig;
  views: string[];
  keys: string[];
}>();

const emit = defineEmits<{
  (e: "updateConfig", payload: Partial<ViewConfig>): void;
}>();

type MediaProvider = "filebrowser" | "generic";

// State
const providerBasePath = ref<MediaProvider>("filebrowser");
const shareInputBasePath = ref("");
const providerAlerts = ref<MediaProvider>("filebrowser");
const shareInputAlerts = ref("");
const mediaColumn = ref("");
const isInitializing = ref(true);

/**
 * Gets the default Filebrowser base URL from the current hostname.
 * @example
 * // If hostname is "explorer.demo.guardianconnector.net"
 * // Returns: "https://files.demo.guardianconnector.net/api/public/dl/"
 */
const getDefaultBaseUrl = () => {
  if (typeof window === "undefined") return "";
  return buildFilebrowserBase(deriveFilesOrigin(window.location.hostname));
};

const defaultBaseUrl = getDefaultBaseUrl();

// Computed
const resolvedBasePath = computed(() => {
  if (providerBasePath.value === "filebrowser") {
    const shareId = extractShareId(shareInputBasePath.value);
    if (!shareId) return "";
    const baseUrl = getBaseUrlFromInput(
      shareInputBasePath.value,
      defaultBaseUrl,
    );
    return `${baseUrl.replace(/\/+$/, "")}/${shareId}`;
  }
  return shareInputBasePath.value || "";
});

const resolvedAlertsPath = computed(() => {
  if (providerAlerts.value === "filebrowser") {
    const shareId = extractShareId(shareInputAlerts.value);
    if (!shareId) return "";
    const baseUrl = getBaseUrlFromInput(shareInputAlerts.value, defaultBaseUrl);
    return `${baseUrl.replace(/\/+$/, "")}/${shareId}`;
  }
  return shareInputAlerts.value || "";
});

const isBasePathValid = computed(() => {
  if (providerBasePath.value === "filebrowser") {
    return isValidFilebrowserInput(shareInputBasePath.value);
  }
  return true;
});

const isAlertsValid = computed(() => {
  if (providerAlerts.value === "filebrowser") {
    return isValidFilebrowserInput(shareInputAlerts.value);
  }
  return true;
});

// Handlers
const handleInput = (key: "basePath" | "alerts", value: string) => {
  if (key === "basePath") {
    shareInputBasePath.value = value;
  } else {
    shareInputAlerts.value = value;
  }
};

const handleProviderChange = (
  key: "basePath" | "alerts",
  value: MediaProvider,
) => {
  if (key === "basePath") {
    providerBasePath.value = value;
  } else {
    providerAlerts.value = value;
  }
};

// Watchers
watch(resolvedBasePath, (newValue) => {
  if (!isInitializing.value) {
    emit("updateConfig", { MEDIA_BASE_PATH: newValue });
  }
});

watch(resolvedAlertsPath, (newValue) => {
  if (!isInitializing.value) {
    emit("updateConfig", { MEDIA_BASE_PATH_ALERTS: newValue });
  }
});

watch(mediaColumn, (newValue) => {
  if (!isInitializing.value) {
    emit("updateConfig", { MEDIA_COLUMN: newValue });
  }
});

// Lifecycle
onMounted(() => {
  if (props.config.MEDIA_BASE_PATH) {
    const existing = props.config.MEDIA_BASE_PATH;
    if (existing.includes("/api/public/dl/")) {
      providerBasePath.value = "filebrowser";
      const parts = existing.split("/api/public/dl/");
      if (parts.length === 2) {
        shareInputBasePath.value = parts[1].replace(/\/+$/, "");
      } else {
        providerBasePath.value = "generic";
        shareInputBasePath.value = existing;
      }
    } else {
      providerBasePath.value = "generic";
      shareInputBasePath.value = existing;
    }
  }

  if (props.config.MEDIA_BASE_PATH_ALERTS) {
    const existing = props.config.MEDIA_BASE_PATH_ALERTS;
    if (existing.includes("/api/public/dl/")) {
      providerAlerts.value = "filebrowser";
      const parts = existing.split("/api/public/dl/");
      if (parts.length === 2) {
        shareInputAlerts.value = parts[1].replace(/\/+$/, "");
      } else {
        providerAlerts.value = "generic";
        shareInputAlerts.value = existing;
      }
    } else {
      providerAlerts.value = "generic";
      shareInputAlerts.value = existing;
    }
  }

  if (props.config.MEDIA_COLUMN) {
    mediaColumn.value = props.config.MEDIA_COLUMN;
  }

  nextTick(() => {
    isInitializing.value = false;
  });
});
</script>

<template>
  <div class="config-section">
    <div class="config-header">
      <h3>{{ $t("media") }} {{ $t("configuration") }}</h3>
    </div>

    <!-- MEDIA_BASE_PATH -->
    <div v-if="keys.includes('MEDIA_BASE_PATH')" class="config-field">
      <label>{{ $t(toCamelCase("MEDIA_BASE_PATH")) }}</label>

      <div class="media-provider-selector">
        <label
          :for="`${tableName}-provider-basePath`"
          class="media-field-label"
          >{{ $t("mediaProvider") }}</label
        >
        <select
          :id="`${tableName}-provider-basePath`"
          class="input-field"
          :value="providerBasePath"
          @change="
            handleProviderChange(
              'basePath',
              ($event.target as HTMLSelectElement).value as MediaProvider,
            )
          "
        >
          <option value="filebrowser">
            {{ $t("mediaFilebrowserDefault") }}
          </option>
          <option value="generic">{{ $t("mediaGenericHttpBaseUrl") }}</option>
        </select>
      </div>

      <template v-if="providerBasePath === 'filebrowser'">
        <div class="media-share-input">
          <label
            :for="`${tableName}-share-basePath`"
            class="media-field-label"
            >{{ $t("mediaPasteFilebrowserShareUrlOrHash") }}</label
          >
          <input
            :id="`${tableName}-share-basePath`"
            class="input-field"
            :class="{ 'input-invalid': !isBasePathValid && shareInputBasePath }"
            type="text"
            :value="shareInputBasePath"
            placeholder="https://files.example.com/share/abc123 or abc123"
            pattern="^(https?://[^\s]+/(?:share|api/public/dl)/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)$"
            @input="
              handleInput('basePath', ($event.target as HTMLInputElement).value)
            "
          />
          <p
            v-if="!isBasePathValid && shareInputBasePath"
            class="validation-error"
          >
            {{ $t("mediaInvalidFormat") }}
          </p>
          <p class="field-hint">
            <strong>{{ $t("mediaAccepts") }}</strong>
            <code>https://files.example.com/share/abc123</code>,
            <code>https://files.example.com/api/public/dl/abc123</code>,
            {{ $t("or") }}
            <code>abc123</code>
          </p>
        </div>
      </template>

      <template v-else>
        <div class="media-base-url">
          <label
            :for="`${tableName}-baseUrl-generic-basePath`"
            class="media-field-label"
            >{{ $t("mediaBaseUrl") }}</label
          >
          <input
            :id="`${tableName}-baseUrl-generic-basePath`"
            class="input-field"
            type="url"
            :value="shareInputBasePath"
            placeholder="https://your-files-host.example/api/public/dl/"
            @input="
              handleInput('basePath', ($event.target as HTMLInputElement).value)
            "
          />
        </div>
      </template>
    </div>

    <!-- MEDIA_BASE_PATH_ALERTS -->
    <div
      v-if="keys.includes('MEDIA_BASE_PATH_ALERTS') && views.includes('alerts')"
      class="config-field"
    >
      <label>{{ $t(toCamelCase("MEDIA_BASE_PATH_ALERTS")) }}</label>

      <div class="media-provider-selector">
        <label
          :for="`${tableName}-provider-alerts`"
          class="media-field-label"
          >{{ $t("mediaProvider") }}</label
        >
        <select
          :id="`${tableName}-provider-alerts`"
          class="input-field"
          :value="providerAlerts"
          @change="
            handleProviderChange(
              'alerts',
              ($event.target as HTMLSelectElement).value as MediaProvider,
            )
          "
        >
          <option value="filebrowser">
            {{ $t("mediaFilebrowserDefault") }}
          </option>
          <option value="generic">{{ $t("mediaGenericHttpBaseUrl") }}</option>
        </select>
      </div>

      <template v-if="providerAlerts === 'filebrowser'">
        <div class="media-share-input">
          <label :for="`${tableName}-share-alerts`" class="media-field-label">{{
            $t("mediaPasteFilebrowserShareUrlOrHash")
          }}</label>
          <input
            :id="`${tableName}-share-alerts`"
            class="input-field"
            :class="{ 'input-invalid': !isAlertsValid && shareInputAlerts }"
            type="text"
            :value="shareInputAlerts"
            placeholder="https://files.example.com/share/abc123 or abc123"
            pattern="^(https?://[^\s]+/(?:share|api/public/dl)/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)$"
            @input="
              handleInput('alerts', ($event.target as HTMLInputElement).value)
            "
          />
          <p v-if="!isAlertsValid && shareInputAlerts" class="validation-error">
            {{ $t("mediaInvalidFormat") }}
          </p>
          <p class="field-hint">
            <strong>{{ $t("mediaAccepts") }}</strong>
            <code>https://files.example.com/share/abc123</code>,
            <code>https://files.example.com/api/public/dl/abc123</code>,
            {{ $t("or") }}
            <code>abc123</code>
          </p>
        </div>
      </template>

      <template v-else>
        <div class="media-base-url">
          <label
            :for="`${tableName}-baseUrl-generic-alerts`"
            class="media-field-label"
            >{{ $t("mediaBaseUrl") }}</label
          >
          <input
            :id="`${tableName}-baseUrl-generic-alerts`"
            class="input-field"
            type="url"
            :value="shareInputAlerts"
            placeholder="https://your-files-host.example/api/public/dl/"
            @input="
              handleInput('alerts', ($event.target as HTMLInputElement).value)
            "
          />
        </div>
      </template>
    </div>

    <!-- MEDIA_COLUMN -->
    <div v-if="keys.includes('MEDIA_COLUMN')" class="config-field">
      <label>{{ $t(toCamelCase("MEDIA_COLUMN")) }}</label>
      <p class="field-hint" style="margin-top: 0; margin-bottom: 0.75em">
        {{ $t("mediaColumnDescription") }}
      </p>
      <input
        :id="`${tableName}-media-column`"
        class="input-field"
        type="text"
        :value="mediaColumn"
        placeholder="photo"
        @input="mediaColumn = ($event.target as HTMLInputElement).value"
      />
    </div>
  </div>
</template>

<style scoped>
.media-field-label {
  font-size: 0.95em;
  font-weight: 500;
  color: #555;
  font-style: italic;
  letter-spacing: 0.3px;
  padding-left: 0.5em;
  border-left: 3px solid #999;
  margin-bottom: 0.5em;
  display: block;
}

.media-provider-selector {
  margin-bottom: 1em;
}

.media-share-input {
  margin-bottom: 0;
}

.media-share-input .input-field {
  max-width: 100%;
  min-width: 500px;
}

.field-hint {
  margin: 0.5em 0 0 0;
  font-size: 0.85em;
  color: #666;
  line-height: 1.5;
}

.field-hint code {
  background-color: #f3f4f6;
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  color: #333;
  font-family:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono",
    monospace;
}

.media-base-url {
  margin-bottom: 0;
}

.input-invalid {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.validation-error {
  margin: 0.5em 0 0 0;
  font-size: 0.85em;
  color: #dc3545;
}
</style>
