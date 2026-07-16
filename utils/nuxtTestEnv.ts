const NUXT_TEST_TRUTHY = new Set(["true"]);
const NUXT_TEST_FALSY = new Set(["false", ""]);

/** Throws if NUXT_TEST is set to an unrecognized value. */
export function assertValidNuxtTestEnv(): void {
  const raw = process.env.NUXT_TEST;
  if (raw === undefined) return;

  const normalized = raw.trim().toLowerCase();
  if (NUXT_TEST_TRUTHY.has(normalized) || NUXT_TEST_FALSY.has(normalized)) {
    return;
  }

  throw new Error(
    `NUXT_TEST must be "true" or "false" (case-insensitive), got "${raw}"`,
  );
}

/** Docker test stack (docker-compose.tests.yml + Playwright globalSetup). */
export function isNuxtTestEnv(): boolean {
  assertValidNuxtTestEnv();
  return process.env.NUXT_TEST?.trim().toLowerCase() === "true";
}
