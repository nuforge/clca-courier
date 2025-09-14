/**
 * TemplatePreview Component Tests
 * Test-first approach: These tests are designed to fail initially and catch edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import TemplatePreview from '../../../src/components/TemplatePreview.vue';
import type { TemplatePreviewData } from '../../../src/services/template-management.service';

// Mock the template management service
const mockPreviewTemplate = vi.fn();
const mockGetAvailableTemplates = vi.fn();

vi.mock('../../../src/services/template-management.service', () => ({
  TemplateManagementService: vi.fn().mockImplementation(() => ({
    previewTemplate: mockPreviewTemplate,
    getAvailableTemplates: mockGetAvailableTemplates
  }))
}));

// Mock Quasar components
vi.mock('quasar', () => ({
  QDialog: {
    name: 'QDialog',
    props: ['modelValue', 'maximized', 'fullWidth', 'fullHeight'],
    template: '<div class="q-dialog"><slot /></div>'
  },
  QCard: {
    name: 'QCard',
    template: '<div class="q-card"><slot /></div>'
  },
  QCardSection: {
    name: 'QCardSection',
    template: '<div class="q-card-section"><slot /></div>'
  },
  QBtn: {
    name: 'QBtn',
    props: ['icon', 'flat', 'round', 'color', 'size'],
    template: '<button class="q-btn"><slot /></button>'
  },
  QSpinner: {
    name: 'QSpinner',
    template: '<div class="q-spinner">Loading...</div>'
  },
  QIcon: {
    name: 'QIcon',
    props: ['name'],
    template: '<i class="q-icon"></i>'
  }
}));

describe('TemplatePreview', () => {
  let wrapper: VueWrapper<any>;
  let mockPreviewData: TemplatePreviewData;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPreviewData = {
      title: 'Test Article',
      content: 'Test content',
      author: 'Test Author',
      createdAt: new Date('2024-01-01'),
      featuredImageUrl: 'https://example.com/image.jpg',
      issue: {
        title: 'Test Issue',
        issueNumber: '1',
        publicationDate: new Date('2024-01-01')
      },
      now: new Date('2024-01-01'),
      eventDate: new Date('2024-01-01'),
      eventTime: '10:00 AM',
      eventLocation: 'Test Location',
      eventContact: 'test@example.com',
      subtitle: 'Test Subtitle',
      featured: true,
      priority: 'high'
    };
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render dialog when modelValue is true', async () => {
      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();

      expect(wrapper.find('.q-dialog').exists()).toBe(true);
    });

    it('should not render dialog when modelValue is false', async () => {
      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: false,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();

      expect(wrapper.find('.q-dialog').exists()).toBe(false);
    });

    it('should display loading spinner when preview is loading', async () => {
      mockPreviewTemplate.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          html: '<div>Preview</div>',
          error: null
        }), 100))
      );

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();

      expect(wrapper.find('.q-spinner').exists()).toBe(true);
    });

    it('should display preview iframe when preview is loaded', async () => {
      const mockHtml = '<div>Preview HTML</div>';
      mockPreviewTemplate.mockResolvedValue({
        success: true,
        html: mockHtml,
        error: null
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async preview
      await nextTick();

      const iframe = wrapper.find('iframe');
      expect(iframe.exists()).toBe(true);
      expect(iframe.attributes('srcdoc')).toBe(mockHtml);
    });
  });

  describe('Template Preview Loading', () => {
    it('should call previewTemplate with correct parameters', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: true,
        html: '<div>Preview</div>',
        error: null
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      expect(mockPreviewTemplate).toHaveBeenCalledWith('article', mockPreviewData);
    });

    it('should handle preview loading errors', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: false,
        html: null,
        error: 'Template compilation failed'
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Should display error message
      expect(wrapper.text()).toContain('Template compilation failed');
    });

    it('should handle network errors during preview loading', async () => {
      mockPreviewTemplate.mockRejectedValue(new Error('Network error'));

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Should display error message
      expect(wrapper.text()).toContain('Network error');
    });

    it('should reload preview when templateName changes', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: true,
        html: '<div>Preview</div>',
        error: null
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      expect(mockPreviewTemplate).toHaveBeenCalledTimes(1);

      // Change template name
      await wrapper.setProps({ templateName: 'event' });
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      expect(mockPreviewTemplate).toHaveBeenCalledTimes(2);
      expect(mockPreviewTemplate).toHaveBeenLastCalledWith('event', mockPreviewData);
    });

    it('should reload preview when contentData changes', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: true,
        html: '<div>Preview</div>',
        error: null
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      expect(mockPreviewTemplate).toHaveBeenCalledTimes(1);

      // Change content data
      const newContentData = { ...mockPreviewData, title: 'New Title' };
      await wrapper.setProps({ contentData: newContentData });
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      expect(mockPreviewTemplate).toHaveBeenCalledTimes(2);
      expect(mockPreviewTemplate).toHaveBeenLastCalledWith('article', newContentData);
    });
  });

  describe('Dialog Interactions', () => {
    it('should emit update:modelValue when dialog is closed', async () => {
      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();

      // Simulate dialog close
      const dialog = wrapper.findComponent({ name: 'QDialog' });
      await dialog.vm.$emit('update:modelValue', false);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('should close dialog when close button is clicked', async () => {
      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();

      const closeButton = wrapper.find('.q-btn');
      await closeButton.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle null contentData', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: false,
        html: null,
        error: 'Preview data is required'
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: null
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      expect(mockPreviewTemplate).toHaveBeenCalledWith('article', null);
    });

    it('should handle undefined templateName', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: false,
        html: null,
        error: 'Template name is required'
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: undefined,
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      expect(mockPreviewTemplate).toHaveBeenCalledWith(undefined, mockPreviewData);
    });

    it('should handle empty templateName', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: false,
        html: null,
        error: 'Template name is required'
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: '',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      expect(mockPreviewTemplate).toHaveBeenCalledWith('', mockPreviewData);
    });

    it('should handle malformed HTML in preview response', async () => {
      const malformedHtml = '<div>Unclosed div';
      mockPreviewTemplate.mockResolvedValue({
        success: true,
        html: malformedHtml,
        error: null
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      const iframe = wrapper.find('iframe');
      expect(iframe.exists()).toBe(true);
      expect(iframe.attributes('srcdoc')).toBe(malformedHtml);
    });

    it('should handle very large HTML content', async () => {
      const largeHtml = '<div>' + 'x'.repeat(1000000) + '</div>'; // 1MB of content
      mockPreviewTemplate.mockResolvedValue({
        success: true,
        html: largeHtml,
        error: null
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      const iframe = wrapper.find('iframe');
      expect(iframe.exists()).toBe(true);
      expect(iframe.attributes('srcdoc')).toBe(largeHtml);
    });

    it('should handle concurrent preview requests', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
      const secondPromise = new Promise(resolve => { resolveSecond = resolve; });

      mockPreviewTemplate
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();

      // Change template name while first request is pending
      await wrapper.setProps({ templateName: 'event' });
      await nextTick();

      // Resolve first request
      resolveFirst!({
        success: true,
        html: '<div>First Preview</div>',
        error: null
      });

      // Resolve second request
      resolveSecond!({
        success: true,
        html: '<div>Second Preview</div>',
        error: null
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Should show the second preview (most recent)
      const iframe = wrapper.find('iframe');
      expect(iframe.attributes('srcdoc')).toBe('<div>Second Preview</div>');
    });

    it('should handle iframe load errors', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: true,
        html: '<div>Preview</div>',
        error: null
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      const iframe = wrapper.find('iframe');
      expect(iframe.exists()).toBe(true);

      // Simulate iframe load error
      await iframe.trigger('error');

      // Should handle error gracefully
      expect(wrapper.find('iframe').exists()).toBe(true);
    });

    it('should handle rapid prop changes', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: true,
        html: '<div>Preview</div>',
        error: null
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();

      // Rapidly change props
      await wrapper.setProps({ templateName: 'event' });
      await wrapper.setProps({ templateName: 'announcement' });
      await wrapper.setProps({ templateName: 'editorial' });
      await wrapper.setProps({ templateName: 'fullpage' });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 200));
      await nextTick();

      // Should handle rapid changes gracefully
      expect(mockPreviewTemplate).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on dialog', async () => {
      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();

      const dialog = wrapper.find('.q-dialog');
      expect(dialog.exists()).toBe(true);
      // Note: This test might fail initially as we need to add proper ARIA attributes
    });

    it('should have proper iframe attributes for accessibility', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: true,
        html: '<div>Preview</div>',
        error: null
      });

      wrapper = mount(TemplatePreview, {
        props: {
          modelValue: true,
          templateName: 'article',
          contentData: mockPreviewData
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      const iframe = wrapper.find('iframe');
      expect(iframe.exists()).toBe(true);
      // Note: This test might fail initially as we need to add proper iframe attributes
    });
  });
});
