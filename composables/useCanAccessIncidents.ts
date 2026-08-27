import { computed } from "vue";
import { useRuntimeConfig, useUserSession } from "#imports";
import type { User } from "@/types";
import { Role } from "@/types";

/**
 * Whether the current user may use incidents (members and admins, or
 * authStrategy none).
 *
 * @returns {ComputedRef<boolean>} True when incidents UI and API should be available.
 */
export const useCanAccessIncidents = () => {
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
      return userRole >= Role.Member;
    }

    return false;
  });
};
