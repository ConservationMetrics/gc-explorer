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
  <div class="space-y-6">
    <!-- MEDIA_BASE_PATH -->
    <div v-if="keys.includes('MEDIA_BASE_PATH')" class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">
        {{ $t(toCamelCase("MEDIA_BASE_PATH")) }}
      </label>

      <div class="space-y-2">
        <label
          :for="`${tableName}-provider-basePath`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t("mediaProvider") }}
        </label>
        <select
          :id="`${tableName}-provider-basePath`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
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
        <div class="space-y-2">
          <label
            :for="`${tableName}-share-basePath`"
            class="block text-sm font-medium text-gray-700"
          >
            {{ $t("mediaPasteFilebrowserShareUrlOrHash") }}
          </label>
          <input
            :id="`${tableName}-share-basePath`"
            class="w-full px-4 py-2 border rounded-lg transition-colors"
            :class="{
              'border-red-300 focus:ring-red-500 focus:border-red-500':
                !isBasePathValid && shareInputBasePath,
              'border-gray-300 focus:ring-purple-500 focus:border-purple-500':
                isBasePathValid || !shareInputBasePath,
            }"
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
            class="text-sm text-red-600"
          >
            {{ $t("mediaInvalidFormat") }}
          </p>
          <p class="text-xs text-gray-500">
            <strong>{{ $t("mediaAccepts") }}</strong>
            <code class="px-1 py-0.5 bg-gray-100 rounded"
              >https://files.example.com/share/abc123</code
            >,
            <code class="px-1 py-0.5 bg-gray-100 rounded"
              >https://files.example.com/api/public/dl/abc123</code
            >,
            {{ $t("or") }}
            <code class="px-1 py-0.5 bg-gray-100 rounded">abc123</code>
          </p>
        </div>
      </template>

      <template v-else>
        <div class="space-y-2">
          <label
            :for="`${tableName}-baseUrl-generic-basePath`"
            class="block text-sm font-medium text-gray-700"
          >
            {{ $t("mediaBaseUrl") }}
          </label>
          <input
            :id="`${tableName}-baseUrl-generic-basePath`"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
      class="space-y-4"
    >
      <label class="block text-sm font-medium text-gray-700">
        {{ $t(toCamelCase("MEDIA_BASE_PATH_ALERTS")) }}
      </label>

      <div class="space-y-2">
        <label
          :for="`${tableName}-provider-alerts`"
          class="block text-sm font-medium text-gray-700"
        >
          {{ $t("mediaProvider") }}
        </label>
        <select
          :id="`${tableName}-provider-alerts`"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
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
        <div class="space-y-2">
          <label
            :for="`${tableName}-share-alerts`"
            class="block text-sm font-medium text-gray-700"
          >
            {{ $t("mediaPasteFilebrowserShareUrlOrHash") }}
          </label>
          <input
            :id="`${tableName}-share-alerts`"
            class="w-full px-4 py-2 border rounded-lg transition-colors"
            :class="{
              'border-red-300 focus:ring-red-500 focus:border-red-500':
                !isAlertsValid && shareInputAlerts,
              'border-gray-300 focus:ring-purple-500 focus:border-purple-500':
                isAlertsValid || !shareInputAlerts,
            }"
            type="text"
            :value="shareInputAlerts"
            placeholder="https://files.example.com/share/abc123 or abc123"
            pattern="^(https?://[^\s]+/(?:share|api/public/dl)/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)$"
            @input="
              handleInput('alerts', ($event.target as HTMLInputElement).value)
            "
          />
          <p
            v-if="!isAlertsValid && shareInputAlerts"
            class="text-sm text-red-600"
          >
            {{ $t("mediaInvalidFormat") }}
          </p>
          <p class="text-xs text-gray-500">
            <strong>{{ $t("mediaAccepts") }}</strong>
            <code class="px-1 py-0.5 bg-gray-100 rounded"
              >https://files.example.com/share/abc123</code
            >,
            <code class="px-1 py-0.5 bg-gray-100 rounded"
              >https://files.example.com/api/public/dl/abc123</code
            >,
            {{ $t("or") }}
            <code class="px-1 py-0.5 bg-gray-100 rounded">abc123</code>
          </p>
        </div>
      </template>

      <template v-else>
        <div class="space-y-2">
          <label
            :for="`${tableName}-baseUrl-generic-alerts`"
            class="block text-sm font-medium text-gray-700"
          >
            {{ $t("mediaBaseUrl") }}
          </label>
          <input
            :id="`${tableName}-baseUrl-generic-alerts`"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
    <div v-if="keys.includes('MEDIA_COLUMN')" class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        {{ $t(toCamelCase("MEDIA_COLUMN")) }}
      </label>
      <p class="text-xs text-gray-500 mb-2">
        {{ $t("mediaColumnDescription") }}
      </p>
      <input
        :id="`${tableName}-media-column`"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        type="text"
        :value="mediaColumn"
        placeholder="photo"
        @input="mediaColumn = ($event.target as HTMLInputElement).value"
      />
    </div>
  </div>
</template>
