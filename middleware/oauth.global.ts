import { defineNuxtRouteMiddleware, useRuntimeConfig } from "#imports";

// Following example: https://github.com/atinux/atidone/blob/main/app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession();
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
  if (authStrategy === "auth0" && !loggedIn.value && to.path !== "/login") {
    return router.push("/login");
  }
});
