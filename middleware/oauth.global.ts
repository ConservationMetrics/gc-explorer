import {
  defineNuxtRouteMiddleware,
  useRuntimeConfig,
  navigateTo,
  useCookie,
} from "#imports";

// Following example: https://github.com/atinux/atidone/blob/main/app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetch: refreshSession, user } = useUserSession();
  const { isAuthenticated: customAuthValid } = useCustomAuth();

  const {
    public: { authStrategy },
  } = useRuntimeConfig();

  await refreshSession();
  console.log("🔍 OAuth Global Middleware: Logged In", loggedIn.value);
  console.log("🔍 OAuth Global Middleware: User", user.value);
  console.log(
    "🔍 OAuth Global Middleware: Custom Auth Valid",
    customAuthValid.value,
  );
  console.log("🔍 OAuth Global Middleware: To", to.path);
  console.log("🔍 OAuth Global Middleware: Auth Strategy", authStrategy);
  // Check if user is authenticated via either method
  const isUserAuthenticated = loggedIn.value || customAuthValid.value;
  console.log(
    "🔍 OAuth Global Middleware: Is User Authenticated",
    isUserAuthenticated,
  );

  if (
    authStrategy === "auth0" &&
    !isUserAuthenticated &&
    to.path !== "/login" &&
    to.path !== "/api/auth/auth0"
  ) {
    // Set cookie with the current path for redirect after auth using useCookie
    const redirectCookie = useCookie("auth0_redirect", {
      maxAge: 300, // 5 minutes
      path: "/",
      sameSite: "lax",
    });
    redirectCookie.value = to.path;

    return navigateTo("/login");
  }
});
