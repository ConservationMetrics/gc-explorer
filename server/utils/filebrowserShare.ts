import { posix } from "node:path";

export interface FilebrowserConfig {
  origin: string;
  username: string;
  password: string;
  storagePrefix: string;
}

/** Resolve a Filebrowser v2 share to a candidate path relative to the SMB share. */
export async function resolveFilebrowserShare(
  shareUrl: string,
  config: FilebrowserConfig,
): Promise<{
  ownerId: number;
  ownerScope: string;
  sharePath: string;
  smbPath: string;
}> {
  let origin: URL;
  let url: URL;
  try {
    origin = new URL(config.origin);
    url = new URL(shareUrl);
  } catch {
    throw new Error("Invalid Filebrowser origin or share URL");
  }
  if (
    origin.protocol !== "https:" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    url.origin !== origin.origin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "Share URL must use the configured HTTPS Filebrowser origin",
    );
  }
  const match = url.pathname.match(
    /^\/(?:share|api\/public\/dl)\/([A-Za-z0-9_-]+)\/?$/,
  );
  if (!match) throw new Error("Invalid Filebrowser share URL");

  const api = async (path: string, token?: string, body?: object) => {
    const response = await fetch(`${origin.origin}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        ...(token ? { "X-Auth": token } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new Error(`Filebrowser API returned HTTP ${response.status}`);
    return response;
  };
  const token = (
    await (
      await api("/api/login", undefined, {
        username: config.username,
        password: config.password,
      })
    ).text()
  ).trim();
  if (!token) throw new Error("Filebrowser returned an empty token");
  const shares: unknown = await (await api("/api/shares", token)).json();
  if (!Array.isArray(shares)) throw new Error("Invalid Filebrowser share list");
  const matches = shares.filter((share) => share?.hash === match[1]);
  if (matches.length !== 1)
    throw new Error("Share not found uniquely; check account permissions");
  const share = matches[0];
  if (!Number.isSafeInteger(share.userID) || share.userID < 1)
    throw new Error("Invalid share owner");
  const owner: unknown = await (
    await api(`/api/users/${share.userID}`, token)
  ).json();
  if (
    !owner ||
    typeof owner !== "object" ||
    !("scope" in owner) ||
    typeof owner.scope !== "string" ||
    !owner.scope
  ) {
    throw new Error("Owner scope unavailable; use an administrator account");
  }
  const clean = (value: unknown): string => {
    if (
      typeof value !== "string" ||
      value.includes("\\") ||
      value.includes("\0") ||
      value.split("/").some((part) => part === "." || part === "..")
    ) {
      throw new Error("Invalid storage path");
    }
    return value.split("/").filter(Boolean).join("/");
  };
  const ownerScope = owner.scope === "." ? "" : clean(owner.scope);
  const sharePath = clean(share.path);
  const smbPath = posix.join(
    clean(config.storagePrefix),
    ownerScope,
    sharePath,
  );
  return {
    ownerId: share.userID,
    ownerScope: `/${ownerScope}`,
    sharePath: `/${sharePath}`,
    smbPath,
  };
}
