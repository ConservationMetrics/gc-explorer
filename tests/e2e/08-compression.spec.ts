import { test, expect } from "@/tests/e2e/fixtures/auth-storage";

test("API responses include Content-Encoding header", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // Hit the config API directly so we can reliably inspect headers
  const response = await page.request.get("/api/config");
  const encoding = response.headers()["content-encoding"];

  expect(["br", "gzip"]).toContain(encoding);
});
