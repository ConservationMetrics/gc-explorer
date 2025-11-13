<script setup lang="ts">
import { toCamelCase } from "@/utils";
import type { ViewConfig } from "@/types/types";

defineProps<{
  tableName: string;
  config: ViewConfig;
  views: string[];
  keys: string[];
}>();

const emit = defineEmits<{
  (e: "updateConfig", payload: Partial<ViewConfig>): void;
}>();

const handleInput = (key: string, value: string) => {
  emit("updateConfig", { [key]: value });
};
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
            {{ $t("mediaFilebrowserGcDefault") }}
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
