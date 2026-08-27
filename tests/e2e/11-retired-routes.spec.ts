import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import { SEEDED_MAP_CONFIG_PATH } from "@/tests/e2e/helpers/configPage";

test("retired /config redirects to index with bookmark toast", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });

  await expect(page.getByText(/page moved/i).first()).toBeVisible({
    timeout: 10000,
  });
  await expect(
    page.getByText(/this page has moved\. please update your bookmarks/i),
  ).toBeVisible();

  // Query marker is stripped after the toast is shown.
  await expect
    .poll(() => new URL(page.url()).searchParams.has("reason"), {
      timeout: 5000,
    })
    .toBe(false);

  await expect(
    page.getByRole("heading", { name: /available dataset views/i }),
  ).toBeVisible();
});

test("retired /dataset and /dataset/{name} redirect to index with toast", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/dataset");
  await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });
  await expect(page.getByText(/page moved/i).first()).toBeVisible({
    timeout: 10000,
  });
  await expect
    .poll(() => new URL(page.url()).searchParams.has("reason"), {
      timeout: 5000,
    })
    .toBe(false);

  await page.goto("/dataset/bcmform_responses");
  await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });
  await expect(page.getByText(/page moved/i).first()).toBeVisible({
    timeout: 10000,
  });
  await expect
    .poll(() => new URL(page.url()).searchParams.has("reason"), {
      timeout: 5000,
    })
    .toBe(false);
});

test("active create and edit config routes remain reachable", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config/new");
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: /add new dataset view/i }),
  ).toBeVisible({ timeout: 10000 });
  expect(page.url()).toContain("/config/new");
  expect(page.url()).not.toMatch(/[?&]reason=moved/);

  await page.goto(SEEDED_MAP_CONFIG_PATH);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("form", { timeout: 15000 });
  expect(page.url()).toContain("/config/bcmform_responses");
  expect(page.url()).toContain("view_type=map");
  expect(page.url()).not.toMatch(/[?&]reason=moved/);
});

test("retired route redirect does not loop", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/config");
  await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });

  // Stay on index — no bounce back to /config.
  await page.waitForTimeout(1000);
  expect(new URL(page.url()).pathname).toBe("/");
});

test("retired config API controllers return 404", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const responses = await Promise.all([
    request.get("/api/config"),
    request.get("/api/config/bcmform_responses"),
    request.get("/api/config/public_views"),
    request.post("/api/config/new_table/bcmform_responses?view_type=gallery"),
    request.post(
      "/api/config/update_config/bcmform_responses?view_type=gallery",
    ),
    request.post(
      "/api/config/delete_table/bcmform_responses?view_type=gallery",
    ),
  ]);

  expect(responses.map((response) => response.status())).toEqual([
    404, 404, 404, 404, 404, 404,
  ]);
});
