import { computed } from "vue";
import type { ComputedRef } from "vue";
import { useRuntimeConfig, useUserSession } from "#imports";
import type { User } from "@/types";
import { Role } from "@/types";

/**
 * Whether the current user has at least the specified role level (or authStrategy is "none").
 *
 * @param {Role} [minRole=Role.Member] - Minimum role required (defaults to Role.Member).
 * @returns {ComputedRef<boolean>} True when the user has sufficient permissions.
 */
export const useHasRole = (
  minRole: Role = Role.Member,
): ComputedRef<boolean> => {
  const {
    public: { authStrategy },
  } = useRuntimeConfig();
  const { loggedIn, user } = useUserSession();

  return computed(() => {
    if (authStrategy === "none") {
      return true;
    }

    if (authStrategy === "auth0" && loggedIn.value && user.value) {
      const typedUser = user.value as User | null;
      const userRole = typedUser?.userRole ?? Role.SignedIn;
      return userRole >= minRole;
    }

    return false;
  });
};
