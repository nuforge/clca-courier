import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import SearchInput from '../../../src/components/SearchInput.vue';

// Mock Quasar components with simplified stubs
const mockQuasarComponents = vi.hoisted(() => ({
  QInput: {
    name: 'QInput',
    template: `
      <div class="q-input"
           :class="[containerClass, $attrs.class]"
           :data-dark="dark === true ? 'true' : undefined"
           :data-dense="dense === true ? 'true' : undefined"
           :data-standout="standout === true ? 'true' : undefined">
        <slot name="prepend" v-if="$slots.prepend"></slot>
        <input
          :value="modelValue"
          :placeholder="placeholder"
          :class="inputClass"
          @input="$emit('update:model-value', $event.target.value)"
          data-testid="search-input"
        />
        <slot name="append" v-if="$slots.append"></slot>
      </div>
    `,
    props: ['modelValue', 'dark', 'dense', 'standout', 'inputClass', 'containerClass', 'placeholder'],
    emits: ['update:model-value']
  },
  QIcon: {
    name: 'QIcon',
    template: `<i :class="'q-icon'" :data-name="name" @click="$emit('click')">{{ name }}</i>`,
    props: ['name'],
    emits: ['click']
  }
}));// Mock Quasar before component imports
vi.mock('quasar', () => ({
  useQuasar: vi.fn(() => ({
    notify: vi.fn(),
    loading: {
      show: vi.fn(),
      hide: vi.fn()
    }
  })),
  QInput: mockQuasarComponents.QInput,
  QIcon: mockQuasarComponents.QIcon
}));

