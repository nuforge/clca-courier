/**
 * Canva Brand Icons System
 * Implementation following official Canva brand guidelines
 * @see https://www.canva.dev/docs/connect/guidelines/brand/
 */

// SVG asset paths - using local assets as per Canva brand guidelines
const CANVA_ASSETS = {
  // SVG assets (scalable, best for web)
  svg: {
    icon: '/src/assets/logos/canva/svg/Canva Icon logo.svg',
    circle: '/src/assets/logos/canva/svg/Canva circle logo.svg',
    type: '/src/assets/logos/canva/svg/Canva type logo.svg',
  },
  // PNG assets for various sizes (fallback)
  png: {
    icon: {
      '32': '/src/assets/logos/canva/png/32x32/Canva Icon logo_32x32.png',
      '64': '/src/assets/logos/canva/png/64x64/Canva Icon logo_64x64.png',
      '128': '/src/assets/logos/canva/png/128x128/Canva Icon logo_128x128.png',
      '256': '/src/assets/logos/canva/png/256x256/Canva Icon logo_256x256.png',
      '512': '/src/assets/logos/canva/png/512x512/Canva Icon logo_512x512.png',
    },
    circle: {
      '32': '/src/assets/logos/canva/png/32x32/Canva circle logo_32x32.png',
      '64': '/src/assets/logos/canva/png/64x64/Canva circle logo_64x64.png',
      '128': '/src/assets/logos/canva/png/128x128/Canva circle logo_128x128.png',
      '256': '/src/assets/logos/canva/png/256x256/Canva circle logo_256x256.png',
      '512': '/src/assets/logos/canva/png/512x512/Canva circle logo_512x512.png',
    },
    type: {
      '32': '/src/assets/logos/canva/png/32x32/Canva type logo_32x12.png',
      '64': '/src/assets/logos/canva/png/64x64/Canva type logo_64x23.png',
      '128': '/src/assets/logos/canva/png/128x128/Canva type logo_128x45.png',
      '256': '/src/assets/logos/canva/png/256x256/Canva type logo_256x90.png',
      '512': '/src/assets/logos/canva/png/512x512/Canva type logo_512x180.png',
    },
  },
} as const;

/**
 * Canva logo types as per brand guidelines
 */
export type CanvaLogoType = 'icon' | 'circle' | 'type';

/**
 * Canva logo sizes for PNG assets
 */
export type CanvaLogoSize = '32' | '64' | '128' | '256' | '512';

/**
 * Canva logo format
 */
export type CanvaLogoFormat = 'svg' | 'png';

/**
 * Canva logo configuration
 */
export interface CanvaLogoConfig {
  type: CanvaLogoType;
  size?: CanvaLogoSize;
  format?: CanvaLogoFormat;
  alt?: string;
}

/**
 * Get appropriate Canva logo based on size and usage context
 * Following Canva brand guidelines:
 * - For surfaces below 50px: use icon logo
 * - For surfaces above 50px: use script/type logo
 * - Icon logo for UI embedding
 */
export function getCanvaLogo(config: CanvaLogoConfig): string {
  const { type, size = '128', format = 'svg' } = config;

  if (format === 'svg') {
    return CANVA_ASSETS.svg[type];
  }

  return CANVA_ASSETS.png[type][size];
}

/**
 * Get appropriate Canva logo type based on target size
 * @param targetSize Target size in pixels
 * @returns Recommended logo type per brand guidelines
 */
export function getRecommendedCanvaLogoType(targetSize: number): CanvaLogoType {
  // Per Canva guidelines: surfaces below 50px use icon, above 50px use type/script
  if (targetSize < 50) {
    return 'icon';
  }
  return 'type';
}

/**
 * Canva brand colors (official colors - DO NOT MODIFY per guidelines)
 */
export const CANVA_COLORS = {
  // Primary Canva purple (official brand color)
  primary: '#00C4CC',
  // Secondary colors from their brand palette
  purple: '#8B46FF',
  pink: '#FF6DC7',
  // Neutral colors for backgrounds
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Canva UI icon definitions for integration into existing UI_ICONS
 * These follow the same pattern as existing UI icons
 */
export const CANVA_UI_ICONS = {
  // Canva-specific icons for UI integration
  canva: 'canva-icon', // Custom identifier for Canva icon component
  canvaType: 'canva-type', // Custom identifier for Canva type logo
  canvaCircle: 'canva-circle', // Custom identifier for Canva circle logo
} as const;

/**
 * Default configurations for common use cases
 */
export const CANVA_LOGO_PRESETS = {
  // Button icons (small)
  buttonIcon: {
    type: 'icon' as CanvaLogoType,
    format: 'svg' as CanvaLogoFormat,
    size: '32' as CanvaLogoSize,
  },
  // Navigation items (medium)
  navigationIcon: {
    type: 'icon' as CanvaLogoType,
    format: 'svg' as CanvaLogoFormat,
    size: '64' as CanvaLogoSize,
  },
  // Headers and branding (large)
  headerLogo: {
    type: 'type' as CanvaLogoType,
    format: 'svg' as CanvaLogoFormat,
    size: '128' as CanvaLogoSize,
  },
  // Footer attribution
  footerLogo: {
    type: 'type' as CanvaLogoType,
    format: 'svg' as CanvaLogoFormat,
    size: '64' as CanvaLogoSize,
  },
} as const;

/**
 * Brand-compliant alt text templates
 */
export const CANVA_ALT_TEXTS = {
  icon: 'Canva icon',
  type: 'Canva logo',
  circle: 'Canva circle logo',
  poweredBy: 'Powered by Canva',
  integration: 'Canva integration',
} as const;

/**
 * CSS class utilities for proper logo spacing per brand guidelines
 */
export const CANVA_CSS_CLASSES = {
  // Minimum 8px padding as per guidelines
  logoContainer: 'canva-logo-container',
  iconSmall: 'canva-icon-small',
  iconMedium: 'canva-icon-medium',
  iconLarge: 'canva-icon-large',
} as const;
