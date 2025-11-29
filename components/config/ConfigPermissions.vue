<script setup lang="ts">
import type { ViewConfig, User, RouteLevelPermission } from "@/types/types";
import { Role } from "@/types/types";

const props = defineProps<{
  tableName: string;
  viewConfig: ViewConfig;
}>();

const emit = defineEmits<{
  updateConfig: [config: ViewConfig];
  updateValidation: [isValid: boolean];
}>();

const { user } = useUserSession();

// Allow undefined state - no default value
const routeLevelPermission = ref<RouteLevelPermission | undefined>(
  props.viewConfig.ROUTE_LEVEL_PERMISSION,
);

// Only show permissions section for admins
const shouldShowPermissions = computed(() => {
  if (!user.value) return false;
  const typedUser = user.value as User;
  const userRole = typedUser.userRole ?? Role.SignedIn;
  return userRole >= Role.Admin;
});

// Computed property to check if permission is selected
const isPermissionSelected = computed(() => {
  return routeLevelPermission.value !== undefined;
});

// Watch for config changes to sync permission value
watch(
  () => props.viewConfig.ROUTE_LEVEL_PERMISSION,
  (newPermission) => {
    if (newPermission !== routeLevelPermission.value) {
      routeLevelPermission.value = newPermission;
    }
  },
);

// Watch for changes and emit updates
watch(routeLevelPermission, (newPermission) => {
  const updatedConfig = {
    ...props.viewConfig,
    ROUTE_LEVEL_PERMISSION: newPermission,
  };
  emit("updateConfig", updatedConfig);
});

// Watch for validation changes and emit to parent
watch(
  isPermissionSelected,
  (isValid) => {
    emit("updateValidation", isValid);
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="shouldShowPermissions" class="config-section">
    <div class="config-header">
      <h3>{{ $t("visibility") }}</h3>
    </div>
    <p class="text-gray-500 text-sm mb-4 leading-relaxed">
      {{ $t("visibilityHelpText") }}
    </p>

    <!-- Warning when no permission is selected -->
    <div
      v-if="!isPermissionSelected"
      class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4"
    >
      <p class="text-sm font-medium">
        ⚠️
        {{
          $t("visibilityRequired") ||
          "Please select a visibility level for this dataset."
        }}
      </p>
    </div>

    <div class="flex flex-col gap-4">
      <label
        class="flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-100"
      >
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="anyone"
          class="mt-0.5 flex-shrink-0"
        />
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-700">{{
            $t("visibilityPublic")
          }}</span>
          <span class="text-sm text-gray-500 leading-relaxed">{{
            $t("visibilityPublicDescription")
          }}</span>
        </div>
      </label>

      <label
        class="flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-100"
      >
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="guest"
          class="mt-0.5 flex-shrink-0"
        />
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-700">{{
            $t("visibilityGuest")
          }}</span>
          <span class="text-sm text-gray-500 leading-relaxed">{{
            $t("visibilityGuestDescription")
          }}</span>
        </div>
      </label>

      <label
        class="flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-100"
      >
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="member"
          class="mt-0.5 flex-shrink-0"
        />
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-700">{{
            $t("visibilityMembers")
          }}</span>
          <span class="text-sm text-gray-500 leading-relaxed">{{
            $t("visibilityMembersDescription")
          }}</span>
        </div>
      </label>

      <label
        class="flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-100"
      >
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="admin"
          class="mt-0.5 flex-shrink-0"
        />
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-700">{{
            $t("visibilityAdmins")
          }}</span>
          <span class="text-sm text-gray-500 leading-relaxed">{{
            $t("visibilityAdminsDescription")
          }}</span>
        </div>
      </label>
    </div>
  </div>
</template>
