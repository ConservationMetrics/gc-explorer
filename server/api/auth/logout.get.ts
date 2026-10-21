/**
 * Clears the local Nuxt session and ends the Auth0 SSO session via /v2/logout.
 * Requires the app's base URL in Auth0 Allowed Logout URLs.
 */
export default defineEventHandler(async (event) => {
  await clearUserSession(event);

  const config = useRuntimeConfig();
  const domain = config.oauth?.auth0?.domain;
  const clientId = config.oauth?.auth0?.clientId;
  const returnTo = config.public.baseUrl;

  if (!domain || !clientId || !returnTo) {
    return sendRedirect(event, "/");
  }

  const logoutUrl = new URL(`https://${domain}/v2/logout`);
  logoutUrl.searchParams.set("client_id", clientId);
  logoutUrl.searchParams.set("returnTo", returnTo);
  return sendRedirect(event, logoutUrl.toString());
});
