import { deleteCookie, getCookie, setCookie, type H3Event } from "h3";

export const AUTH_REDIRECT_COOKIE = "gc_auth_redirect";

const cookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 600,
  secure: process.env.NODE_ENV === "production",
};

/** Relative in-app path. Rejects protocol-relative and auth routes. */
export const safeAuthRedirect = (
  path: string | null | undefined,
): string | null => {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (path.startsWith("/login") || path.startsWith("/api/auth")) return null;
  if (path.includes("://") || path.includes("\\")) return null;
  return path;
};

export const rememberAuthRedirect = (event: H3Event, fullPath: string) => {
  const safe = safeAuthRedirect(fullPath);
  if (!safe) return;
  setCookie(event, AUTH_REDIRECT_COOKIE, safe, cookieOptions);
};

export const consumeAuthRedirect = (event: H3Event): string | null => {
  const value = safeAuthRedirect(getCookie(event, AUTH_REDIRECT_COOKIE));
  if (!value) return null;
  deleteCookie(event, AUTH_REDIRECT_COOKIE, { path: "/" });
  return value;
};
