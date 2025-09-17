/**
 * Page Layout Designer Store
 * Pinia store for managing page layout design state across components
 */

import { defineStore } from 'pinia';
import { ref, computed, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { logger } from '../utils/logger';
import { formatDate } from '../utils/date-formatter';
import { useSiteTheme } from '../composables/useSiteTheme';
import { contentUtils } from '../types/core/content.types';
import { newsletterGenerationService } from '../services/newsletter-generation.service';
import type { ContentDoc } from '../types/core/content.types';
import type { UnifiedNewsletter } from '../types/core/newsletter.types';

// Extended UnifiedNewsletter to support draft issues
export interface NewsletterIssue extends UnifiedNewsletter {
  status: 'draft' | 'generating' | 'ready' | 'published' | 'archived';
  submissions: string[]; // Array of content IDs for new issues
  finalPdfPath?: string; // Path to generated PDF
  finalPdfUrl?: string; // URL to generated PDF
  type?: 'issue' | 'newsletter'; // Distinguish between new issues and existing newsletters
}

export interface ContentArea {
  id: number;
  contentId: string | null;
  size: 'large' | 'medium' | 'small' | 'full' | 'header' | 'calendar' | 'details';
}

export interface PageData {
  id: number;
  areas: unknown[];
}

export interface TemplateOption {
  label: string;
  value: string;
  description: string;
}

export interface LayoutData {
  template: string;
  pages: PageData[];
  contentAreas: ContentArea[];
}

export const usePageLayoutDesignerStore = defineStore('page-layout-designer', () => {
  const $q = useQuasar();
  const { t } = useI18n();
  const router = useRouter();
  const { getContentIcon, getCategoryIcon } = useSiteTheme();

  // Core state
  const selectedIssue = ref<NewsletterIssue | null>(null);
  const approvedSubmissions = ref<ContentDoc[]>([]);

  // Page layout state
  const currentTemplate = ref('standard');
  const pages = ref<PageData[]>([{ id: 1, areas: [] }]);
  const contentAreas = ref<ContentArea[]>([
    { id: 1, contentId: null, size: 'large' },
    { id: 2, contentId: null, size: 'medium' },
    { id: 3, contentId: null, size: 'medium' },
    { id: 4, contentId: null, size: 'small' }
  ]);

  // Drag and drop state
  const draggedContentId = ref<string | null>(null);
  const dragOverArea = ref<number | null>(null);

  // UI state
  const availableContentExpanded = ref(true);
  const contentSearchQuery = ref('');
  const selectedContentStatus = ref('all');
  const showLayoutPreview = ref(false);
  const isLoading = ref(false);

  // Template options for newsletter layout
  const templateOptions: TemplateOption[] = [
    {
      label: 'Standard Newsletter',
      value: 'standard',
      description: 'Classic two-column layout with header and footer'
    },
    {
      label: 'Modern Article Layout',
      value: 'modern',
      description: 'Clean single-column design with emphasis on readability'
    },
    {
      label: 'Event-Focused',
      value: 'event',
      description: 'Optimized for event announcements and calendars'
    },
    {
      label: 'Announcement Style',
      value: 'announcement',
      description: 'Bold design for important announcements'
    },
    {
      label: 'Community Spotlight',
      value: 'community',
      description: 'Highlights community members and achievements'
    }
  ];

  // Content status options for filtering
  const contentStatusOptions = computed(() => [
    { label: t('common.all'), value: 'all' },
    { label: t('content.status.draft'), value: 'draft' },
    { label: t('content.status.approved'), value: 'approved' },
    { label: t('content.status.published'), value: 'published' }
  ]);

  // Available content (ALL newsletter:ready content, not filtered by issue)
  const availableContent = computed(() => {
    console.log('�� availableContent computed called - approvedSubmissions.value:', approvedSubmissions.value);
    console.log('�� availableContent computed called - approvedSubmissions.value.length:', approvedSubmissions.value.length);

    const searchLower = contentSearchQuery.value.toLowerCase();

    const filtered = approvedSubmissions.value.filter(submission => {
      // Apply search filter
      if (contentSearchQuery.value &&
          !submission.title.toLowerCase().includes(searchLower) &&
          !submission.description.toLowerCase().includes(searchLower)) {
        return false;
      }

      // Apply status filter
      if (selectedContentStatus.value !== 'all' && submission.status !== selectedContentStatus.value) {
        return false;
      }

      return true;
    });

    console.log('🔧 availableContent computed result - filtered.length:', filtered.length);

    // Debug logging to help identify content issues
    logger.debug('[CONTENT] Available content filtered', {
      totalSubmissions: approvedSubmissions.value.length,
      filteredCount: filtered.length,
      selectedStatus: selectedContentStatus.value,
      searchQuery: contentSearchQuery.value,
      submissionSample: approvedSubmissions.value.slice(0, 3).map(s => ({
        id: s.id,
        title: s.title,
        status: s.status,
        tags: s.tags
      }))
    });

    return filtered;
  });

  // Issue content (content already in the issue)
  const issueContent = computed(() => {
    console.log('🔧 issueContent computed called - selectedIssue.value:', selectedIssue.value);
    console.log('🔧 issueContent computed called - approvedSubmissions.value.length:', approvedSubmissions.value.length);

    // Add debug logging BEFORE the early return
    logger.debug('[CONTENT] Issue content computed triggered', {
      hasSelectedIssue: !!selectedIssue.value,
      selectedIssueId: selectedIssue.value?.id,
      selectedIssueSubmissions: selectedIssue.value?.submissions,
      approvedSubmissionsCount: approvedSubmissions.value.length
    });

    if (!selectedIssue.value) {
      logger.debug('[CONTENT] No selected issue, returning empty array');
      return [];
    }

    const submissionsMap = new Map(approvedSubmissions.value.map(s => [s.id, s]));

    logger.debug('[CONTENT] Issue content filtered', {
      selectedIssue: selectedIssue.value,
      approvedSubmissions: approvedSubmissions.value,
      totalSubmissions: approvedSubmissions.value.length,
      submissionsMap: submissionsMap,
      submissionSample: approvedSubmissions.value.slice(0, 3).map(s => ({
        id: s.id,
        title: s.title,
        status: s.status,
        tags: s.tags
      })),
      issueSubmissions: selectedIssue.value.submissions,
      mappedResults: selectedIssue.value.submissions.map(submissionId => ({
        submissionId,
        found: !!submissionsMap.get(submissionId),
        content: submissionsMap.get(submissionId)?.title
      }))
    });

    const result = selectedIssue.value.submissions
      .map(submissionId => submissionsMap.get(submissionId))
      .filter(Boolean) as ContentDoc[];

    console.log('🔧 issueContent computed result - result.length:', result.length);

    logger.debug('[CONTENT] Issue content result', {
      resultCount: result.length,
      resultTitles: result.map(r => r.title)
    });

    return result;
  });

  // Check if content is actively placed in layout
  const isContentInLayout = (contentId: string): boolean => {
    return contentAreas.value.some(area => area.contentId === contentId);
  };

  // Get layout area info for content
  const getContentLayoutInfo = (contentId: string): { areaIndex: number; areaSize: string } | null => {
    const areaIndex = contentAreas.value.findIndex(area => area.contentId === contentId);
    if (areaIndex === -1) return null;

    return {
      areaIndex: areaIndex + 1, // 1-based for display
      areaSize: contentAreas.value[areaIndex]?.size || 'unknown'
    };
  };

  // Get submission title by ID
  const getSubmissionTitle = (submissionId: string): string => {
    const submission = approvedSubmissions.value.find(s => s.id === submissionId);
    return submission?.title || 'Unknown';
  };

  // Get submission icon and metadata
  const getSubmissionIcon = (submissionId: string) => {
    const submission = approvedSubmissions.value.find(s => s.id === submissionId);
    if (!submission) return { icon: 'mdi-help-circle', color: 'grey', label: 'Unknown' };

    const contentType = contentUtils.getContentType(submission);
    if (!contentType) return { icon: 'mdi-file-document', color: 'grey', label: 'Article' };

    const categories = contentUtils.getTagsByNamespace(submission, 'category');
    const category = categories[0];

    if (category) {
      return getCategoryIcon(contentType, category);
    } else {
      return getContentIcon(contentType);
    }
  };

  // Get submission preview text
  const getSubmissionPreview = (submissionId: string): string => {
    const submission = approvedSubmissions.value.find(s => s.id === submissionId);
    if (!submission) return 'Content preview not available';

    const preview = submission.description || 'No content preview available';
    return preview.length > 150 ? preview.substring(0, 150) + '...' : preview;
  };

  // Initialize with issue data
  const initializeWithIssue = async (issue: NewsletterIssue | null, submissions: ContentDoc[] = []) => {
    console.log('🔧 initializeWithIssue called with:', {
      issue: issue ? { id: issue.id, title: issue.title, submissions: issue.submissions } : null,
      submissionsCount: submissions.length
    });

    selectedIssue.value = issue ? { ...issue } : null;
    approvedSubmissions.value = submissions;

    console.log('�� After setting values:', {
      selectedIssueValue: selectedIssue.value,
      approvedSubmissionsCount: approvedSubmissions.value.length
    });

    // Force re-evaluation of computed properties
    await nextTick();

    // Force trigger reactivity by accessing the computed values
    console.log('🔧 Forcing computed re-evaluation:', {
      issueContent: issueContent.value,
      availableContent: availableContent.value
    });

    logger.info('Page layout designer initialized', {
      issueId: issue?.id,
      submissionsCount: submissions.length,
      selectedIssue: selectedIssue.value,
      approvedSubmissions: approvedSubmissions.value
    });
  };

  // Navigation helpers
  const navigateBack = () => {
    void router.push('/admin/newsletters');
  };

  // Content management methods
  const addToIssue = async (submission: ContentDoc) => {
    if (!selectedIssue.value) return;

    try {
      const updatedSubmissions = [...selectedIssue.value.submissions, submission.id];
      selectedIssue.value.submissions = updatedSubmissions;

      await newsletterGenerationService.addSubmissionsToIssue(
        selectedIssue.value.id,
        updatedSubmissions
      );

      $q.notify({
        type: 'positive',
        message: t('notifications.contentAddedToIssue') || 'Content added to issue'
      });

      return true;
    } catch (error) {
      logger.error('Failed to add content to issue:', error);
      $q.notify({
        type: 'negative',
        message: t('notifications.failedToAddContent') || 'Failed to add content to issue'
      });
      return false;
    }
  };

  const removeFromIssue = async (submissionId: string) => {
    if (!selectedIssue.value) return;

    try {
      const updatedSubmissions = selectedIssue.value.submissions.filter(
        (id: string) => id !== submissionId
      );
      selectedIssue.value.submissions = updatedSubmissions;

      await newsletterGenerationService.addSubmissionsToIssue(
        selectedIssue.value.id,
        updatedSubmissions
      );

      $q.notify({
        type: 'positive',
        message: t('notifications.contentRemovedFromIssue') || 'Content removed from issue'
      });

      return true;
    } catch (error) {
      logger.error('Failed to remove content from issue:', error);
      $q.notify({
        type: 'negative',
        message: t('notifications.failedToRemoveContent') || 'Failed to remove content from issue'
      });
      return false;
    }
  };

  // Template management
  const changeTemplate = (templateValue: string) => {
    currentTemplate.value = templateValue;

    // Reset content areas based on template
    switch (templateValue) {
      case 'standard':
        contentAreas.value = [
          { id: 1, contentId: null, size: 'large' },
          { id: 2, contentId: null, size: 'medium' },
          { id: 3, contentId: null, size: 'medium' },
          { id: 4, contentId: null, size: 'small' }
        ];
        break;
      case 'modern':
        contentAreas.value = [
          { id: 1, contentId: null, size: 'full' },
          { id: 2, contentId: null, size: 'large' },
          { id: 3, contentId: null, size: 'large' }
        ];
        break;
      case 'event':
        contentAreas.value = [
          { id: 1, contentId: null, size: 'header' },
          { id: 2, contentId: null, size: 'calendar' },
          { id: 3, contentId: null, size: 'details' }
        ];
        break;
      default:
        break;
    }

    const templateName = templateOptions.find(t => t.value === templateValue)?.label;
    $q.notify({
      type: 'positive',
      message: t('notifications.templateChanged', { templateName }) || `Template changed to ${templateName}`
    });
  };

  // Page management
  const addPage = () => {
    const newPageId = pages.value.length + 1;
    pages.value.push({ id: newPageId, areas: [] });

    $q.notify({
      type: 'positive',
      message: t('notifications.pageAdded', { pageNumber: newPageId }) || `Page ${newPageId} added`
    });
  };

  const removePage = () => {
    if (pages.value.length > 1) {
      const removedPage = pages.value.pop();
      $q.notify({
        type: 'info',
        message: t('notifications.pageRemoved', { pageNumber: removedPage?.id }) || `Page ${removedPage?.id} removed`
      });
    }
  };

  // Layout management
  const removeFromArea = (areaIndex: number) => {
    if (contentAreas.value[areaIndex]) {
      contentAreas.value[areaIndex].contentId = null;
      $q.notify({
        type: 'info',
        message: t('notifications.contentRemovedFromLayoutArea') || 'Content removed from layout area'
      });
    }
  };

  const autoArrangeContent = () => {
    if (!selectedIssue.value) return;

    const submissions = selectedIssue.value.submissions;
    submissions.forEach((submissionId: string, index: number) => {
      if (contentAreas.value[index]) {
        contentAreas.value[index].contentId = submissionId;
      }
    });

    $q.notify({
      type: 'positive',
      message: t('notifications.contentAutoArranged') || 'Content auto-arranged in layout areas'
    });
  };

  const clearAllPages = () => {
    $q.dialog({
      title: t('actions.clearAllPages') || 'Clear All Pages',
      message: t('dialogs.clearAllPagesConfirm') || 'Are you sure you want to clear all content from the layout?',
      cancel: true,
      persistent: true
    }).onOk(() => {
      contentAreas.value.forEach(area => {
        area.contentId = null;
      });

      $q.notify({
        type: 'info',
        message: t('notifications.allPagesCleared') || 'All pages cleared'
      });
    });
  };

  const saveLayout = () => {
    if (!selectedIssue.value) return;

    try {
      const layoutData: LayoutData = {
        template: currentTemplate.value,
        pages: pages.value,
        contentAreas: contentAreas.value.map(area => ({
          id: area.id,
          contentId: area.contentId,
          size: area.size
        }))
      };

      $q.notify({
        type: 'positive',
        message: t('notifications.layoutSaved') || 'Layout saved successfully!'
      });

      logger.info('Layout saved', { issueId: selectedIssue.value.id, layoutData });
      return layoutData;
    } catch (error) {
      logger.error('Failed to save layout:', error);
      $q.notify({
        type: 'negative',
        message: t('notifications.failedToSaveLayout') || 'Failed to save layout'
      });
      return null;
    }
  };

  return {
    // State
    selectedIssue,
    approvedSubmissions,
    currentTemplate,
    pages,
    contentAreas,
    draggedContentId,
    dragOverArea,
    availableContentExpanded,
    contentSearchQuery,
    selectedContentStatus,
    showLayoutPreview,
    isLoading,

    // Options
    templateOptions,
    contentStatusOptions,

    // Computed
    availableContent,
    issueContent,

    // Methods
    initializeWithIssue,
    navigateBack,
    isContentInLayout,
    getContentLayoutInfo,
    getSubmissionTitle,
    getSubmissionIcon,
    getSubmissionPreview,
    addToIssue,
    removeFromIssue,
    changeTemplate,
    addPage,
    removePage,
    removeFromArea,
    autoArrangeContent,
    clearAllPages,
    saveLayout,
    formatDate
  };
});
