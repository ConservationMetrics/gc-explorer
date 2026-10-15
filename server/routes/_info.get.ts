import { serverStartedAt } from "../plugins/deployInfo";

/** Public. Identifies which build is running, without a login. */
export default defineEventHandler((event) => {
  setResponseHeader(event, "cache-control", "no-store");

  const { deploy, app } = useRuntimeConfig(event);
  return {
    tag: deploy.tag,
    commit: deploy.commit,
    buildId: app.buildId,
    startedAt: serverStartedAt,
  };
});
