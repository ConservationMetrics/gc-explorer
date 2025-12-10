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
  <div v-if="shouldShowPermissions" class="space-y-4">
    <p class="text-gray-600 text-sm leading-relaxed">
      {{ $t("visibilityHelpText") }}
    </p>

    <div
      v-if="!isPermissionSelected"
      class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded"
    >
      <p class="text-sm font-medium text-yellow-800">
        ⚠️
        {{
          $t("visibilityRequired") ||
          "Please select a visibility level for this dataset."
        }}
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <label
        class="flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200"
        :class="
          routeLevelPermission === 'anyone'
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
        "
      >
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="anyone"
          class="mt-0.5 flex-shrink-0 w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500"
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
        class="flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200"
        :class="
          routeLevelPermission === 'guest'
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
        "
      >
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="guest"
          class="mt-0.5 flex-shrink-0 w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500"
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
        class="flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200"
        :class="
          routeLevelPermission === 'member'
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
        "
      >
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="member"
          class="mt-0.5 flex-shrink-0 w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500"
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
        class="flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200"
        :class="
          routeLevelPermission === 'admin'
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
        "
      >
        <input
          v-model="routeLevelPermission"
          type="radio"
          value="admin"
          class="mt-0.5 flex-shrink-0 w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500"
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
