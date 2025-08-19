<script setup lang="ts">
import type { ViewConfig, User } from "@/types/types";
import { Role } from "@/types/types";

const props = defineProps<{
  tableName: string;
  viewConfig: ViewConfig;
}>();

const emit = defineEmits<{
  updateConfig: [config: ViewConfig];
}>();

const { user } = useUserSession();

const isRestricted = ref(props.viewConfig.isRestricted || false);

// Only show permissions section for admins
const shouldShowPermissions = computed(() => {
  if (!user.value) return false;
  const typedUser = user.value as User;
  const userRole = typedUser.userRole || Role.Viewer;
  return userRole >= Role.Admin;
});

const handleRestrictionChange = () => {
  const updatedConfig = {
    ...props.viewConfig,
    isRestricted: isRestricted.value,
  };
  emit("updateConfig", updatedConfig);
};
</script>

<template>
  <div v-if="shouldShowPermissions" class="permissions-section">
    <h3 class="text-lg font-semibold mb-3 text-gray-800">
      {{ $t("accessPermissions") || "Access Permissions" }}
    </h3>
    <div class="flex items-center space-x-3">
      <input
        id="restrict-view"
        v-model="isRestricted"
        type="checkbox"
        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        @change="handleRestrictionChange"
      />
      <label for="restrict-view" class="text-sm font-medium text-gray-700">
        {{ $t("restrictView") }}
      </label>
    </div>
    <p class="text-xs text-gray-500 mt-2">
      {{ $t("restrictViewDescription") }}
    </p>
  </div>
</template>

<style scoped>
.permissions-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 1rem;
}
</style>
