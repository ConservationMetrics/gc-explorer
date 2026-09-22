import { computed } from "vue";
import { useRuntimeConfig, useUserSession } from "#imports";
import type { User } from "@/types";
import { Role } from "@/types";

/**
 * Whether the current user may open the config editor (admins, authStrategy
 * none, or CI).
 *
 * @returns {ComputedRef<boolean>} True when config gear and related admin links should show.
 */
export const useCanManageConfig = () => {
  const {
    public: { authStrategy },
  } = useRuntimeConfig();
  const { loggedIn, user } = useUserSession();

  return computed(() => {
    if (process.env.CI) {
      return true;
    }

    if (authStrategy === "none") {
      return true;
    }

    if (authStrategy === "auth0" && loggedIn.value && user.value) {
      const typedUser = user.value as User | null;
      const userRole = typedUser?.userRole ?? Role.SignedIn;
      return userRole >= Role.Admin;
    }

    return false;
  });
};
