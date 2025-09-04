<script setup lang="ts">
import type { ViewConfig, User, RouteLevelPermission } from "@/types/types";
import { Role } from "@/types/types";

const props = defineProps<{
  tableName: string;
  viewConfig: ViewConfig;
}>();

const emit = defineEmits<{
  updateConfig: [config: ViewConfig];
}>();

const { user } = useUserSession();

// Default to 'member-and-above' if no permission is set
const routeLevelPermission = ref<RouteLevelPermission>(props.viewConfig.routeLevelPermission ?? 'member-and-above');

// Only show permissions section for admins
const shouldShowPermissions = computed(() => {
  if (!user.value) return false;
  const typedUser = user.value as User;
  const userRole = typedUser.userRole || Role.Viewer;
  return userRole >= Role.Admin;
});

// Watch for changes and emit updates
watch(routeLevelPermission, (newPermission) => {
  const updatedConfig = {
    ...props.viewConfig,
    routeLevelPermission: newPermission,
  };
  emit("updateConfig", updatedConfig);
});
</script>

<template>
  <div v-if="shouldShowPermissions" class="config-section">
    <div class="config-header">
      <h3>{{ $t("visibility") }}</h3>
    </div>
    <p class="text-gray-500 text-sm mb-4 leading-relaxed">{{ $t("visibilityHelpText") }}</p>
    
    <div class="flex flex-col gap-4">
      <label class="flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-100">
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="anyone"
          class="mt-0.5 flex-shrink-0"
        />
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-700">{{ $t("visibilityPublic") }}</span>
          <span class="text-sm text-gray-500 leading-relaxed">{{ $t("visibilityPublicDescription") }}</span>
        </div>
      </label>
      
      <label class="flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-100">
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="signed-in"
          class="mt-0.5 flex-shrink-0"
        />
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-700">{{ $t("visibilityViewer") }}</span>
          <span class="text-sm text-gray-500 leading-relaxed">{{ $t("visibilityViewerDescription") }}</span>
        </div>
      </label>
      
      <label class="flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-100">
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="member-and-above"
          class="mt-0.5 flex-shrink-0"
        />
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-700">{{ $t("visibilityMembers") }}</span>
          <span class="text-sm text-gray-500 leading-relaxed">{{ $t("visibilityMembersDescription") }}</span>
        </div>
      </label>
    </div>
  </div>
</template>

