import { vi } from "vitest";

vi.stubGlobal(
  "createError",
  vi.fn((input: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(input.statusMessage), input),
  ),
);
vi.stubGlobal("defineEventHandler", <T>(handler: T): T => handler);
vi.stubGlobal(
  "getQuery",
  vi.fn(() => ({})),
);
vi.stubGlobal("readBody", vi.fn());
vi.stubGlobal("setResponseStatus", vi.fn());
