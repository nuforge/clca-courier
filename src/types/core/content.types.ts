/**
 * Core Content Types - Consolidated from multiple locations
 * Eliminates duplicate interfaces across models.ts, site-store.ts, etc.
 */

/**
 * News item interface - consolidated from models.ts and site-store.ts
 * Standardized with optional featured property and consistent category union
 */
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
  category: 'news' | 'announcement' | 'event';
  featured?: boolean;
}

/**
 * Classified ad interface - consolidated from models.ts and site-store.ts
 * Unified as ClassifiedAd with optional contact fields and consistent categories
 */
export interface ClassifiedAd {
  id: string;
  title: string;
  description: string;
  price?: string;
  category: 'for-sale' | 'services' | 'wanted' | 'free';
  contact: {
    name: string;
    email?: string;
    phone?: string;
  };
  datePosted: string;
  featured?: boolean;
}

/**
 * Event interface - consolidated from models.ts and site-store.ts
 * Standardized with optional location and organizer fields
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  organizer?: string;
}

/**
 * Community statistics interface - consolidated from site-store.ts and data-service.ts
 */
export interface CommunityStats {
  households: number;
  lakes: number;
  yearsPublished: number;
  issuesPerYear: number;
}

/**
 * Generic todo interface - preserved from models.ts
 */
export interface Todo {
  id: number;
  content: string;
}

/**
 * Generic meta interface for API responses
 */
export interface Meta {
  totalCount: number;
}

/**
 * Content category union type for filtering and organization
 */
export type ContentCategory = 'news' | 'announcement' | 'event' | 'classified' | 'newsletter';

/**
 * Content status for content management workflows
 */
export type ContentStatus = 'draft' | 'published' | 'archived' | 'featured';
