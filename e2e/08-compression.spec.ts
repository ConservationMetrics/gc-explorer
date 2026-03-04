import { test, expect } from "./fixtures/auth-storage";

test("API responses include Content-Encoding header", async ({
  authenticatedPageAsAdmin: page,
}) => {
  const responsePromise = page.waitForResponse((resp) =>
    resp.url().includes("/api/config"),
  );

  await page.goto("/");

  const response = await responsePromise;
  const encoding = response.headers()["content-encoding"];

  expect(["br", "gzip"]).toContain(encoding);
});
