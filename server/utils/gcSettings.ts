import { eq } from "drizzle-orm";

import { configDb } from "@/server/database/dbConnection";
import { gcSettings } from "@/server/database/schemas/gcSettings";

export const BACKGROUND_IMAGE_KEY = "background_image";

/**
 * Reads `gc_settings.background_image` from the config database.
 * Returns an empty string when the row is missing or the table is unavailable.
 */
export const getBackgroundImage = async (): Promise<string> => {
  try {
    const rows = await configDb
      .select({ value: gcSettings.value })
      .from(gcSettings)
      .where(eq(gcSettings.key, BACKGROUND_IMAGE_KEY))
      .limit(1);
    return rows[0]?.value?.trim() ?? "";
  } catch (error) {
    console.warn("Could not read gc_settings.background_image:", error);
    return "";
  }
};