describe('SearchInput Component', () => {
  let wrapper: VueWrapper<any>;

  const createWrapper = (props = {}) => {
    return mount(SearchInput, {
      props,
      global: {
        components: mockQuasarComponents,
        stubs: {
          QInput: mockQuasarComponents.QInput,
          QIcon: mockQuasarComponents.QIcon
        }
      }
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should mount successfully with default props', () => {
      wrapper = createWrapper();

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.q-input').exists()).toBe(true);
    });

    it('should display default placeholder text', () => {
      wrapper = createWrapper();

      const input = wrapper.find('[data-testid="search-input"]');
      expect(input.attributes('placeholder')).toBe('Search...');
    });

    it('should display custom placeholder text', () => {
      const customPlaceholder = 'Search newsletters...';
      wrapper = createWrapper({ placeholder: customPlaceholder });

      const input = wrapper.find('[data-testid="search-input"]');
      expect(input.attributes('placeholder')).toBe(customPlaceholder);
    });

    it('should initialize with empty search value', () => {
      wrapper = createWrapper();

      const input = wrapper.find('[data-testid="search-input"]');
      expect((input.element as HTMLInputElement).value).toBe('');
    });

    it('should initialize with provided model value', () => {
      const initialValue = 'test search';
      wrapper = createWrapper({ modelValue: initialValue });

      const input = wrapper.find('[data-testid="search-input"]');
      expect((input.element as HTMLInputElement).value).toBe(initialValue);
    });
  });

  describe('Visual Configuration', () => {
    it('should apply dark mode when dark prop is true', () => {
      wrapper = createWrapper({ dark: true });

      const qInput = wrapper.find('.q-input');
      expect(qInput.attributes('data-dark')).toBe('true');
    });

    it('should apply dense mode when dense prop is true', () => {
      wrapper = createWrapper({ dense: true });

      const qInput = wrapper.find('.q-input');
      expect(qInput.attributes('data-dense')).toBe('true');
    });

    it('should apply standout mode when standout prop is true', () => {
      wrapper = createWrapper({ standout: true });

      const qInput = wrapper.find('.q-input');
      expect(qInput.attributes('data-standout')).toBe('true');
    });

    it('should apply custom input class', () => {
      const customClass = 'custom-input-class';
      wrapper = createWrapper({ inputClass: customClass });

      const input = wrapper.find('[data-testid="search-input"]');
      expect(input.classes()).toContain(customClass);
    });

    it('should apply custom container class', () => {
      const customClass = 'custom-container-class';
      wrapper = createWrapper({ containerClass: customClass });

      const qInput = wrapper.find('.q-input');
      expect(qInput.classes()).toContain(customClass);
    });
  });

  describe('Icon Display', () => {
    it('should display default search icon when input is empty', () => {
      wrapper = createWrapper();

      const searchIcon = wrapper.find('[data-name="search"]');
      expect(searchIcon.exists()).toBe(true);
    });

    it('should display custom search icon when specified', () => {
      const customIcon = 'mdi-magnify';
      wrapper = createWrapper({ searchIcon: customIcon });

      const searchIcon = wrapper.find(`[data-name="${customIcon}"]`);
      expect(searchIcon.exists()).toBe(true);
    });

    it('should display prepend icon when specified', () => {
      const prependIcon = 'mdi-folder';
      wrapper = createWrapper({ prependIcon });

      const icon = wrapper.find(`[data-name="${prependIcon}"]`);
      expect(icon.exists()).toBe(true);
    });

    it('should display clear icon when input has value', async () => {
      wrapper = createWrapper({ modelValue: 'search text' });
      await nextTick();

      const clearIcon = wrapper.find('[data-name="clear"]');
      expect(clearIcon.exists()).toBe(true);
    });

    it('should display custom clear icon when specified', async () => {
      const customClearIcon = 'mdi-close';
      wrapper = createWrapper({
        modelValue: 'search text',
        clearIcon: customClearIcon
      });
      await nextTick();

      const clearIcon = wrapper.find(`[data-name="${customClearIcon}"]`);
      expect(clearIcon.exists()).toBe(true);
    });
  });

  describe('User Input Handling', () => {
    it('should update search value when user types', async () => {
      wrapper = createWrapper();

      const input = wrapper.find('[data-testid="search-input"]');
      await input.setValue('new search text');

      expect((input.element as HTMLInputElement).value).toBe('new search text');
    });

    it('should emit update:modelValue when input changes', async () => {
      wrapper = createWrapper();

      const input = wrapper.find('[data-testid="search-input"]');
      await input.setValue('test input');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test input']);
    });

    it('should emit search event when input changes', async () => {
      wrapper = createWrapper();

      const input = wrapper.find('[data-testid="search-input"]');
      await input.setValue('search query');

      expect(wrapper.emitted('search')).toBeTruthy();
      expect(wrapper.emitted('search')?.[0]).toEqual(['search query']);
    });

    it('should handle multiple input changes', async () => {
      wrapper = createWrapper();

      const input = wrapper.find('[data-testid="search-input"]');
      await input.setValue('first');
      await input.setValue('second');
      await input.setValue('third');

      const searchEmissions = wrapper.emitted('search');
      expect(searchEmissions).toHaveLength(3);
      expect(searchEmissions?.[2]).toEqual(['third']);
    });
  });

  describe('Clear Functionality', () => {
    it('should clear search value when clear icon is clicked', async () => {
      wrapper = createWrapper({ modelValue: 'search text' });
      await nextTick();

      const clearIcon = wrapper.find('[data-name="clear"]');
      await clearIcon.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual(['']);
    });

    it('should emit clear event when clear icon is clicked', async () => {
      wrapper = createWrapper({ modelValue: 'search text' });
      await nextTick();

      const clearIcon = wrapper.find('[data-name="clear"]');
      await clearIcon.trigger('click');

      expect(wrapper.emitted('clear')).toBeTruthy();
    });

    it('should switch from clear icon back to search icon after clearing', async () => {
      wrapper = createWrapper({ modelValue: 'search text' });
      await nextTick();

      // Verify clear icon is present
      let clearIcon = wrapper.find('[data-name="clear"]');
      expect(clearIcon.exists()).toBe(true);

      // Click clear icon
      await clearIcon.trigger('click');
      await nextTick();

      // Verify search icon is now present
      const searchIcon = wrapper.find('[data-name="search"]');
      expect(searchIcon.exists()).toBe(true);
    });
  });

  describe('Reactive Behavior', () => {
    it('should update display when modelValue prop changes', async () => {
      wrapper = createWrapper({ modelValue: 'initial' });

      const input = wrapper.find('[data-testid="search-input"]');
      expect((input.element as HTMLInputElement).value).toBe('initial');

      await wrapper.setProps({ modelValue: 'updated' });

      expect((input.element as HTMLInputElement).value).toBe('updated');
    });

    it('should update icon display when value changes from empty to filled', async () => {
      wrapper = createWrapper({ modelValue: '' });

      // Initially should show search icon
      expect(wrapper.find('[data-name="search"]').exists()).toBe(true);
      expect(wrapper.find('[data-name="clear"]').exists()).toBe(false);

      // Update to have value
      await wrapper.setProps({ modelValue: 'search text' });
      await nextTick();

      // Should now show clear icon
      expect(wrapper.find('[data-name="search"]').exists()).toBe(false);
      expect(wrapper.find('[data-name="clear"]').exists()).toBe(true);
    });

    it('should update icon display when value changes from filled to empty', async () => {
      wrapper = createWrapper({ modelValue: 'search text' });

      // Initially should show clear icon
      expect(wrapper.find('[data-name="clear"]').exists()).toBe(true);
      expect(wrapper.find('[data-name="search"]').exists()).toBe(false);

      // Update to be empty
      await wrapper.setProps({ modelValue: '' });
      await nextTick();

      // Should now show search icon
      expect(wrapper.find('[data-name="search"]').exists()).toBe(true);
      expect(wrapper.find('[data-name="clear"]').exists()).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined modelValue gracefully', () => {
      wrapper = createWrapper({ modelValue: undefined });

      const input = wrapper.find('[data-testid="search-input"]');
      expect((input.element as HTMLInputElement).value).toBe('');
    });

    it('should handle empty string placeholder', () => {
      wrapper = createWrapper({ placeholder: '' });

      const input = wrapper.find('[data-testid="search-input"]');
      expect(input.attributes('placeholder')).toBe('');
    });

    it('should handle special characters in search input', async () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      wrapper = createWrapper();

      const input = wrapper.find('[data-testid="search-input"]');
      await input.setValue(specialText);

      expect(wrapper.emitted('search')?.[0]).toEqual([specialText]);
    });

    it('should handle very long search input', async () => {
      const longText = 'A'.repeat(1000);
      wrapper = createWrapper();

      const input = wrapper.find('[data-testid="search-input"]');
      await input.setValue(longText);

      expect(wrapper.emitted('search')?.[0]).toEqual([longText]);
    });

    it('should handle rapid input changes', async () => {
      wrapper = createWrapper();
      const input = wrapper.find('[data-testid="search-input"]');

      // Simulate rapid typing
      await input.setValue('a');
      await input.setValue('ab');
      await input.setValue('abc');
      await input.setValue('abcd');

      const searchEmissions = wrapper.emitted('search');
      expect(searchEmissions).toHaveLength(4);
      expect(searchEmissions?.[3]).toEqual(['abcd']);
    });
  });

  describe('Component Props Validation', () => {
    it('should handle all boolean props correctly', () => {
      wrapper = createWrapper({
        dark: true,
        dense: true,
        standout: true
      });

      const qInput = wrapper.find('.q-input');
      expect(qInput.attributes('data-dark')).toBe('true');
      expect(qInput.attributes('data-dense')).toBe('true');
      expect(qInput.attributes('data-standout')).toBe('true');
    });

    it('should handle all string props correctly', () => {
      const props = {
        modelValue: 'test value',
        inputClass: 'input-class',
        containerClass: 'container-class',
        placeholder: 'Custom placeholder',
        prependIcon: 'prepend-icon',
        searchIcon: 'search-icon',
        clearIcon: 'clear-icon'
      };

      wrapper = createWrapper(props);

      const input = wrapper.find('[data-testid="search-input"]');
      const qInput = wrapper.find('.q-input');

      expect((input.element as HTMLInputElement).value).toBe(props.modelValue);
      expect(input.classes()).toContain(props.inputClass);
      expect(qInput.classes()).toContain(props.containerClass);
      expect(input.attributes('placeholder')).toBe(props.placeholder);
    });
  });
});
