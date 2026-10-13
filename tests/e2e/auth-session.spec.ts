import { test, expect } from "@playwright/test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Role } from "../../types";
import {
  saveVerifiedAuthState,
  waitForAuthReturn,
} from "./helpers/authSession";

const applicationOrigin = "http://localhost:8080";
const auth0Origin = "https://identity.example.test";

// The identity provider is synthetic so navigation failures are deterministic.
test("Auth0 login is not an application return and diagnostics omit OAuth state", async ({
  page,
}) => {
  await page.route(`${auth0Origin}/**`, (route) =>
    route.fulfill({ body: "Login" }),
  );
  await page.goto(`${auth0Origin}/login?state=secret-state#secret-token`);
  const error = await waitForAuthReturn(
    page,
    applicationOrigin,
    auth0Origin,
    100,
  ).catch((error: Error) => error);
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toContain(`location=${auth0Origin}/login`);
  expect((error as Error).message).not.toContain("secret");
});

test("Auth0 consent waits for Explorer's origin", async ({ page }) => {
  await page.route(`${applicationOrigin}/login`, (route) =>
    route.fulfill({ body: "Explorer" }),
  );
  await page.route(`${auth0Origin}/**`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<button onclick="location.href='${applicationOrigin}/login'">Accept</button>`,
    }),
  );
  await page.goto(`${auth0Origin}/u/consent?state=secret-state`);
  await waitForAuthReturn(page, applicationOrigin, auth0Origin, 5_000);
  expect(new URL(page.url()).origin).toBe(applicationOrigin);
});

test("an unusable saved session is removed", async ({ page }) => {
  const scratch = await mkdtemp(path.join(tmpdir(), "gc-auth-state-"));
  try {
    await page.goto(`${applicationOrigin}/login`);
    const file = path.join(scratch, "admin.json");
    await expect(
      saveVerifiedAuthState(
        page,
        file,
        applicationOrigin,
        "admin@example.test",
        Role.Admin,
        100,
      ),
    ).rejects.toThrow("Saved authentication state is invalid");
    await expect(readFile(file)).rejects.toThrow(/ENOENT/);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});
