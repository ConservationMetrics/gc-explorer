<script setup lang="ts">
import ConfigColumnSelect from "@/components/config/ConfigColumnSelect.vue";
import ConfigFieldLabel from "@/components/config/ConfigFieldLabel.vue";
import ConfigSubsectionHeader from "@/components/config/ConfigSubsectionHeader.vue";
import { FolderOpen, Info } from "lucide-vue-next";
import { toCamelCase } from "@/utils/identifierUtils";
import {
  extractShareId,
  deriveFilesOrigin,
  buildFilebrowserBase,
  getBaseUrlFromInput,
  isValidFilebrowserInput,
} from "@/utils/mediaHelpers";
import type { ColumnEntry, ViewConfig } from "@/types";

const props = defineProps<{
  tableName: string;
  config: ViewConfig;
  views: string[];
  keys: string[];
  columns?: ColumnEntry[];
  columnsLoading?: boolean;
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
const providerIcons = ref<MediaProvider>("filebrowser");
const shareInputIcons = ref("");
const isInitializing = ref(true);

/**
 * Gets the Filebrowser origin and public-download base URL from the hostname.
 * @example
 * // If hostname is "explorer.demo.guardianconnector.net"
 * // origin: "https://files.demo.guardianconnector.net"
 * // baseUrl: "https://files.demo.guardianconnector.net/api/public/dl/"
 */
const getDefaultFilesUrls = () => {
  if (typeof window === "undefined") return { origin: "", baseUrl: "" };
  const origin = deriveFilesOrigin(window.location.hostname);
  return { origin, baseUrl: buildFilebrowserBase(origin) };
};

const { origin: defaultFilesOrigin, baseUrl: defaultBaseUrl } =
  getDefaultFilesUrls();

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

const resolvedIconsPath = computed(() => {
  if (providerIcons.value === "filebrowser") {
    const shareId = extractShareId(shareInputIcons.value);
    if (!shareId) return "";
    const baseUrl = getBaseUrlFromInput(shareInputIcons.value, defaultBaseUrl);
    return `${baseUrl.replace(/\/+$/, "")}/${shareId}`;
  }
  return shareInputIcons.value || "";
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

const isIconsValid = computed(() => {
  if (providerIcons.value === "filebrowser") {
    return isValidFilebrowserInput(shareInputIcons.value);
  }
  return true;
});

const showIconsBasePath = computed(
  () =>
    props.keys.includes("MEDIA_BASE_PATH_ICONS") &&
    props.views.includes("map") &&
    Boolean(props.config.ICON_COLUMN?.trim()),
);

// Handlers
const handleInput = (key: "basePath" | "alerts" | "icons", value: string) => {
  if (key === "basePath") {
    shareInputBasePath.value = value;
  } else if (key === "alerts") {
    shareInputAlerts.value = value;
  } else {
    shareInputIcons.value = value;
  }
};

const handleProviderChange = (
  key: "basePath" | "alerts" | "icons",
  value: MediaProvider,
) => {
  if (key === "basePath") {
    providerBasePath.value = value;
  } else if (key === "alerts") {
    providerAlerts.value = value;
  } else {
    providerIcons.value = value;
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

watch(resolvedIconsPath, (newValue) => {
  if (!isInitializing.value) {
    emit("updateConfig", { MEDIA_BASE_PATH_ICONS: newValue });
  }
});

// Keep local media fields in sync with the config prop (including the initial value).
watch(
  () => props.config,
  (config) => {
    isInitializing.value = true;

    if (config.MEDIA_BASE_PATH) {
      const existing = config.MEDIA_BASE_PATH;
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
    } else {
      shareInputBasePath.value = "";
    }

    if (config.MEDIA_BASE_PATH_ALERTS) {
      const existing = config.MEDIA_BASE_PATH_ALERTS;
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
    } else {
      shareInputAlerts.value = "";
    }

    if (config.MEDIA_BASE_PATH_ICONS) {
      const existing = config.MEDIA_BASE_PATH_ICONS;
      if (existing.includes("/api/public/dl/")) {
        providerIcons.value = "filebrowser";
        const parts = existing.split("/api/public/dl/");
        if (parts.length === 2) {
          shareInputIcons.value = parts[1].replace(/\/+$/, "");
        } else {
          providerIcons.value = "generic";
          shareInputIcons.value = existing;
        }
      } else {
        providerIcons.value = "generic";
        shareInputIcons.value = existing;
      }
    } else {
      shareInputIcons.value = "";
    }

    nextTick(() => {
      isInitializing.value = false;
    });
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6"
    data-testid="config-field-grid"
  >
    <aside
      class="flex gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 md:col-span-2"
    >
      <Info
        class="mt-0.5 h-5 w-5 shrink-0 text-violet-600"
        aria-hidden="true"
      />
      <div class="space-y-2 text-sm leading-relaxed text-violet-950">
        <p>
          <i18n-t keypath="mediaIntroBasePath" tag="span">
            <template #example>
              <code
                class="rounded bg-white/80 px-1 py-0.5 font-mono text-[0.85em]"
                >https://guardianconnector.net/images/</code
              >
            </template>
          </i18n-t>
        </p>
        <p>
          <i18n-t keypath="mediaIntroFilebrowser" tag="span">
            <template #link>
              <a
                v-if="defaultFilesOrigin"
                :href="defaultFilesOrigin"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="filebrowser-access-link"
                class="inline-flex items-center gap-1 font-medium text-violet-700 underline underline-offset-2 hover:text-violet-900"
              >
                <FolderOpen class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {{ $t("mediaIntroFilebrowserAccess") }}
              </a>
            </template>
          </i18n-t>
        </p>
        <p>
          <i18n-t keypath="mediaIntroFilebrowserDocs" tag="span">
            <template #link>
              <a
                href="https://docs.guardianconnector.net/reference/gc-toolkit/filebrowser/"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-violet-700 underline underline-offset-2 hover:text-violet-900"
              >
                {{ $t("mediaIntroFilebrowserLink") }}
              </a>
            </template>
          </i18n-t>
        </p>
      </div>
    </aside>

    <!-- MEDIA_BASE_PATH -->
    <div
      v-if="keys.includes('MEDIA_BASE_PATH')"
      class="space-y-4 md:col-span-2"
    >
      <ConfigSubsectionHeader :tooltip="$t('mediaBasePathTooltip')">
        {{ $t("mediaBasePath") }}
      </ConfigSubsectionHeader>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div class="space-y-2">
          <ConfigFieldLabel :for-id="`${tableName}-provider-basePath`">
            {{ $t("mediaProvider") }}
          </ConfigFieldLabel>
          <select
            :id="`${tableName}-provider-basePath`"
            class="w-full px-4 py-2 bg-violet-100 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
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
            <ConfigFieldLabel :for-id="`${tableName}-share-basePath`">
              {{ $t("mediaPasteFilebrowserShareUrlOrHash") }}
            </ConfigFieldLabel>
            <input
              :id="`${tableName}-share-basePath`"
              class="w-full px-4 py-2 bg-violet-100 border rounded-lg transition-colors"
              :class="{
                'border-red-300 focus:ring-red-500 focus:border-red-500':
                  !isBasePathValid && shareInputBasePath,
                'bg-violet-100 border-violet-200 focus:ring-violet-500 focus:border-violet-500':
                  isBasePathValid || !shareInputBasePath,
              }"
              type="text"
              :value="shareInputBasePath"
              placeholder="https://files.example.com/share/abc123 or abc123"
              @input="
                handleInput(
                  'basePath',
                  ($event.target as HTMLInputElement).value,
                )
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
            <ConfigFieldLabel :for-id="`${tableName}-baseUrl-generic-basePath`">
              {{ $t("mediaBaseUrl") }}
            </ConfigFieldLabel>
            <input
              :id="`${tableName}-baseUrl-generic-basePath`"
              class="w-full px-4 py-2 bg-violet-100 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
              type="url"
              :value="shareInputBasePath"
              placeholder="https://your-files-host.example/api/public/dl/"
              @input="
                handleInput(
                  'basePath',
                  ($event.target as HTMLInputElement).value,
                )
              "
            />
          </div>
        </template>
      </div>
    </div>

    <!-- MEDIA_BASE_PATH_ALERTS -->
    <div
      v-if="keys.includes('MEDIA_BASE_PATH_ALERTS') && views.includes('alerts')"
      class="space-y-4 md:col-span-2"
    >
      <ConfigSubsectionHeader>
        {{ $t("mediaBasePathAlerts") }}
      </ConfigSubsectionHeader>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div class="space-y-2">
          <ConfigFieldLabel :for-id="`${tableName}-provider-alerts`">
            {{ $t("mediaProvider") }}
          </ConfigFieldLabel>
          <select
            :id="`${tableName}-provider-alerts`"
            class="w-full px-4 py-2 bg-violet-100 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
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
            <ConfigFieldLabel :for-id="`${tableName}-share-alerts`">
              {{ $t("mediaPasteFilebrowserShareUrlOrHash") }}
            </ConfigFieldLabel>
            <input
              :id="`${tableName}-share-alerts`"
              class="w-full px-4 py-2 bg-violet-100 border rounded-lg transition-colors"
              :class="{
                'border-red-300 focus:ring-red-500 focus:border-red-500':
                  !isAlertsValid && shareInputAlerts,
                'bg-violet-100 border-violet-200 focus:ring-violet-500 focus:border-violet-500':
                  isAlertsValid || !shareInputAlerts,
              }"
              type="text"
              :value="shareInputAlerts"
              placeholder="https://files.example.com/share/abc123 or abc123"
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
            <ConfigFieldLabel :for-id="`${tableName}-baseUrl-generic-alerts`">
              {{ $t("mediaBaseUrl") }}
            </ConfigFieldLabel>
            <input
              :id="`${tableName}-baseUrl-generic-alerts`"
              class="w-full px-4 py-2 bg-violet-100 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
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

    <!-- MEDIA_BASE_PATH_ICONS -->
    <div v-if="showIconsBasePath" class="space-y-4 md:col-span-2">
      <ConfigSubsectionHeader :tooltip="$t('mediaBasePathIconsTooltip')">
        {{ $t("mediaBasePathIcons") }}
      </ConfigSubsectionHeader>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div class="space-y-2">
          <ConfigFieldLabel :for-id="`${tableName}-provider-icons`">
            {{ $t("mediaProvider") }}
          </ConfigFieldLabel>
          <select
            :id="`${tableName}-provider-icons`"
            class="w-full px-4 py-2 bg-violet-100 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
            :value="providerIcons"
            @change="
              handleProviderChange(
                'icons',
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

        <template v-if="providerIcons === 'filebrowser'">
          <div class="space-y-2">
            <ConfigFieldLabel :for-id="`${tableName}-share-icons`">
              {{ $t("mediaPasteFilebrowserShareUrlOrHash") }}
            </ConfigFieldLabel>
            <input
              :id="`${tableName}-share-icons`"
              class="w-full px-4 py-2 bg-violet-100 border rounded-lg transition-colors"
              :class="{
                'border-red-300 focus:ring-red-500 focus:border-red-500':
                  !isIconsValid && shareInputIcons,
                'bg-violet-100 border-violet-200 focus:ring-violet-500 focus:border-violet-500':
                  isIconsValid || !shareInputIcons,
              }"
              type="text"
              :value="shareInputIcons"
              placeholder="https://files.example.com/share/abc123 or abc123"
              @input="
                handleInput('icons', ($event.target as HTMLInputElement).value)
              "
            />
            <p
              v-if="!isIconsValid && shareInputIcons"
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
            <ConfigFieldLabel :for-id="`${tableName}-baseUrl-generic-icons`">
              {{ $t("mediaBaseUrl") }}
            </ConfigFieldLabel>
            <input
              :id="`${tableName}-baseUrl-generic-icons`"
              class="w-full px-4 py-2 bg-violet-100 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
              type="url"
              :value="shareInputIcons"
              placeholder="https://your-files-host.example/api/public/dl/"
              @input="
                handleInput('icons', ($event.target as HTMLInputElement).value)
              "
            />
          </div>
        </template>
      </div>
    </div>

    <!-- MEDIA_COLUMN -->
    <div
      v-if="
        keys.includes('MEDIA_COLUMN') &&
        (views.includes('map') || views.includes('gallery'))
      "
      class="space-y-2"
    >
      <ConfigColumnSelect
        :id="`${tableName}-media-column`"
        :model-value="config.MEDIA_COLUMN"
        :label="$t(toCamelCase('MEDIA_COLUMN'))"
        :placeholder="$t('selectColumn')"
        :columns="columns ?? []"
        :loading="columnsLoading"
        @update:model-value="
          (value) => emit('updateConfig', { MEDIA_COLUMN: value })
        "
      />
      <p class="text-gray-500 text-sm">
        <i18n-t keypath="mediaColumnDescription" tag="span">
          <template #photo>
            <code
              class="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em]"
              >photo</code
            >
          </template>
          <template #audio>
            <code
              class="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em]"
              >audio</code
            >
          </template>
          <template #all>
            <strong>{{ $t("mediaColumnDescriptionAll") }}</strong>
          </template>
        </i18n-t>
      </p>
    </div>
  </div>
</template>
