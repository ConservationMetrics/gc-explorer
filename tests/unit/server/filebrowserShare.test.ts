import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveFilebrowserShare } from "../../../server/utils/filebrowserShare";

const config = {
  origin: "https://files.cmistaging.guardianconnector.net",
  username: "admin",
  password: "secret",
  storagePrefix: "datalake",
};
const shareUrl = `${config.origin}/api/public/dl/abc`;

afterEach(() => vi.unstubAllGlobals());

describe("Filebrowser share resolution", () => {
  it("combines the owner's scope with the share path", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("token"))
      .mockResolvedValueOnce(
        Response.json([{ hash: "abc", userID: 7, path: "/media" }]),
      )
      .mockResolvedValueOnce(Response.json({ scope: "/projects/a" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveFilebrowserShare(shareUrl, config)).resolves.toEqual({
      ownerId: 7,
      ownerScope: "/projects/a",
      sharePath: "/media",
      smbPath: "datalake/projects/a/media",
    });
    expect(fetchMock.mock.calls[1][1].headers["X-Auth"]).toBe("token");
    expect(fetchMock.mock.calls[0][1].redirect).toBe("error");
  });

  it("rejects a different origin before sending credentials", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      resolveFilebrowserShare("https://other.example/share/abc", config),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects missing owner scope and traversal", async () => {
    for (const owner of [{}, { scope: "/../outside" }]) {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce(new Response("token"))
          .mockResolvedValueOnce(
            Response.json([{ hash: "abc", userID: 7, path: "/media" }]),
          )
          .mockResolvedValueOnce(Response.json(owner)),
      );
      await expect(resolveFilebrowserShare(shareUrl, config)).rejects.toThrow();
    }
  });
});
