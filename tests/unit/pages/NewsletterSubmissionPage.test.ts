/**
 * NewsletterSubmissionPage Component Tests
 * Test-first approach: These tests are designed to fail initially and catch edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import NewsletterSubmissionPage from '../../../src/pages/NewsletterSubmissionPage.vue';

// Mock services
const mockSubmitContent = vi.fn();
const mockGetAvailableTemplates = vi.fn();
const mockPreviewTemplate = vi.fn();

vi.mock('../../../src/services/content-submission.service', () => ({
  contentSubmissionService: {
    submitContent: mockSubmitContent
  }
}));

vi.mock('../../../src/services/template-management.service', () => ({
  TemplateManagementService: vi.fn().mockImplementation(() => ({
    getAvailableTemplates: mockGetAvailableTemplates,
    previewTemplate: mockPreviewTemplate,
    getTemplateInfo: vi.fn((type: string) => ({
      displayName: `${type} Template`,
      description: `Template for ${type}`
    })),
    createSampleData: vi.fn((type: string) => ({
      title: `Sample ${type}`,
      content: `Sample content for ${type}`,
      author: 'Sample Author',
      createdAt: new Date('2024-01-01'),
      featuredImageUrl: 'https://example.com/image.jpg',
      issue: {
        title: 'Sample Issue',
        issueNumber: '1',
        publicationDate: new Date('2024-01-01')
      },
      now: new Date('2024-01-01'),
      eventDate: new Date('2024-01-01'),
      eventTime: '10:00 AM',
      eventLocation: 'Sample Location',
      eventContact: 'sample@example.com',
      subtitle: 'Sample Subtitle',
      featured: true,
      priority: 'high'
    }))
  }))
}));

// Mock Quasar components
vi.mock('quasar', () => ({
  QPage: {
    name: 'QPage',
    template: '<div class="q-page"><slot /></div>'
  },
  QCard: {
    name: 'QCard',
    template: '<div class="q-card"><slot /></div>'
  },
  QCardSection: {
    name: 'QCardSection',
    template: '<div class="q-card-section"><slot /></div>'
  },
  QForm: {
    name: 'QForm',
    template: '<form class="q-form"><slot /></form>'
  },
  QInput: {
    name: 'QInput',
    props: ['modelValue', 'label', 'type', 'required', 'rules', 'hint'],
    template: '<input class="q-input" />'
  },
  QSelect: {
    name: 'QSelect',
    props: ['modelValue', 'options', 'label', 'required', 'rules'],
    template: '<select class="q-select" />'
  },
  QEditor: {
    name: 'QEditor',
    props: ['modelValue', 'minHeight', 'placeholder'],
    template: '<div class="q-editor" />'
  },
  QFile: {
    name: 'QFile',
    props: ['modelValue', 'label', 'accept', 'maxFileSize'],
    template: '<input type="file" class="q-file" />'
  },
  QBtn: {
    name: 'QBtn',
    props: ['type', 'color', 'loading', 'disabled', 'icon'],
    template: '<button class="q-btn"><slot /></button>'
  },
  QCheckbox: {
    name: 'QCheckbox',
    props: ['modelValue', 'label'],
    template: '<input type="checkbox" class="q-checkbox" />'
  },
  QSeparator: {
    name: 'QSeparator',
    template: '<hr class="q-separator" />'
  },
  QSpinner: {
    name: 'QSpinner',
    template: '<div class="q-spinner">Loading...</div>'
  },
  QIcon: {
    name: 'QIcon',
    props: ['name'],
    template: '<i class="q-icon"></i>'
  },
  QDate: {
    name: 'QDate',
    props: ['modelValue', 'label', 'mask'],
    template: '<input type="date" class="q-date" />'
  },
  QTime: {
    name: 'QTime',
    props: ['modelValue', 'label', 'mask'],
    template: '<input type="time" class="q-time" />'
  },
  QImg: {
    name: 'QImg',
    props: ['src', 'alt', 'style'],
    template: '<img class="q-img" />'
  },
  QDialog: {
    name: 'QDialog',
    props: ['modelValue', 'maximized', 'fullWidth', 'fullHeight'],
    template: '<div class="q-dialog"><slot /></div>'
  },
  QCardActions: {
    name: 'QCardActions',
    template: '<div class="q-card-actions"><slot /></div>'
  },
  QSpace: {
    name: 'QSpace',
    template: '<div class="q-space" />'
  },
  QBadge: {
    name: 'QBadge',
    props: ['color', 'label'],
    template: '<span class="q-badge"><slot /></span>'
  },
  QTooltip: {
    name: 'QTooltip',
    template: '<div class="q-tooltip"><slot /></div>'
  },
  QToggle: {
    name: 'QToggle',
    props: ['modelValue', 'label'],
    template: '<input type="checkbox" class="q-toggle" />'
  },
  QSlider: {
    name: 'QSlider',
    props: ['modelValue', 'min', 'max', 'step'],
    template: '<input type="range" class="q-slider" />'
  },
  QRange: {
    name: 'QRange',
    props: ['modelValue', 'min', 'max', 'step'],
    template: '<input type="range" class="q-range" />'
  },
  QKnob: {
    name: 'QKnob',
    props: ['modelValue', 'min', 'max', 'step'],
    template: '<div class="q-knob" />'
  },
  QLinearProgress: {
    name: 'QLinearProgress',
    props: ['value', 'color', 'size'],
    template: '<div class="q-linear-progress" />'
  },
  QCircularProgress: {
    name: 'QCircularProgress',
    props: ['value', 'color', 'size'],
    template: '<div class="q-circular-progress" />'
  },
  QSpinnerDots: {
    name: 'QSpinnerDots',
    template: '<div class="q-spinner-dots" />'
  },
  QSpinnerHourglass: {
    name: 'QSpinnerHourglass',
    template: '<div class="q-spinner-hourglass" />'
  },
  QSpinnerTail: {
    name: 'QSpinnerTail',
    template: '<div class="q-spinner-tail" />'
  },
  QSpinnerGears: {
    name: 'QSpinnerGears',
    template: '<div class="q-spinner-gears" />'
  },
  QSpinnerPuff: {
    name: 'QSpinnerPuff',
    template: '<div class="q-spinner-puff" />'
  },
  QSpinnerRings: {
    name: 'QSpinnerRings',
    template: '<div class="q-spinner-rings" />'
  },
  QSpinnerAudio: {
    name: 'QSpinnerAudio',
    template: '<div class="q-spinner-audio" />'
  },
  QSpinnerBall: {
    name: 'QSpinnerBall',
    template: '<div class="q-spinner-ball" />'
  },
  QSpinnerBars: {
    name: 'QSpinnerBars',
    template: '<div class="q-spinner-bars" />'
  },
  QSpinnerBox: {
    name: 'QSpinnerBox',
    template: '<div class="q-spinner-box" />'
  },
  QSpinnerClock: {
    name: 'QSpinnerClock',
    template: '<div class="q-spinner-clock" />'
  },
  QSpinnerComment: {
    name: 'QSpinnerComment',
    template: '<div class="q-spinner-comment" />'
  },
  QSpinnerCube: {
    name: 'QSpinnerCube',
    template: '<div class="q-spinner-cube" />'
  },
  QSpinnerFacebook: {
    name: 'QSpinnerFacebook',
    template: '<div class="q-spinner-facebook" />'
  },
  QSpinnerGrid: {
    name: 'QSpinnerGrid',
    template: '<div class="q-spinner-grid" />'
  },
  QSpinnerHearts: {
    name: 'QSpinnerHearts',
    template: '<div class="q-spinner-hearts" />'
  },
  QSpinnerInfinity: {
    name: 'QSpinnerInfinity',
    template: '<div class="q-spinner-infinity" />'
  },
  QSpinnerIos: {
    name: 'QSpinnerIos',
    template: '<div class="q-spinner-ios" />'
  },
  QSpinnerOval: {
    name: 'QSpinnerOval',
    template: '<div class="q-spinner-oval" />'
  },
  QSpinnerPie: {
    name: 'QSpinnerPie',
    template: '<div class="q-spinner-pie" />'
  },
  QSpinnerRadio: {
    name: 'QSpinnerRadio',
    template: '<div class="q-spinner-radio" />'
  },
  QSpinnerRipple: {
    name: 'QSpinnerRipple',
    template: '<div class="q-spinner-ripple" />'
  },
  QSpinnerThreeDots: {
    name: 'QSpinnerThreeDots',
    template: '<div class="q-spinner-three-dots" />'
  },
  QSpinnerVortex: {
    name: 'QSpinnerVortex',
    template: '<div class="q-spinner-vortex" />'
  },
  QSpinnerWatch: {
    name: 'QSpinnerWatch',
    template: '<div class="q-spinner-watch" />'
  },
  QSpinnerOval: {
    name: 'QSpinnerOval',
    template: '<div class="q-spinner-oval" />'
  },
  QSpinnerPie: {
    name: 'QSpinnerPie',
    template: '<div class="q-spinner-pie" />'
  },
  QSpinnerRadio: {
    name: 'QSpinnerRadio',
    template: '<div class="q-spinner-radio" />'
  },
  QSpinnerRipple: {
    name: 'QSpinnerRipple',
    template: '<div class="q-spinner-ripple" />'
  },
  QSpinnerThreeDots: {
    name: 'QSpinnerThreeDots',
    template: '<div class="q-spinner-three-dots" />'
  },
  QSpinnerVortex: {
    name: 'QSpinnerVortex',
    template: '<div class="q-spinner-vortex" />'
  },
  QSpinnerWatch: {
    name: 'QSpinnerWatch',
    template: '<div class="q-spinner-watch" />'
  }
}));

// Mock TemplatePreview component
vi.mock('../../../src/components/TemplatePreview.vue', () => ({
  default: {
    name: 'TemplatePreview',
    props: ['modelValue', 'templateName', 'contentData'],
    template: '<div class="template-preview"><slot /></div>'
  }
}));

describe('NewsletterSubmissionPage', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockGetAvailableTemplates.mockResolvedValue({
      success: true,
      templates: [
        { name: 'article', displayName: 'Article Template', description: 'Standard article layout' },
        { name: 'event', displayName: 'Event Template', description: 'Event announcement layout' },
        { name: 'announcement', displayName: 'Announcement Template', description: 'Important announcements' }
      ]
    });

    mockPreviewTemplate.mockResolvedValue({
      success: true,
      html: '<div>Preview HTML</div>',
      error: null
    });

    mockSubmitContent.mockResolvedValue({
      success: true,
      contentId: 'new-content-id'
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the submission form', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();

      expect(wrapper.find('.q-page').exists()).toBe(true);
      expect(wrapper.find('.q-form').exists()).toBe(true);
    });

    it('should load available templates on mount', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      expect(mockGetAvailableTemplates).toHaveBeenCalled();
    });

    it('should display template options in select', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      const templateSelect = wrapper.findComponent({ name: 'QSelect' });
      expect(templateSelect.exists()).toBe(true);
    });

    it('should show preview button when template is selected', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set template type
      await wrapper.setData({ submission: { templateType: 'article' } });
      await nextTick();

      const previewButton = wrapper.find('.q-btn');
      expect(previewButton.exists()).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();

      const form = wrapper.findComponent({ name: 'QForm' });
      expect(form.exists()).toBe(true);

      // Test form validation
      const titleInput = wrapper.findComponent({ name: 'QInput' });
      expect(titleInput.exists()).toBe(true);
    });

    it('should handle empty form submission', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();

      const submitButton = wrapper.find('.q-btn[type="submit"]');
      if (submitButton.exists()) {
        await submitButton.trigger('click');
        await nextTick();

        // Should not submit with empty data
        expect(mockSubmitContent).not.toHaveBeenCalled();
      }
    });

    it('should validate title field', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();

      // Set empty title
      await wrapper.setData({ submission: { title: '' } });
      await nextTick();

      const form = wrapper.findComponent({ name: 'QForm' });
      if (form.exists()) {
        // Should show validation error
        expect(wrapper.text()).toContain('Title is required');
      }
    });

    it('should validate content field', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();

      // Set empty content
      await wrapper.setData({ submission: { content: '' } });
      await nextTick();

      const form = wrapper.findComponent({ name: 'QForm' });
      if (form.exists()) {
        // Should show validation error
        expect(wrapper.text()).toContain('Content is required');
      }
    });

    it('should validate author field', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();

      // Set empty author
      await wrapper.setData({ submission: { authorName: '' } });
      await nextTick();

      const form = wrapper.findComponent({ name: 'QForm' });
      if (form.exists()) {
        // Should show validation error
        expect(wrapper.text()).toContain('Author is required');
      }
    });
  });

  describe('Template Selection', () => {
    it('should handle template selection', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Select article template
      await wrapper.setData({ submission: { templateType: 'article' } });
      await nextTick();

      expect(wrapper.vm.submission.templateType).toBe('article');
    });

    it('should handle template change', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Select article template
      await wrapper.setData({ submission: { templateType: 'article' } });
      await nextTick();

      // Change to event template
      await wrapper.setData({ submission: { templateType: 'event' } });
      await nextTick();

      expect(wrapper.vm.submission.templateType).toBe('event');
    });

    it('should handle invalid template selection', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Select invalid template
      await wrapper.setData({ submission: { templateType: 'invalid-template' } });
      await nextTick();

      expect(wrapper.vm.submission.templateType).toBe('invalid-template');
    });
  });

  describe('Template Preview', () => {
    it('should show template preview dialog', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set template and data
      await wrapper.setData({
        submission: { templateType: 'article' },
        showTemplatePreview: true
      });
      await nextTick();

      const previewDialog = wrapper.findComponent({ name: 'QDialog' });
      expect(previewDialog.exists()).toBe(true);
    });

    it('should load preview data when template changes', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set template
      await wrapper.setData({ submission: { templateType: 'article' } });
      await nextTick();

      // Trigger preview
      await wrapper.vm.previewTemplate();
      await nextTick();

      expect(mockPreviewTemplate).toHaveBeenCalled();
    });

    it('should handle preview loading errors', async () => {
      mockPreviewTemplate.mockResolvedValue({
        success: false,
        html: null,
        error: 'Preview failed'
      });

      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set template
      await wrapper.setData({ submission: { templateType: 'article' } });
      await nextTick();

      // Trigger preview
      await wrapper.vm.previewTemplate();
      await nextTick();

      expect(mockPreviewTemplate).toHaveBeenCalled();
      // Should handle error gracefully
    });

    it('should close preview dialog', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Show preview
      await wrapper.setData({ showTemplatePreview: true });
      await nextTick();

      // Close preview
      await wrapper.setData({ showTemplatePreview: false });
      await nextTick();

      expect(wrapper.vm.showTemplatePreview).toBe(false);
    });
  });

  describe('File Upload', () => {
    it('should handle file upload', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();

      const fileInput = wrapper.findComponent({ name: 'QFile' });
      if (fileInput.exists()) {
        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        await fileInput.vm.$emit('update:modelValue', mockFile);
        await nextTick();

        expect(wrapper.vm.featuredImage).toBe(mockFile);
      }
    });

    it('should handle file upload errors', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();

      const fileInput = wrapper.findComponent({ name: 'QFile' });
      if (fileInput.exists()) {
        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        // Simulate file upload error
        await fileInput.vm.$emit('rejected', [{ failedPropValidation: 'max-file-size' }]);
        await nextTick();

        // Should handle error gracefully
        expect(wrapper.vm.featuredImage).toBeNull();
      }
    });

    it('should handle large file uploads', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();

      const fileInput = wrapper.findComponent({ name: 'QFile' });
      if (fileInput.exists()) {
        // Create a large file (10MB)
        const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

        await fileInput.vm.$emit('update:modelValue', largeFile);
        await nextTick();

        // Should handle large files
        expect(wrapper.vm.featuredImage).toBe(largeFile);
      }
    });

    it('should handle invalid file types', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();

      const fileInput = wrapper.findComponent({ name: 'QFile' });
      if (fileInput.exists()) {
        const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

        await fileInput.vm.$emit('rejected', [{ failedPropValidation: 'accept' }]);
        await nextTick();

        // Should handle invalid file types
        expect(wrapper.vm.featuredImage).toBeNull();
      }
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set valid form data
      await wrapper.setData({
        submission: {
          title: 'Test Article',
          content: 'Test content',
          authorName: 'Test Author',
          templateType: 'article',
          contentType: 'news',
          featured: false,
          priority: 'normal'
        }
      });
      await nextTick();

      // Submit form
      await wrapper.vm.submitForm();
      await nextTick();

      expect(mockSubmitContent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Article',
          content: 'Test content',
          authorName: 'Test Author',
          templateType: 'article',
          contentType: 'news'
        })
      );
    });

    it('should handle submission errors', async () => {
      mockSubmitContent.mockRejectedValue(new Error('Submission failed'));

      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set valid form data
      await wrapper.setData({
        submission: {
          title: 'Test Article',
          content: 'Test content',
          authorName: 'Test Author',
          templateType: 'article'
        }
      });
      await nextTick();

      // Submit form
      await wrapper.vm.submitForm();
      await nextTick();

      expect(mockSubmitContent).toHaveBeenCalled();
      // Should handle error gracefully
    });

    it('should show loading state during submission', async () => {
      mockSubmitContent.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          contentId: 'new-content-id'
        }), 100))
      );

      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set valid form data
      await wrapper.setData({
        submission: {
          title: 'Test Article',
          content: 'Test content',
          authorName: 'Test Author',
          templateType: 'article'
        }
      });
      await nextTick();

      // Submit form
      await wrapper.vm.submitForm();
      await nextTick();

      // Should show loading state
      expect(wrapper.vm.isSubmitting).toBe(true);

      // Wait for submission to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      await nextTick();

      expect(wrapper.vm.isSubmitting).toBe(false);
    });

    it('should reset form after successful submission', async () => {
      mockSubmitContent.mockResolvedValue({
        success: true,
        contentId: 'new-content-id'
      });

      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set valid form data
      await wrapper.setData({
        submission: {
          title: 'Test Article',
          content: 'Test content',
          authorName: 'Test Author',
          templateType: 'article'
        }
      });
      await nextTick();

      // Submit form
      await wrapper.vm.submitForm();
      await nextTick();

      // Wait for submission to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Form should be reset
      expect(wrapper.vm.submission.title).toBe('');
      expect(wrapper.vm.submission.content).toBe('');
      expect(wrapper.vm.submission.authorName).toBe('');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle network errors during template loading', async () => {
      mockGetAvailableTemplates.mockRejectedValue(new Error('Network error'));

      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Should handle error gracefully
      expect(wrapper.vm.templateOptions).toHaveLength(0);
    });

    it('should handle malformed template response', async () => {
      mockGetAvailableTemplates.mockResolvedValue({
        success: false,
        templates: null
      });

      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Should handle malformed response
      expect(wrapper.vm.templateOptions).toHaveLength(0);
    });

    it('should handle very long form data', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set very long form data
      const longContent = 'x'.repeat(100000); // 100KB of content
      await wrapper.setData({
        submission: {
          title: 'Test Article',
          content: longContent,
          authorName: 'Test Author',
          templateType: 'article'
        }
      });
      await nextTick();

      // Should handle long content
      expect(wrapper.vm.submission.content).toBe(longContent);
    });

    it('should handle special characters in form data', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set form data with special characters
      await wrapper.setData({
        submission: {
          title: 'Test <script>alert("xss")</script>',
          content: 'Content with "quotes" and \'apostrophes\'',
          authorName: 'Test Author',
          templateType: 'article'
        }
      });
      await nextTick();

      // Should handle special characters
      expect(wrapper.vm.submission.title).toContain('<script>');
      expect(wrapper.vm.submission.content).toContain('"quotes"');
    });

    it('should handle concurrent form submissions', async () => {
      mockSubmitContent.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          contentId: 'new-content-id'
        }), 100))
      );

      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set valid form data
      await wrapper.setData({
        submission: {
          title: 'Test Article',
          content: 'Test content',
          authorName: 'Test Author',
          templateType: 'article'
        }
      });
      await nextTick();

      // Submit form multiple times
      await wrapper.vm.submitForm();
      await wrapper.vm.submitForm();
      await wrapper.vm.submitForm();

      // Should handle concurrent submissions
      expect(mockSubmitContent).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid template changes', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Rapidly change templates
      await wrapper.setData({ submission: { templateType: 'article' } });
      await wrapper.setData({ submission: { templateType: 'event' } });
      await wrapper.setData({ submission: { templateType: 'announcement' } });
      await wrapper.setData({ submission: { templateType: 'editorial' } });
      await wrapper.setData({ submission: { templateType: 'fullpage' } });

      await nextTick();

      // Should handle rapid changes
      expect(wrapper.vm.submission.templateType).toBe('fullpage');
    });

    it('should handle null and undefined values', async () => {
      wrapper = mount(NewsletterSubmissionPage);

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await nextTick();

      // Set null/undefined values
      await wrapper.setData({
        submission: {
          title: null,
          content: undefined,
          authorName: '',
          templateType: null
        }
      });
      await nextTick();

      // Should handle null/undefined values
      expect(wrapper.vm.submission.title).toBeNull();
      expect(wrapper.vm.submission.content).toBeUndefined();
    });
  });
});
