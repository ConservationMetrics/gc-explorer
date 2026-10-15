import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { readBuildIdentity } from "@/server/buildIdentity";

describe("readBuildIdentity", () => {
  it("reads the image tag and commit from the environment", () => {
    expect(
      readBuildIdentity({
        GIT_COMMIT: " abc ",
        IMAGE_TAG: " 20261012-189 ",
      }),
    ).toEqual({
      tag: "20261012-189",
      commit: "abc",
    });
  });

  it("returns an empty tag when IMAGE_TAG is unset", () => {
    expect(readBuildIdentity({ GIT_COMMIT: "deadbeef" })).toEqual({
      tag: "",
      commit: "deadbeef",
    });
  });

  it("uses git when GIT_COMMIT is blank", () => {
    const expected = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();

    expect(readBuildIdentity({ GIT_COMMIT: "  " }).commit).toBe(expected);
  });
});
