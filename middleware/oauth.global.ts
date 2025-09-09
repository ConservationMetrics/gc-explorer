import { defineNuxtRouteMiddleware, useRuntimeConfig } from "#imports";
import type { User, RouteLevelPermission } from "~/types/types";
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
  console.log("to.path", to.path);
  // Check if this is a dataset route that might have public access
  const isDatasetRoute =
    to.path.startsWith("/alerts/") ||
    to.path.startsWith("/gallery/") ||
    to.path.startsWith("/map/");

  if (isDatasetRoute) {
    console.log("isDatasetRoute", isDatasetRoute, "for path:", to.path);
    try {
      const {
        public: { appApiKey },
      } = useRuntimeConfig();
      const headers = { "x-api-key": appApiKey };

      const data = (await $fetch("/api/config", { headers })) as unknown as [
        { [key: string]: { routeLevelPermission?: RouteLevelPermission } },
        string[],
      ];

      // Extract table name from path (e.g., "/alerts/tableName" -> "tableName")
      const pathParts = to.path.split("/");
      const tableName = pathParts[pathParts.length - 1];

      const viewConfig = data?.[0]?.[tableName];
      const permission: RouteLevelPermission =
        viewConfig?.routeLevelPermission ?? "anyone"; // Default to anyone if not set

      // Public access: no login needed
      if (permission === "anyone") return;
      
      // Require authentication
      if (!loggedIn.value) {
        if (authStrategy === "auth0") return router.push("/login");
        return; // allow for other auth strategies
      }
      
      // Authenticated from here on
      const typedUser = user.value as User;
      const userRole = typedUser?.userRole ?? Role.Viewer;
      
      // Role-based access control
      switch (permission) {
        case "member":
          if (userRole < Role.Member) return router.push("/");
          break;
        case "admin":
          if (userRole < Role.Admin) return router.push("/");
          break;
        case "signed-in":
          return; // any signed-in user is fine
      }
    } catch (error) {
      console.error("Error checking view permissions:", error);
      // On error, fall back to requiring authentication
      if (!loggedIn.value && authStrategy === "auth0") {
        return router.push("/login");
      }
    }
  }

  // Handle authentication for non-dataset routes
  if (authStrategy === "auth0" && !loggedIn.value && to.path !== "/login") {
    return router.push("/login");
  }

  // Check role-based access for restricted routes
  if (authStrategy === "auth0" && loggedIn.value && user.value) {
    const typedUser = user.value as User;
    const userRole = typedUser.userRole || Role.Viewer;

    // Redirect non-Admins from config route
    if (to.path === "/config" && userRole < Role.Admin) {
      return router.push("/");
    }
  }
});
