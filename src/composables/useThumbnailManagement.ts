/**
 * Thumbnail Management Composable
 *
 * Integrates enhanced thumbnail generation with content management workflow.
 * Provides reactive state management and progress tracking for thumbnail operations.
 */
import { ref, reactive } from 'vue';
import { Notify } from 'quasar';
import type { ContentManagementNewsletter } from 'src/types/core/content-management.types';
import { EnhancedThumbnailService } from 'src/services/enhanced-thumbnail.service';

export interface ThumbnailProgress {
  current: number;
  total: number;
  currentFile: string;
  isComplete: boolean;
}

export function useThumbnailManagement() {
  // Services
  const thumbnailService = new EnhancedThumbnailService();

  // Reactive state
  const isGenerating = ref(false);
  const generateProgress = reactive<ThumbnailProgress>({
    current: 0,
    total: 0,
    currentFile: '',
    isComplete: false,
  });

  // Individual thumbnail states
  const individualStates = reactive<Record<string, boolean>>({});

  /**
   * Generate thumbnail for a single newsletter with reactive UI update
   */
  const generateSingleThumbnail = async (
    newsletter: ContentManagementNewsletter,
    onThumbnailGenerated?: (thumbnailUrl: string) => void,
    forceRegenerate = false,
  ): Promise<boolean> => {
    const id = newsletter.id || newsletter.filename;
    individualStates[id] = true;

    try {
      console.log(
        `🖼️ ${forceRegenerate ? 'Regenerating' : 'Generating'} thumbnail for:`,
        newsletter.title,
      );

      // Choose between generate and regenerate based on forceRegenerate parameter
      const thumbnailUrl = forceRegenerate
        ? await thumbnailService.regenerateNewsletterThumbnailForUI(newsletter)
        : await thumbnailService.generateNewsletterThumbnailForUI(newsletter);

      if (thumbnailUrl) {
        // Immediately update the UI via callback
        onThumbnailGenerated?.(thumbnailUrl);

        Notify.create({
          type: 'positive',
          message: `Thumbnail ${forceRegenerate ? 'regenerated' : 'generated'} for "${newsletter.title}"`,
          timeout: 2000,
          position: 'top',
        });
        return true;
      } else {
        throw new Error(`Failed to ${forceRegenerate ? 'regenerate' : 'generate'} thumbnail`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to ${forceRegenerate ? 'regenerate' : 'generate'} thumbnail:`,
        error,
      );
      Notify.create({
        type: 'negative',
        message: `Failed to ${forceRegenerate ? 'regenerate' : 'generate'} thumbnail for "${newsletter.title}"`,
        timeout: 3000,
        position: 'top',
      });
      return false;
    } finally {
      individualStates[id] = false;
    }
  };

  /**
   * Generate thumbnails for multiple newsletters with progress tracking and reactive updates
   */
  const generateBatchThumbnails = async (
    newsletters: ContentManagementNewsletter[],
    onThumbnailGenerated?: (newsletter: ContentManagementNewsletter, thumbnailUrl: string) => void,
  ): Promise<void> => {
    if (newsletters.length === 0) {
      Notify.create({
        type: 'warning',
        message: 'No newsletters selected for thumbnail generation',
        timeout: 2000,
        position: 'top',
      });
      return;
    }

    isGenerating.value = true;
    generateProgress.current = 0;
    generateProgress.total = newsletters.length;
    generateProgress.isComplete = false;

    try {
      console.log('🖼️ Starting batch thumbnail generation for', newsletters.length, 'newsletters');

      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < newsletters.length; i++) {
        const newsletter = newsletters[i];
        if (!newsletter) {
          console.warn('⚠️ Newsletter at index', i, 'is undefined, skipping...');
          failureCount++;
          continue;
        }

        generateProgress.current = i + 1;
        generateProgress.currentFile = newsletter.title || '';

        try {
          // Use UI-optimized method for immediate updates
          const thumbnailUrl = await thumbnailService.generateNewsletterThumbnailForUI(newsletter);

          if (thumbnailUrl) {
            // Immediately update the UI for this newsletter
            onThumbnailGenerated?.(newsletter, thumbnailUrl);
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          console.error(
            '❌ Failed to generate thumbnail for:',
            newsletter.title || 'unknown',
            error,
          );
          failureCount++;
        }

        // Small delay to prevent overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log('✅ Batch thumbnail generation complete:', { successCount, failureCount });

      if (successCount > 0) {
        Notify.create({
          type: 'positive',
          message: `Generated ${successCount} thumbnails successfully${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
          timeout: 4000,
          position: 'top',
        });
      }

      if (failureCount > 0) {
        Notify.create({
          type: 'warning',
          message: `${failureCount} thumbnails failed to generate`,
          timeout: 3000,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('❌ Batch thumbnail generation failed:', error);
      Notify.create({
        type: 'negative',
        message: 'Failed to generate thumbnails',
        timeout: 3000,
        position: 'top',
      });
    } finally {
      isGenerating.value = false;
      generateProgress.isComplete = true;
    }
  };

  /**
   * Check if newsletter has cached thumbnail
   */
  const hasCachedThumbnail = async (newsletter: ContentManagementNewsletter): Promise<boolean> => {
    return await thumbnailService.hasCachedThumbnail(newsletter.filename);
  };

  /**
   * Get cached thumbnail with fallback generation
   */
  const getThumbnailWithFallback = async (
    newsletter: ContentManagementNewsletter,
  ): Promise<string | null> => {
    return await thumbnailService.getThumbnailWithFallback(newsletter);
  };

  /**
   * Get newsletters that need thumbnails
   */
  const getNewslettersNeedingThumbnails = async (
    newsletters: ContentManagementNewsletter[],
  ): Promise<ContentManagementNewsletter[]> => {
    const needingThumbnails: ContentManagementNewsletter[] = [];

    for (const newsletter of newsletters) {
      const hasCached = await hasCachedThumbnail(newsletter);
      if (!hasCached) {
        needingThumbnails.push(newsletter);
      }
    }

    return needingThumbnails;
  };

  /**
   * Generate missing thumbnails for provided newsletters
   */
  const generateMissingThumbnails = async (
    newsletters: ContentManagementNewsletter[],
  ): Promise<void> => {
    const missingThumbnails = await getNewslettersNeedingThumbnails(newsletters);

    if (missingThumbnails.length === 0) {
      Notify.create({
        type: 'info',
        message: 'All selected newsletters already have thumbnails',
        timeout: 2000,
        position: 'top',
      });
      return;
    }

    console.log(`📋 Found ${missingThumbnails.length} newsletters missing thumbnails`);
    await generateBatchThumbnails(missingThumbnails);
  };

  /**
   * Cleanup old thumbnails to free storage space
   */
  const cleanupOldThumbnails = async (): Promise<void> => {
    try {
      await thumbnailService.cleanupOldThumbnails();
      Notify.create({
        type: 'positive',
        message: 'Cleaned up old thumbnail caches',
        timeout: 2000,
        position: 'top',
      });
    } catch (error) {
      console.error('❌ Failed to cleanup thumbnails:', error);
      Notify.create({
        type: 'negative',
        message: 'Failed to cleanup old thumbnails',
        timeout: 3000,
        position: 'top',
      });
    }
  };

  return {
    // State
    isGenerating,
    generateProgress,
    individualStates,

    // Actions
    generateSingleThumbnail,
    generateBatchThumbnails,
    generateMissingThumbnails,
    hasCachedThumbnail,
    getThumbnailWithFallback,
    getNewslettersNeedingThumbnails,
    cleanupOldThumbnails,
  };
}
