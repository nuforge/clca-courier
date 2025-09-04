/**
 * Newsletter Interfaces - Legacy File
 * @deprecated This file is being phased out in favor of centralized types
 * Import newsletter types from src/types/core/newsletter.types.ts instead
 */

// Re-export from centralized types for backward compatibility
export type {
  Newsletter as UnifiedNewsletter,
  NewsletterServiceStats,
  NewsletterServiceConfig,
  NewsletterSearchCriteria,
  NewsletterSortOptions,
  NewsletterSortField,
  NewsletterSortOrder,
  NewsletterProcessingState,
  NewsletterQuality,
} from './core/newsletter.types';

// Note: This file will be removed in a future version
// Please update imports to use: import { Newsletter, NewsletterServiceStats } from '@/types'
