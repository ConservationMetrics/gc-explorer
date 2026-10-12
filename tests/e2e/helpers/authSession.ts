import { request, type APIRequestContext, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import type { Role } from "../../../types";

/**
 * Returns a location without OAuth query parameters or fragments.
 * @param page - Authentication page.
 * @returns Origin and path for failure diagnostics.
 */
export const authLocation = (page: Page): string => {
  const url = new URL(page.url());
  return `${url.origin}${url.pathname}`;
};

/**
 * Waits for Explorer's callback, accepting consent only on the configured Auth0 origin.
 * @param page - Authentication page.
 * @param applicationOrigin - Explorer origin.
 * @param auth0Origin - Configured identity provider origin.
 * @param timeout - Maximum navigation wait in milliseconds.
 * @returns Resolves after the browser returns to Explorer.
 */
export const waitForAuthReturn = async (
  page: Page,
  applicationOrigin: string,
  auth0Origin: string,
  timeout = 30_000,
): Promise<void> => {
  try {
    await page.waitForURL(
      (url) =>
        url.origin === applicationOrigin ||
        (url.origin === auth0Origin &&
          /^\/u\/consent(?:\/|$)|^\/consent(?:\/|$)/.test(url.pathname)),
      { timeout, waitUntil: "domcontentloaded" },
    );
    if (new URL(page.url()).origin === auth0Origin) {
      await page
        .getByRole("button", {
          name: /^(accept|authorize|allow|yes|continue)$/i,
        })
        .first()
        .click({ timeout });
      await page.waitForURL((url) => url.origin === applicationOrigin, {
        timeout,
        waitUntil: "domcontentloaded",
      });
    }
  } catch {
    throw new Error(
      `Authentication did not return to Explorer; location=${authLocation(page)}`,
    );
  }
};

/**
 * Polls Explorer with the supplied cookies until the expected account and role exist.
 * @param context - Browser request context or restored state context.
 * @param applicationOrigin - Explorer origin.
 * @param email - Expected test account.
 * @param role - Expected application role.
 * @param timeout - Maximum session wait in milliseconds.
 * @returns Resolves only for the expected authenticated application user.
 */
export const waitForAuthSession = async (
  context: APIRequestContext,
  applicationOrigin: string,
  email: string,
  role: Role,
  timeout = 30_000,
): Promise<void> => {
  const deadline = Date.now() + timeout;
  let userPresent = false;
  let accountMatches = false;
  let roleMatches = false;
  let status: number | undefined;
  while (Date.now() < deadline) {
    try {
      const response = await context.get(
        `${applicationOrigin}/api/_auth/session`,
        {
          timeout: Math.min(5_000, Math.max(1, deadline - Date.now())),
          maxRedirects: 0,
        },
      );
      try {
        status = response.status();
        const session: unknown = response.ok() ? await response.json() : null;
        const user =
          session && typeof session === "object" && "user" in session
            ? session.user
            : null;
        userPresent = Boolean(user && typeof user === "object");
        accountMatches = Boolean(
          user &&
            typeof user === "object" &&
            "auth0" in user &&
            user.auth0 === email,
        );
        roleMatches = Boolean(
          user &&
            typeof user === "object" &&
            "userRole" in user &&
            user.userRole === role,
        );
        if (userPresent && accountMatches && roleMatches) return;
      } finally {
        await response.dispose();
      }
    } catch {
      // A callback or backend restart can temporarily interrupt session requests.
    }
    const remaining = deadline - Date.now();
    if (remaining > 0)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(250, remaining)),
      );
  }
  throw new Error(
    `Application authentication timed out; status=${status ?? "unavailable"}; userPresent=${userPresent}; accountMatches=${accountMatches}; roleMatches=${roleMatches}`,
  );
};

/**
 * Checks the saved cookies in an independent context and removes unusable state.
 * @param page - Authenticated browser page.
 * @param authFile - Storage state destination.
 * @param applicationOrigin - Explorer origin.
 * @param email - Expected test account.
 * @param role - Expected application role.
 * @param timeout - Maximum restored session wait in milliseconds.
 * @returns Resolves after the saved file authenticates to Explorer.
 */
export const saveVerifiedAuthState = async (
  page: Page,
  authFile: string,
  applicationOrigin: string,
  email: string,
  role: Role,
  timeout = 30_000,
): Promise<void> => {
  try {
    await page.context().storageState({ path: authFile });
    const restored = await request.newContext({ storageState: authFile });
    try {
      await waitForAuthSession(
        restored,
        applicationOrigin,
        email,
        role,
        timeout,
      );
    } finally {
      await restored.dispose();
    }
  } catch (error) {
    await fs.rm(authFile, { force: true });
    const detail =
      error instanceof Error &&
      error.message.startsWith("Application authentication timed out;")
        ? error.message
        : "verification failed";
    throw new Error(
      `Saved authentication state is invalid; location=${authLocation(page)}; ${detail}`,
    );
  }
};
