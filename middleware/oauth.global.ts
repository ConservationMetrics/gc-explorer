import { defineNuxtRouteMiddleware, useRuntimeConfig } from "#imports";
import type { User } from "~/types/types";

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

  // Check role-based access for /config route
  if (
    authStrategy === "auth0" &&
    to.path === "/config" &&
    loggedIn.value &&
    user.value
  ) {
    const typedUser = user.value as User;
    const userRoles = typedUser.roles || [];
    const hasAdminRole = userRoles.some(
      (role: { name: string }) => role.name === "Admin",
    );

    if (!hasAdminRole) {
      // Redirect back to where they came from, or to home if no previous route
      const fromPath = router.currentRoute.value.path;
      const redirectPath = fromPath && fromPath !== "/config" ? fromPath : "/";
      return router.push(redirectPath);
    }
  }
});
