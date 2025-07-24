import { type H3Event, getCookie, setCookie } from "h3";
import { useRuntimeConfig } from "#imports";

interface Auth0User {
  email: string;
}

console.log("🔍 Auth0 Handler: Loading handler file");

export default oauthAuth0EventHandler({
  config: {
    emailRequired: true,
    redirectURL: `${useRuntimeConfig().public.baseUrl}/login`,
  },

  async onSuccess(event: H3Event, { user }: { user: Auth0User }) {
    console.log("🔍 Auth0 Success: Setting user session");
    try {
      const session = await setUserSession(event, {
        user: {
          auth0: user.email,
        },
        loggedInAt: Date.now(),
      });
      console.log("🔍 Auth0 Success: Session set", session);

      // Set our custom auth cookie as a fallback
      setCookie(
        event,
        "gc_auth",
        JSON.stringify({
          user: {
            auth0: user.email,
          },
          loggedInAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        }),
        {
          maxAge: 24 * 60 * 60, // 24 hours in seconds
          path: "/",
          sameSite: "lax",
          httpOnly: false, // Allow client-side access
          secure: process.env.NODE_ENV === "production",
        },
      );
      console.log("🔍 Auth0 Success: Custom auth cookie set");
    } catch (error) {
      console.error("🔍 Auth0 Success: Error setting user session", error);
    }
    // Get the redirect path from cookie
    const redirectPath = getCookie(event, "auth0_redirect") || "/";
    console.log("🔍 Auth0 Success: Redirect path from cookie:", redirectPath);

    // Clear the cookie
    setCookie(event, "auth0_redirect", "", { maxAge: 0, path: "/" });

    // Redirect directly to the target page instead of login
    return sendRedirect(event, redirectPath);
  },
  onError(event: H3Event) {
    console.error("OAuth error:", event);
    return sendRedirect(event, "/login");
  },
});
