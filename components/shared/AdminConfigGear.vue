<script setup lang="ts">
import { Settings } from "lucide-vue-next";
import type { ViewType } from "@/types";
import { encodeDatasetNameForUrl } from "@/utils/identifierUtils";
import { useCanManageConfig } from "@/composables/useCanManageConfig";

const props = defineProps<{
  tableName: string;
  viewType: ViewType;
}>();

const canManageConfig = useCanManageConfig();

const configEditPath = computed(() => ({
  path: `/config/${encodeDatasetNameForUrl(props.tableName)}`,
  query: { view_type: props.viewType },
}));
</script>

<template>
  <NuxtLink
    v-if="canManageConfig"
    :to="configEditPath"
    target="_blank"
    rel="noopener noreferrer"
    data-testid="admin-config-gear"
    class="flex-shrink-0 p-1.5 text-gray-500 hover:text-violet-700 hover:bg-violet-100 rounded-lg transition-colors"
    :aria-label="$t('accessConfig')"
    :title="$t('accessConfig')"
    @click.stop
  >
    <Settings class="w-4 h-4" />
  </NuxtLink>
</template>
