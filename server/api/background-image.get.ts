import { getBackgroundImage } from "@/server/utils/gcSettings";

/** Public: login background is site branding, not a secret. */
export default defineEventHandler(async () => {
  try {
    const backgroundImage = await getBackgroundImage();
    return { backgroundImage };
  } catch (error) {
    console.error("Error fetching background image:", error);
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
