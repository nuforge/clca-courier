import { describe, it, expect } from 'vitest';
import {
  getCanvaLogo,
  getRecommendedCanvaLogoType,
  CANVA_COLORS,
  CANVA_UI_ICONS,
  CANVA_LOGO_PRESETS,
  CANVA_ALT_TEXTS,
  type CanvaLogoType,
  type CanvaLogoSize,
  type CanvaLogoFormat
} from '../../../src/constants/canva-icons';

describe('Canva Icons Constants', () => {
  describe('getCanvaLogo', () => {
    it('returns SVG path by default', () => {
      const result = getCanvaLogo({ type: 'icon' });
      expect(result).toContain('.svg');
      expect(result).toContain('Canva Icon logo');
    });

    it('returns PNG path when format is specified', () => {
      const result = getCanvaLogo({
        type: 'icon',
        format: 'png',
        size: '128'
      });
      expect(result).toContain('.png');
      expect(result).toContain('128x128');
      expect(result).toContain('Canva Icon logo');
    });

    it('uses default size for PNG when not specified', () => {
      const result = getCanvaLogo({
        type: 'type',
        format: 'png'
      });
      expect(result).toContain('128x128');
    });

    it('returns correct paths for all logo types', () => {
      const iconResult = getCanvaLogo({ type: 'icon' });
      const typeResult = getCanvaLogo({ type: 'type' });
      const circleResult = getCanvaLogo({ type: 'circle' });

      expect(iconResult).toContain('Canva Icon logo');
      expect(typeResult).toContain('Canva type logo');
      expect(circleResult).toContain('Canva circle logo');
    });

    it('handles all PNG sizes correctly', () => {
      const sizes: CanvaLogoSize[] = ['32', '64', '128', '256', '512'];

      sizes.forEach(size => {
        const result = getCanvaLogo({
          type: 'icon',
          format: 'png',
          size
        });
        expect(result).toContain(`${size}x${size}`);
      });
    });
  });

  describe('getRecommendedCanvaLogoType', () => {
    it('recommends icon type for sizes below 50px', () => {
      expect(getRecommendedCanvaLogoType(24)).toBe('icon');
      expect(getRecommendedCanvaLogoType(32)).toBe('icon');
      expect(getRecommendedCanvaLogoType(49)).toBe('icon');
    });

    it('recommends type logo for sizes 50px and above', () => {
      expect(getRecommendedCanvaLogoType(50)).toBe('type');
      expect(getRecommendedCanvaLogoType(64)).toBe('type');
      expect(getRecommendedCanvaLogoType(100)).toBe('type');
    });

    it('handles edge case at 50px boundary', () => {
      expect(getRecommendedCanvaLogoType(50)).toBe('type');
      expect(getRecommendedCanvaLogoType(49.9)).toBe('icon');
    });
  });

  describe('Brand Constants', () => {
    it('defines official Canva brand colors', () => {
      expect(CANVA_COLORS.primary).toBe('#00C4CC');
      expect(CANVA_COLORS.purple).toBe('#8B46FF');
      expect(CANVA_COLORS.pink).toBe('#FF6DC7');
      expect(CANVA_COLORS.white).toBe('#FFFFFF');
      expect(CANVA_COLORS.black).toBe('#000000');
    });

    it('defines UI icon identifiers', () => {
      expect(CANVA_UI_ICONS.canva).toBe('canva-icon');
      expect(CANVA_UI_ICONS.canvaType).toBe('canva-type');
      expect(CANVA_UI_ICONS.canvaCircle).toBe('canva-circle');
    });

    it('provides appropriate alt texts', () => {
      expect(CANVA_ALT_TEXTS.icon).toBe('Canva icon');
      expect(CANVA_ALT_TEXTS.type).toBe('Canva logo');
      expect(CANVA_ALT_TEXTS.circle).toBe('Canva circle logo');
      expect(CANVA_ALT_TEXTS.poweredBy).toBe('Powered by Canva');
      expect(CANVA_ALT_TEXTS.integration).toBe('Canva integration');
    });
  });

  describe('Logo Presets', () => {
    it('defines buttonIcon preset for small interactive elements', () => {
      const preset = CANVA_LOGO_PRESETS.buttonIcon;
      expect(preset.type).toBe('icon');
      expect(preset.format).toBe('svg');
      expect(preset.size).toBe('32');
    });

    it('defines navigationIcon preset for navigation elements', () => {
      const preset = CANVA_LOGO_PRESETS.navigationIcon;
      expect(preset.type).toBe('icon');
      expect(preset.format).toBe('svg');
      expect(preset.size).toBe('64');
    });

    it('defines headerLogo preset for branding areas', () => {
      const preset = CANVA_LOGO_PRESETS.headerLogo;
      expect(preset.type).toBe('type');
      expect(preset.format).toBe('svg');
      expect(preset.size).toBe('128');
    });

    it('defines footerLogo preset for attribution', () => {
      const preset = CANVA_LOGO_PRESETS.footerLogo;
      expect(preset.type).toBe('type');
      expect(preset.format).toBe('svg');
      expect(preset.size).toBe('64');
    });

    it('all presets prefer SVG format for web', () => {
      Object.values(CANVA_LOGO_PRESETS).forEach(preset => {
        expect(preset.format).toBe('svg');
      });
    });

    it('uses appropriate logo types based on brand guidelines', () => {
      // Small elements use icon logo
      expect(CANVA_LOGO_PRESETS.buttonIcon.type).toBe('icon');
      expect(CANVA_LOGO_PRESETS.navigationIcon.type).toBe('icon');

      // Larger branding elements use type logo
      expect(CANVA_LOGO_PRESETS.headerLogo.type).toBe('type');
      expect(CANVA_LOGO_PRESETS.footerLogo.type).toBe('type');
    });
  });

  describe('Type Definitions', () => {
    it('accepts valid logo types', () => {
      const validTypes: CanvaLogoType[] = ['icon', 'circle', 'type'];

      validTypes.forEach(type => {
        const result = getCanvaLogo({ type });
        expect(result).toBeTruthy();
        expect(result).toContain(type === 'icon' ? 'Icon' : type);
      });
    });

    it('accepts valid logo sizes', () => {
      const validSizes: CanvaLogoSize[] = ['32', '64', '128', '256', '512'];

      validSizes.forEach(size => {
        const result = getCanvaLogo({
          type: 'icon',
          format: 'png',
          size
        });
        expect(result).toContain(size);
      });
    });

    it('accepts valid logo formats', () => {
      const validFormats: CanvaLogoFormat[] = ['svg', 'png'];

      validFormats.forEach(format => {
        const result = getCanvaLogo({
          type: 'icon',
          format
        });
        expect(result).toContain(`.${format}`);
      });
    });
  });

  describe('Brand Guidelines Compliance', () => {
    it('maintains original Canva colors without modifications', () => {
      // Ensure we're not modifying Canva's brand colors
      expect(CANVA_COLORS.primary).not.toBe('#1976d2'); // Not modified to app primary
      expect(CANVA_COLORS.primary).toBe('#00C4CC'); // Official Canva color
    });

    it('provides proper logo selection for surfaces below 50px', () => {
      const smallSurfaceType = getRecommendedCanvaLogoType(40);
      expect(smallSurfaceType).toBe('icon');
    });

    it('provides proper logo selection for surfaces above 50px', () => {
      const largeSurfaceType = getRecommendedCanvaLogoType(60);
      expect(largeSurfaceType).toBe('type');
    });

    it('prefers SVG format for web performance and scalability', () => {
      Object.values(CANVA_LOGO_PRESETS).forEach(preset => {
        expect(preset.format).toBe('svg');
      });
    });
  });
});
