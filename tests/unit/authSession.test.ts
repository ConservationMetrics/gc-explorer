// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { request, type APIRequestContext } from "@playwright/test";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import { Role } from "../../types";
import { waitForAuthSession } from "../e2e/helpers/authSession";

const email = "admin@example.test";
let server: ReturnType<typeof createServer>;
let origin: string;
let context: APIRequestContext;
let respond: (req: IncomingMessage, res: ServerResponse) => void;

beforeEach(async () => {
  respond = (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ user: { auth0: email, userRole: Role.Admin } }));
  };
  server = createServer((req, res) => respond(req, res));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Test server has no port");
  origin = `http://127.0.0.1:${address.port}`;
  context = await request.newContext();
});

afterEach(async () => {
  await context.dispose();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("application session verification", () => {
  it("waits through a delayed session instead of accepting an anonymous response", async () => {
    let calls = 0;
    respond = (_req, res) => {
      res.end(
        JSON.stringify(
          ++calls === 1 ? {} : { user: { auth0: email, userRole: Role.Admin } },
        ),
      );
    };
    await waitForAuthSession(context, origin, email, Role.Admin, 1_000);
    expect(calls).toBe(2);
  });

  it.each([
    ["missing user", {}],
    [
      "wrong account",
      { user: { auth0: "other@example.test", userRole: Role.Admin } },
    ],
    ["wrong role", { user: { auth0: email, userRole: Role.Guest } }],
    ["string role", { user: { auth0: email, userRole: "3" } }],
  ])("rejects %s", async (_name, session) => {
    respond = (_req, res) => res.end(JSON.stringify(session));
    await expect(
      waitForAuthSession(context, origin, email, Role.Admin, 50),
    ).rejects.toThrow("Application authentication timed out");
  });

  it("retries a temporary backend failure", async () => {
    let calls = 0;
    respond = (_req, res) => {
      res.statusCode = ++calls === 1 ? 503 : 200;
      res.end(JSON.stringify({ user: { auth0: email, userRole: Role.Admin } }));
    };
    await waitForAuthSession(context, origin, email, Role.Admin, 1_000);
    expect(calls).toBe(2);
  });

  it("does not follow redirects or expose response contents in diagnostics", async () => {
    respond = (_req, res) => {
      res.writeHead(302, { Location: "/login?code=secret-code" });
      res.end("secret-token");
    };
    const error = await waitForAuthSession(
      context,
      origin,
      email,
      Role.Admin,
      50,
    ).catch((error: Error) => error);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("status=302; userPresent=false");
    expect((error as Error).message).not.toMatch(/secret|example/);
  });
});
