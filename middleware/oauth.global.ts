import { defineNuxtRouteMiddleware, useRuntimeConfig } from "#imports";

// Following example: https://github.com/atinux/atidone/blob/main/app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession();
  const {
    public: { authStrategy },
  } = useRuntimeConfig();
  const router = useRouter();
  //await refreshSession();
  console.log("🔍 OAuth Global Middleware: Logged In", loggedIn.value);
  console.log("🔍 OAuth Global Middleware: User", user.value);
  console.log("🔍 OAuth Global Middleware: To", to.path);
  console.log("🔍 OAuth Global Middleware: Auth Strategy", authStrategy);
  // Check if user is authenticated via either method
  //const isUserAuthenticated = loggedIn.value || customAuthValid.value;
  if (import.meta.client) {
    if (to.path.includes("/login")) {
      console.log(
        "🔍 OAuth Global Middleware: Login Page",
        window.history.state.back,
        window.history.state,
      );
      console.log("🔍 OAuth Global Middleware: Import Meta Client");
      const back = window.history.state.back;
      const replaced = window.history.state.replaced;
      const current = window.history.state.current;
      console.log(back, replaced);
      if (!current.includes("/login") && !back) {
        sessionStorage.setItem("redirect_url", current);
      }
    }

    // const redirectUrl = sessionStorage.getItem("redirect_url");
    // if (redirectUrl && loggedIn.value) {
    //   console.log("🔍 OAuth Global Middleware: Redirecting to", redirectUrl, loggedIn.value);
    //   sessionStorage.removeItem("redirect_url");
    //   router.replace(redirectUrl);
    // }
  }
  if (authStrategy === "auth0" && !loggedIn.value && to.path !== "/login") {
    return router.push("/login");
  }
});
