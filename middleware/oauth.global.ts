import { defineNuxtRouteMiddleware, useRuntimeConfig } from "#imports";

// Following example: https://github.com/atinux/atidone/blob/main/app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession();
  const {
    public: { authStrategy },
  } = useRuntimeConfig();
  const router = useRouter();

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
