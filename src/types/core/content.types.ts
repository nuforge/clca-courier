/**
 * Core Content Types - Consolidated from multiple locations
 * Eliminates duplicate interfaces across models.ts, site-store.ts, etc.
 */

import type { CanvaDesign } from '../../services/canva/types';

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

/**
 * Unified Content Submission System
 * Flexible base structure for all user-generated content
 */

/**
 * Review status for iterative workflow
 */
export type ReviewStatus =
  | 'draft' // Author working
  | 'submitted' // Ready for review
  | 'under_review' // Being reviewed
  | 'needs_revision' // Feedback provided, author revising
  | 'approved' // Ready for publication
  | 'rejected' // Not suitable
  | 'published'; // Live in newsletter

/**
 * Content types for unified submission system
 */
export type ContentType =
  | 'article'
  | 'event'
  | 'project'
  | 'announcement'
  | 'classified'
  | 'photo_story';

/**
 * Review entry for iterative feedback
 */
export interface ReviewEntry {
  id: string;
  reviewerId: string;
  reviewerName: string;
  timestamp: number; // Unix timestamp
  status: ReviewStatus;
  feedback?: string;
  section?: string; // Which part of content (for modular review)
}

/**
 * Content attachment with external hosting preference
 */
export interface ContentAttachment {
  id: string;
  type: 'external_image' | 'external_video' | 'firebase_image' | 'firebase_pdf';

  // External hosting (preferred for cost efficiency)
  externalUrl?: string;
  hostingProvider?: 'google_photos' | 'google_drive' | 'instagram' | 'facebook' | 'other';

  // Firebase storage (fallback)
  filename?: string;
  firebaseUrl?: string;
  thumbnailUrl?: string;

  // Common properties
  caption?: string;
  alt?: string;
  isUserHosted: boolean; // True for external, false for Firebase
}

/**
 * Author information
 */
export interface ContentAuthor {
  uid: string;
  displayName: string;
  email: string;
  avatar?: string;
}

/**
 * Base content item for unified submission system
 * All submissions inherit from this flexible structure
 */
export interface BaseContentItem {
  id: string;
  type: ContentType;
  title: string;
  authorId: string; // For Firestore security rules
  author: ContentAuthor;
  content: string; // Rich text/HTML content
  status: ReviewStatus;

  // Flexible metadata that adapts to content type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;

  // Media attachments with external hosting preference
  attachments: ContentAttachment[];

  // Iterative workflow tracking
  reviewHistory: ReviewEntry[];
  submittedAt: number; // Unix timestamp
  lastReviewedAt?: number;
  publishedAt?: number;

  // Newsletter integration
  targetIssue?: string;
  priority: 'low' | 'medium' | 'high';
  category: string; // User-defined with smart defaults

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Type-specific metadata structures
 */

/**
 * Article metadata (basic content)
 */
export interface ArticleMetadata {
  subtitle?: string;
  readTime?: number; // estimated minutes
  tags?: string[];
}

/**
 * Event metadata (date/time/location specific)
 */
export interface EventMetadata {
  startDate: number; // Unix timestamp
  endDate?: number;
  location: string;
  registrationRequired: boolean;
  contactInfo?: string;
  maxAttendees?: number;
  currentAttendees?: number;

  // Calendar integration fields
  onCalendar?: boolean; // Whether this event should appear on the calendar
  eventTime?: string; // Time in HH:MM format
  eventEndTime?: string; // End time in HH:MM format
  allDay?: boolean; // Whether this is an all-day event
  eventRecurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number; // Every N days/weeks/months/years
    endDate?: string; // When recurrence ends (ISO 8601)
    daysOfWeek?: number[]; // For weekly: 0=Sunday, 1=Monday, etc.
    dayOfMonth?: number; // For monthly: day of month
  };
}

/**
 * Project metadata (progress and involvement)
 */
export interface ProjectMetadata {
  projectStatus: 'planning' | 'in_progress' | 'completed';
  involvedResidents?: string[];
  budget?: number;
  completionDate?: number; // Unix timestamp
  startDate?: number;
  progressPercentage?: number;
}

/**
 * Classified metadata (buying/selling)
 */
export interface ClassifiedMetadata {
  price?: number;
  category: 'for_sale' | 'wanted' | 'services' | 'housing';
  contactMethod: 'email' | 'phone' | 'both';
  expirationDate?: number; // Unix timestamp
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  location?: string;
}

/**
 * Photo story metadata (visual content)
 */
export interface PhotoStoryMetadata {
  photographerName?: string;
  photographyDate?: number; // Unix timestamp
  location?: string;
  cameraInfo?: string;
  story?: string; // Background story about the photos
}

/**
 * Announcement metadata (official communications)
 */
export interface AnnouncementMetadata {
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  expirationDate?: number; // Unix timestamp
  affectedAreas?: string[]; // Lake sections, streets, etc.
  contactPerson?: string;
  actionRequired?: boolean;
}

/**
 * Union type for all metadata types
 */
export type ContentMetadata =
  | ArticleMetadata
  | EventMetadata
  | ProjectMetadata
  | ClassifiedMetadata
  | PhotoStoryMetadata
  | AnnouncementMetadata;

/**
 * Content submission form data interface
 */
export interface ContentSubmissionData {
  type: ContentType;
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  targetIssue?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  attachments: ContentAttachment[];

  // Calendar integration for events
  onCalendar?: boolean;
  eventDate?: string; // ISO 8601 date string
  eventEndDate?: string; // ISO 8601 date string
  eventTime?: string; // HH:MM format
  eventEndTime?: string; // HH:MM format
  eventLocation?: string;
  allDay?: boolean;
  eventRecurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };

  // Canva integration for design creation
  canvaDesign?: CanvaDesign;
}
