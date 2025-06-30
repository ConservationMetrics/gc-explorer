# Image Optimization with Nuxt Image

This document describes the image optimization implementation in the GuardianConnector Explorer using [Nuxt Image](https://image.nuxt.com/).

## Overview

The project now uses Nuxt Image to automatically optimize images for better performance, including:

- **Automatic format conversion** to WebP/AVIF for modern browsers
- **Responsive image sizing** based on viewport
- **Lazy loading** for better performance
- **Placeholder images** for improved user experience
- **Quality optimization** for different use cases

## Configuration

### Nuxt Config (`nuxt.config.ts`)

The image optimization is configured in the Nuxt config with:

```typescript
image: {
  provider: 'ipx',
  
  presets: {
    gallery: {
      modifiers: {
        format: 'webp',
        quality: 80,
        fit: 'cover',
      }
    },
    logo: {
      modifiers: {
        format: 'webp',
        quality: 85,
        fit: 'contain',
      }
    },
    icon: {
      modifiers: {
        format: 'webp',
        quality: 90,
        fit: 'contain',
      }
    },
    thumbnail: {
      modifiers: {
        format: 'webp',
        quality: 75,
        width: 300,
        height: 200,
        fit: 'cover',
      }
    }
  },
  
  format: ['webp', 'avif', 'jpeg'],
  quality: 80,
}
```

## Usage

### 1. Using `<NuxtImg>` Component

Replace regular `<img>` tags with `<NuxtImg>`:

```vue
<!-- Before -->
<img src="/image.jpg" alt="Image" />

<!-- After -->
<NuxtImg 
  src="/image.jpg" 
  alt="Image" 
  preset="gallery"
  loading="lazy"
/>
```

### 2. Using Presets

Different presets are available for different use cases:

- **`gallery`** - For gallery images (responsive, good quality)
- **`logo`** - For logo images (high quality, contain fit)
- **`icon`** - For icon images (optimized for small sizes)
- **`thumbnail`** - For thumbnail images (smaller size, cover fit)

### 3. Using the Composable

For programmatic image URL generation, use the `useOptimizedImages` composable:

```vue
<script setup>
import { useOptimizedImages } from '@/composables/useOptimizedImages';

const { 
  getGalleryImageUrl, 
  getLogoImageUrl, 
  getIconImageUrl,
  getResponsiveSrcset,
  getPlaceholderUrl 
} = useOptimizedImages();

// Generate optimized URLs
const optimizedUrl = getGalleryImageUrl('/image.jpg', 800, 600);
const placeholderUrl = getPlaceholderUrl('/image.jpg');
</script>
```

### 4. Advanced Features

#### Placeholder Images

```vue
<NuxtImg
  src="/image.jpg"
  alt="Image with placeholder"
  preset="gallery"
  :placeholder="placeholderUrl"
  placeholder-class="blur-sm scale-105"
/>
```

#### Responsive Images

```vue
<NuxtImg
  src="/image.jpg"
  alt="Responsive image"
  preset="gallery"
  sizes="sm:100vw md:50vw lg:33vw xl:25vw"
/>
```

#### Custom Modifiers

```vue
<NuxtImg
  src="/image.jpg"
  alt="Custom image"
  format="webp"
  quality="90"
  width="300"
  height="200"
  fit="cover"
/>
```

## Components Updated

The following components have been updated to use Nuxt Image:

1. **`MediaFile.vue`** - Main component for rendering images in gallery and alerts
2. **`AlertsIntroPanel.vue`** - Logo and warning icon images
3. **`BasemapSelector.vue`** - Map icon
4. **`index.vue`** - Main logo

## Benefits

- **Faster loading** - Optimized image formats and sizes
- **Better UX** - Placeholder images and lazy loading
- **Responsive** - Images adapt to different screen sizes
- **Modern formats** - Automatic WebP/AVIF conversion
- **Consistent quality** - Preset-based optimization

## External Images

For external images, add the domain to the `domains` array in the Nuxt config:

```typescript
image: {
  domains: ['example.com', 'cdn.example.com'],
}
```

## Testing

To test the image optimization:

1. Open browser dev tools
2. Check the Network tab
3. Look for optimized image URLs (usually with query parameters)
4. Verify that WebP/AVIF formats are being served to supported browsers

## Example Component

See `OptimizedImageExample.vue` for comprehensive examples of all features. 