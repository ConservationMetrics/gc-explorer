import { execFileSync } from "node:child_process";

import type { DeployInfo } from "@/types";

/** Image tag (`IMAGE_TAG`) and commit (`GIT_COMMIT`, or git in the working directory). */
export const readBuildIdentity = (
  env: NodeJS.ProcessEnv = process.env,
): Pick<DeployInfo, "tag" | "commit"> => {
  const fromEnv = env.GIT_COMMIT?.trim();
  let commit = fromEnv ?? "";
  if (!commit) {
    try {
      commit = execFileSync("git", ["rev-parse", "HEAD"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      commit = "";
    }
  }

  return { tag: env.IMAGE_TAG?.trim() ?? "", commit };
};
