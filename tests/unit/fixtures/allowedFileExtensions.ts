import type { AllowedFileExtensions } from "@/types";

/** Same lists as `nuxt.config` `public.allowedFileExtensions`. */
export const allowedFileExtensionsFixture = {
  audio: ["mp3", "ogg", "wav", "m4a"],
  image: ["jpg", "jpeg", "png", "webp"],
  video: ["mov", "mp4", "avi", "mkv"],
} as const satisfies AllowedFileExtensions;
