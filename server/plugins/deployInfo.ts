/** Process boot. Evaluated when Nitro loads this plugin, before the first request. */
export const serverStartedAt = new Date().toISOString();

export default defineNitroPlugin(() => {});
