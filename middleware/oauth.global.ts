import { defineNuxtRouteMiddleware, useRuntimeConfig } from "#imports";
import type { User } from "~/types/types";
import { Role } from "~/types/types";

// Following example: https://github.com/atinux/atidone/blob/main/app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession();
  const {
    public: { authStrategy },
  } = useRuntimeConfig();
  const router = useRouter();

  // In order to redirect the user back to the page they were on when unauthenticated, we need to store the redirect url in session storage
  // We use the window object to get where the user was before they were redirected to the login page
  // Store it in the session storage and in the Auth0 component we grab and redirect

  if (import.meta.client) {
    if (to.path.includes("/login")) {
      const back = window.history.state.back;
      const current = window.history.state.current;

      if (!current.includes("/login") && !back) {
        sessionStorage.setItem("redirect_url", current);
      }
    }
  }

  // Check authentication
  if (authStrategy === "auth0" && !loggedIn.value && to.path !== "/login") {
    return router.push("/login");
  }

  // Check role-based access for restricted routes
  if (authStrategy === "auth0" && loggedIn.value && user.value) {
    const typedUser = user.value as User;
    const userRole = typedUser.userRole || Role.Viewer;

    // Redirect Viewers from config route
    if (to.path === "/config" && userRole < Role.Admin) {
      return router.push("/");
    }

    // Check view-level restrictions for dataset routes
    if (
      !to.path.includes("/config") &&
      !to.path.includes("/api") &&
      !to.path.includes("/login") &&
      userRole < Role.Member
    ) {
      // Extract table name from path (e.g., "/map/tableName" -> "tableName")
      const pathParts = to.path.split("/");
      const tableName = pathParts[pathParts.length - 1];
      try {
        const {
          public: { appApiKey },
        } = useRuntimeConfig();
        const headers = { "x-api-key": appApiKey };

        const data = (await $fetch("/api/config", { headers })) as unknown as [
          { [key: string]: { isRestricted?: boolean } },
          string[],
        ];
        if (data && data[0] && data[0][tableName]?.isRestricted) {
          return router.push("/");
        }
      } catch (error) {
        console.error("Error checking view restrictions:", error);
      }
    }
  }
});
