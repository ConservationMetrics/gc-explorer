import type { ImageModifiers } from "@nuxt/image";

/**
 * Composable for generating optimized image URLs using Nuxt Image
 * Provides helper functions for different image use cases
 */
export const useOptimizedImages = () => {
  const img = useImage();

  /**
   * Generate optimized URL for gallery images
   */
  const getGalleryImageUrl = (src: string, width?: number, height?: number) => {
    return img(src, {
      preset: "gallery",
      width,
      height,
    });
  };

  /**
   * Generate optimized URL for logo images
   */
  const getLogoImageUrl = (src: string, width?: number, height?: number) => {
    return img(src, {
      preset: "logo",
      width,
      height,
    });
  };

  /**
   * Generate optimized URL for icon images
   */
  const getIconImageUrl = (src: string, width?: number, height?: number) => {
    return img(src, {
      preset: "icon",
      width,
      height,
    });
  };

  /**
   * Generate optimized URL for thumbnail images
   */
  const getThumbnailImageUrl = (
    src: string,
    width?: number,
    height?: number,
  ) => {
    return img(src, {
      preset: "thumbnail",
      width,
      height,
    });
  };

  /**
   * Generate responsive srcset for images
   */
  const getResponsiveSrcset = (
    src: string,
    sizes: string,
    modifiers?: ImageModifiers,
  ) => {
    return img.getSizes(src, {
      sizes,
      modifiers: {
        preset: "gallery",
        ...modifiers,
      },
    });
  };

  /**
   * Generate placeholder image URL
   */
  const getPlaceholderUrl = (src: string, width = 50, height = 50) => {
    return img(src, {
      width,
      height,
      quality: 50,
      blur: 5,
      format: "webp",
    });
  };

  return {
    img,
    getGalleryImageUrl,
    getLogoImageUrl,
    getIconImageUrl,
    getThumbnailImageUrl,
    getResponsiveSrcset,
    getPlaceholderUrl,
  };
};
