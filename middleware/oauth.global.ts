import {
  defineNuxtRouteMiddleware,
  useRuntimeConfig,
  navigateTo,
} from "#imports";

// Following example: https://github.com/atinux/atidone/blob/main/app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession();
  const {
    public: { authStrategy },
  } = useRuntimeConfig();

  //await refreshSession();
  console.log("🔍 OAuth Global Middleware: Logged In", loggedIn.value);
  console.log("🔍 OAuth Global Middleware: User", user.value);
  console.log("🔍 OAuth Global Middleware: To", to.path);
  console.log("🔍 OAuth Global Middleware: Auth Strategy", authStrategy);
  // Check if user is authenticated via either method
  //const isUserAuthenticated = loggedIn.value || customAuthValid.value;

  if (authStrategy === "auth0" && !loggedIn.value && to.path !== "/login") {
    return navigateTo("/login");
  }
});
