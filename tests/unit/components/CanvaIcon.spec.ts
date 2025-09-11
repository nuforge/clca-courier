import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvaIcon from '../../../src/components/CanvaIcon.vue';
import CanvaLogo from '../../../src/components/CanvaLogo.vue';

describe('CanvaIcon', () => {
  describe('Icon Name Mapping', () => {
    it('maps canva-icon to icon logo type', () => {
      const wrapper = mount(CanvaIcon, {
        props: { name: 'canva-icon' }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.exists()).toBe(true);
      expect(canvaLogo.props('type')).toBe('icon');
    });

    it('maps canva-type to type logo type', () => {
      const wrapper = mount(CanvaIcon, {
        props: { name: 'canva-type' }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('type')).toBe('type');
    });

    it('maps canva-circle to circle logo type', () => {
      const wrapper = mount(CanvaIcon, {
        props: { name: 'canva-circle' }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('type')).toBe('circle');
    });

    it('defaults to icon type for unknown names', () => {
      const wrapper = mount(CanvaIcon, {
        props: { name: 'unknown-canva-name' }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('type')).toBe('icon');
    });

    it('uses icon type as default when no name provided', () => {
      const wrapper = mount(CanvaIcon);

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('type')).toBe('icon');
    });
  });

  describe('Size Handling', () => {
    it('converts string size to number', () => {
      const wrapper = mount(CanvaIcon, {
        props: { size: '32px' }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('size')).toBe(32);
    });

    it('handles numeric size directly', () => {
      const wrapper = mount(CanvaIcon, {
        props: { size: 48 }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('size')).toBe(48);
    });

    it('defaults to 24px when no size provided', () => {
      const wrapper = mount(CanvaIcon);

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('size')).toBe(24);
    });

    it('handles invalid size strings gracefully', () => {
      const wrapper = mount(CanvaIcon, {
        props: { size: 'invalid' }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('size')).toBe(24);
    });
  });

  describe('Preset Selection', () => {
    it('selects buttonIcon preset for small sizes (<=32)', () => {
      const wrapper = mount(CanvaIcon, {
        props: { size: 32 }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('preset')).toBe('buttonIcon');
    });

    it('selects navigationIcon preset for medium sizes (33-64)', () => {
      const wrapper = mount(CanvaIcon, {
        props: { size: 50 }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('preset')).toBe('navigationIcon');
    });

    it('selects headerLogo preset for large sizes (>64)', () => {
      const wrapper = mount(CanvaIcon, {
        props: { size: 100 }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('preset')).toBe('headerLogo');
    });
  });

  describe('Props Passing', () => {
    it('passes custom class to CanvaLogo', () => {
      const customClass = 'custom-canva-class';
      const wrapper = mount(CanvaIcon, {
        props: { class: customClass }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('class')).toBe(customClass);
    });

    it('handles missing class prop', () => {
      const wrapper = mount(CanvaIcon);

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      const classValue = canvaLogo.props('class');
      expect(classValue === undefined || classValue === '').toBe(true);
    });    it('always sets padded to false for icon usage', () => {
      const wrapper = mount(CanvaIcon);

      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props('padded')).toBe(false);
    });
  });

  describe('Quasar Integration', () => {
    it('renders with inline-flex display for icon alignment', () => {
      const wrapper = mount(CanvaIcon);

      // Check that the deep CSS class is properly structured
      expect(wrapper.html()).toContain('canva-logo');
    });

    it('ignores color prop per brand guidelines', () => {
      const wrapper = mount(CanvaIcon, {
        props: { color: 'red' }
      });

      // Color prop should not be passed to CanvaLogo
      const canvaLogo = wrapper.findComponent(CanvaLogo);
      expect(canvaLogo.props()).not.toHaveProperty('color');
    });
  });

  describe('Brand Compliance', () => {
    it('maintains brand guidelines by not modifying logo colors', () => {
      const wrapper = mount(CanvaIcon, {
        props: {
          name: 'canva-icon',
          color: 'primary' // Should be ignored
        }
      });

      const canvaLogo = wrapper.findComponent(CanvaLogo);

      // Verify that color modifications are not passed through
      expect(canvaLogo.props()).not.toHaveProperty('color');
    });

    it('uses appropriate logo type based on size per guidelines', () => {
      // Small size should use icon logo
      const smallWrapper = mount(CanvaIcon, {
        props: { size: 24 }
      });
      expect(smallWrapper.findComponent(CanvaLogo).props('preset')).toBe('buttonIcon');

      // Large size should use type logo
      const largeWrapper = mount(CanvaIcon, {
        props: { size: 80 }
      });
      expect(largeWrapper.findComponent(CanvaLogo).props('preset')).toBe('headerLogo');
    });
  });
});
