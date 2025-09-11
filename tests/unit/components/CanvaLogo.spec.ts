import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvaLogo from '../../../src/components/CanvaLogo.vue';
import { CANVA_LOGO_PRESETS } from '../../../src/constants/canva-icons';

describe('CanvaLogo', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(CanvaLogo);

      expect(wrapper.find('.canva-logo').exists()).toBe(true);
      expect(wrapper.find('img').exists()).toBe(true);
      expect(wrapper.find('img').attributes('alt')).toBe('Canva icon');
    });

    it('applies custom size correctly', () => {
      const wrapper = mount(CanvaLogo, {
        props: { size: 64 }
      });

      const img = wrapper.find('img');
      expect(img.attributes('style')).toContain('width: 64px');
    });

    it('accepts string size and converts to number', () => {
      const wrapper = mount(CanvaLogo, {
        props: { size: '48px' }
      });

      const img = wrapper.find('img');
      expect(img.attributes('style')).toContain('width: 48px');
    });
  });

  describe('Logo Type Selection', () => {
    it('uses icon logo for small sizes (< 50px)', () => {
      const wrapper = mount(CanvaLogo, {
        props: { size: 32 }
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toContain('Canva Icon logo');
    });

    it('uses type logo for large sizes (>= 50px)', () => {
      const wrapper = mount(CanvaLogo, {
        props: { size: 64 }
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toContain('Canva type logo');
    });

    it('respects explicit type prop regardless of size', () => {
      const wrapper = mount(CanvaLogo, {
        props: { type: 'circle', size: 32 }
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toContain('Canva circle logo');
    });
  });

  describe('Preset Configurations', () => {
    it('applies buttonIcon preset correctly', () => {
      const wrapper = mount(CanvaLogo, {
        props: { preset: 'buttonIcon' }
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toContain('Canva Icon logo');
      expect(img.attributes('alt')).toBe('Canva icon');
    });

    it('applies headerLogo preset correctly', () => {
      const wrapper = mount(CanvaLogo, {
        props: { preset: 'headerLogo' }
      });

      const img = wrapper.find('img');
      expect(img.attributes('src')).toContain('Canva type logo');
      expect(img.attributes('alt')).toBe('Canva logo');
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA attributes when clickable', () => {
      const wrapper = mount(CanvaLogo, {
        props: { clickable: true }
      });

      const container = wrapper.find('.canva-logo');
      expect(container.attributes('role')).toBe('button');
      expect(container.attributes('tabindex')).toBe('0');
      expect(container.attributes('aria-disabled')).toBe('false');
    });

    it('has proper ARIA attributes when disabled', () => {
      const wrapper = mount(CanvaLogo, {
        props: { clickable: true, disabled: true }
      });

      const container = wrapper.find('.canva-logo');
      expect(container.attributes('tabindex')).toBe('-1');
      expect(container.attributes('aria-disabled')).toBe('true');
    });

    it('includes screen reader text', () => {
      const wrapper = mount(CanvaLogo);

      expect(wrapper.find('.sr-only').text()).toBe('Canva icon');
    });

    it('uses custom alt text when provided', () => {
      const customAlt = 'Custom Canva logo';
      const wrapper = mount(CanvaLogo, {
        props: { alt: customAlt }
      });

      expect(wrapper.find('img').attributes('alt')).toBe(customAlt);
      expect(wrapper.find('.sr-only').text()).toBe(customAlt);
    });
  });

  describe('Interactive Behavior', () => {
    it('emits click event when clickable and clicked', async () => {
      const wrapper = mount(CanvaLogo, {
        props: { clickable: true }
      });

      await wrapper.find('.canva-logo').trigger('click');
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('does not emit click when disabled', async () => {
      const wrapper = mount(CanvaLogo, {
        props: { clickable: true, disabled: true }
      });

      await wrapper.find('.canva-logo').trigger('click');
      expect(wrapper.emitted('click')).toBeUndefined();
    });

    it('emits click on Enter key', async () => {
      const wrapper = mount(CanvaLogo, {
        props: { clickable: true }
      });

      await wrapper.find('.canva-logo').trigger('keydown', { key: 'Enter' });
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('emits click on Space key', async () => {
      const wrapper = mount(CanvaLogo, {
        props: { clickable: true }
      });

      await wrapper.find('.canva-logo').trigger('keydown', { key: ' ' });
      expect(wrapper.emitted('click')).toHaveLength(1);
    });
  });

  describe('CSS Classes', () => {
    it('applies padded class by default', () => {
      const wrapper = mount(CanvaLogo);

      expect(wrapper.find('.canva-logo').classes()).toContain('canva-logo--padded');
    });

    it('does not apply padded class when disabled', () => {
      const wrapper = mount(CanvaLogo, {
        props: { padded: false }
      });

      expect(wrapper.find('.canva-logo').classes()).not.toContain('canva-logo--padded');
    });

    it('applies clickable class when clickable', () => {
      const wrapper = mount(CanvaLogo, {
        props: { clickable: true }
      });

      expect(wrapper.find('.canva-logo').classes()).toContain('canva-logo--clickable');
    });

    it('applies size-based classes correctly', () => {
      const wrapperXs = mount(CanvaLogo, { props: { size: 24 } });
      const wrapperSm = mount(CanvaLogo, { props: { size: 40 } });
      const wrapperMd = mount(CanvaLogo, { props: { size: 60 } });
      const wrapperLg = mount(CanvaLogo, { props: { size: 100 } });

      expect(wrapperXs.find('.canva-logo').classes()).toContain('canva-logo--xs');
      expect(wrapperSm.find('.canva-logo').classes()).toContain('canva-logo--sm');
      expect(wrapperMd.find('.canva-logo').classes()).toContain('canva-logo--md');
      expect(wrapperLg.find('.canva-logo').classes()).toContain('canva-logo--lg');
    });
  });

  describe('Brand Guidelines Compliance', () => {
    it('maintains aspect ratio with height auto', () => {
      const wrapper = mount(CanvaLogo);

      const img = wrapper.find('img');
      expect(img.attributes('style')).toContain('height: auto');
    });

    it('prevents image distortion with object-fit contain', () => {
      const wrapper = mount(CanvaLogo);

      const img = wrapper.find('img');
      expect(img.classes()).toContain('canva-logo__image');
    });

    it('includes proper loading attributes for performance', () => {
      const wrapper = mount(CanvaLogo);

      const img = wrapper.find('img');
      expect(img.attributes('loading')).toBe('lazy');
      expect(img.attributes('decoding')).toBe('async');
    });
  });
});
