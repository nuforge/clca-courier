/**
 * Calendar Content Service - New Architecture
 * Integrates calendar functionality with the unified ContentDoc system
 *
 * This service replaces the legacy calendar-events.service.ts and integrates
 * with the new composable content architecture using ContentDoc and features.
 */

import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { logger } from '../utils/logger';
import {
  normalizeDate,
  formatEventDateTime,
  toISODateString,
  sortByDateAsc
} from '../utils/date-formatter';
import type { ContentDoc } from '../types/core/content.types';
import { contentUtils } from '../types/core/content.types';

/**
 * Calendar Event interface for the new architecture
 * Represents a ContentDoc with date features for calendar display
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorEmail?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived' | 'rejected' | 'deleted';

  // Date feature data
  eventDate: string; // ISO 8601 date string
  eventEndDate?: string;
  eventTime?: string;
  eventEndTime?: string;
  allDay: boolean;

  // Location feature data (if present)
  eventLocation?: string;

  // Additional features
  featured: boolean;
  eventRecurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
}

/**
 * Calendar event filters for the new architecture
 */
export interface CalendarEventFilters {
  startDate?: string; // ISO 8601 date
  endDate?: string; // ISO 8601 date
  contentTypes?: string[]; // Filter by content-type tags
  featured?: boolean;
  tags?: string[];
  status?: ('draft' | 'published' | 'archived' | 'rejected' | 'deleted')[];
}

class CalendarContentService {
  private readonly COLLECTION = 'content';

  /**
   * Convert ContentDoc with date feature to CalendarEvent
   */
  private convertContentDocToCalendarEvent(doc: ContentDoc): CalendarEvent | null {
    // Must have date feature to be a calendar event
    if (!contentUtils.hasFeature(doc, 'feat:date')) {
      return null;
    }

    const dateFeature = doc.features['feat:date'];
    const startDate = normalizeDate(dateFeature.start);
    const endDate = dateFeature.end ? normalizeDate(dateFeature.end) : null;

    if (!startDate) {
      logger.warn('Invalid start date in ContentDoc:', { id: doc.id, title: doc.title });
      return null;
    }

    const event: CalendarEvent = {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      authorName: doc.authorName,
      tags: doc.tags,
      status: doc.status,
      eventDate: toISODateString(startDate) ?? '',
      allDay: dateFeature.isAllDay,
      featured: doc.tags.includes('featured:true'),
    };

    // Add end date if present
    if (endDate) {
      const endDateStr = toISODateString(endDate);
      if (endDateStr) {
        event.eventEndDate = endDateStr;
      }
    }

    // Add location feature if present
    if (contentUtils.hasFeature(doc, 'feat:location')) {
      const locationFeature = doc.features['feat:location'];
      event.eventLocation = locationFeature.name || locationFeature.address;
    }

    // Extract time information from timestamps if not all-day
    if (!dateFeature.isAllDay) {
      const startTime = startDate.toTimeString().slice(0, 5); // HH:MM format
      event.eventTime = startTime;

      if (endDate) {
        const endTime = endDate.toTimeString().slice(0, 5);
        event.eventEndTime = endTime;
      }
    }

    return event;
  }

  /**
   * Check if a date string falls within the given range
   */
  private isDateInRange(dateStr: string, startDate?: string, endDate?: string): boolean {
    if (!startDate && !endDate) return true;
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;
    return true;
  }

  /**
   * Get calendar events using the new ContentDoc architecture
   */
  async getCalendarEvents(filters: CalendarEventFilters = {}): Promise<CalendarEvent[]> {
    try {
      logger.info('Fetching calendar events from ContentDoc collection', { filters });

      // Build query for content with date features
      const q = query(
        collection(firestore, this.COLLECTION),
        where('status', 'in', filters.status || ['published']),
        orderBy('timestamps.created', 'desc')
      );

      logger.debug('Calendar events query filters:', {
        status: filters.status || ['published'],
        ...filters
      });

      const querySnapshot = await getDocs(q);
      const events: CalendarEvent[] = [];

      logger.debug(`Found ${querySnapshot.docs.length} potential content documents`);

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as ContentDoc;

        logger.debug('Processing ContentDoc:', {
          id: docSnapshot.id,
          title: data.title,
          status: data.status,
          hasDateFeature: contentUtils.hasFeature(data, 'feat:date'),
          tags: data.tags
        });

        // Convert to calendar event
        const event = this.convertContentDocToCalendarEvent(data);
        if (!event) {
          return; // Skip if not a valid calendar event
        }

        // Apply client-side filtering
        if (!this.isDateInRange(event.eventDate, filters.startDate, filters.endDate)) {
          logger.debug('Event filtered out by date range:', {
            id: event.id,
            title: event.title,
            eventDate: event.eventDate,
            startDate: filters.startDate,
            endDate: filters.endDate
          });
          return;
        }

        // Filter by content types (from tags)
        if (filters.contentTypes && filters.contentTypes.length > 0) {
          const contentType = contentUtils.getContentType(data);
          if (!contentType || !filters.contentTypes.includes(contentType)) {
            return;
          }
        }

        // Filter by featured status
        if (filters.featured !== undefined && event.featured !== filters.featured) {
          return;
        }

        // Filter by additional tags
        if (filters.tags && filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some(tag =>
            event.tags.some(eventTag =>
              eventTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
          if (!hasMatchingTag) {
            return;
          }
        }

        events.push(event);
      });

      // Sort events by date
      events.sort((a, b) => sortByDateAsc(a.eventDate, b.eventDate));

      logger.success(`Loaded ${events.length} calendar events from ContentDoc collection`);
      return events;
    } catch (error) {
      logger.error('Failed to fetch calendar events', { error, filters });
      throw error;
    }
  }

  /**
   * Get events for a specific month
   */
  async getEventsForMonth(year: number, month: number): Promise<CalendarEvent[]> {
    // Use timezone-safe date creation for month boundaries
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDate = firstDay.toISOString().split('T')[0] ?? '';
    const endDate = lastDay.toISOString().split('T')[0] ?? '';

    logger.debug(`🗓️ getEventsForMonth called for ${month}/${year}:`);
    logger.debug(`🗓️ Calculated date range: ${startDate} to ${endDate}`);

    return this.getCalendarEvents({
      startDate: startDate,
      endDate: endDate,
    });
  }

  /**
   * Get events for a specific date
   */
  async getEventsForDate(date: string): Promise<CalendarEvent[]> {
    return this.getCalendarEvents({
      startDate: date,
      endDate: date,
    });
  }

  /**
   * Subscribe to real-time calendar events updates
   */
  subscribeToCalendarEvents(
    filters: CalendarEventFilters = {},
    callback: (events: CalendarEvent[]) => void
  ): Unsubscribe {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where('status', 'in', filters.status || ['published']),
        orderBy('timestamps.created', 'desc')
      );

      return onSnapshot(q, (querySnapshot) => {
        const events: CalendarEvent[] = [];

        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data() as ContentDoc;

          // Convert to calendar event
          const event = this.convertContentDocToCalendarEvent(data);
          if (!event) {
            return; // Skip if not a valid calendar event
          }

          // Apply client-side filtering
          if (!this.isDateInRange(event.eventDate, filters.startDate, filters.endDate)) {
            return;
          }

          // Filter by content types
          if (filters.contentTypes && filters.contentTypes.length > 0) {
            const contentType = contentUtils.getContentType(data);
            if (!contentType || !filters.contentTypes.includes(contentType)) {
              return;
            }
          }

          // Filter by featured status
          if (filters.featured !== undefined && event.featured !== filters.featured) {
            return;
          }

          // Filter by additional tags
          if (filters.tags && filters.tags.length > 0) {
            const hasMatchingTag = filters.tags.some(tag =>
              event.tags.some(eventTag =>
                eventTag.toLowerCase().includes(tag.toLowerCase())
              )
            );
            if (!hasMatchingTag) {
              return;
            }
          }

          events.push(event);
        });

        // Sort events by date
        events.sort((a, b) => sortByDateAsc(a.eventDate, b.eventDate));

        callback(events);
      });
    } catch (error) {
      logger.error('Failed to subscribe to calendar events', { error, filters });
      throw error;
    }
  }

  /**
   * Format event time for display using centralized date formatting
   */
  formatEventTime(event: CalendarEvent): string {
    return formatEventDateTime(
      event.eventDate,
      event.eventTime,
      event.eventEndTime,
      event.allDay
    );
  }

  /**
   * Get event type icon based on content-type tag
   */
  getEventTypeIcon(contentType: string): string {
    switch (contentType) {
      case 'event':
        return 'mdi-calendar-star';
      case 'announcement':
        return 'mdi-bullhorn';
      case 'article':
        return 'mdi-newspaper-variant';
      case 'classified':
        return 'mdi-tag';
      case 'photo':
        return 'mdi-camera';
      default:
        return 'mdi-calendar';
    }
  }

  /**
   * Get event type color based on content-type tag
   */
  getEventTypeColor(contentType: string): string {
    switch (contentType) {
      case 'event':
        return 'primary';
      case 'announcement':
        return 'positive';
      case 'article':
        return 'info';
      case 'classified':
        return 'warning';
      case 'photo':
        return 'secondary';
      default:
        return 'grey-6';
    }
  }

  /**
   * Extract content type from event tags
   */
  getEventContentType(event: CalendarEvent): string | undefined {
    return contentUtils.getContentType({ tags: event.tags } as ContentDoc);
  }
}

export const calendarContentService = new CalendarContentService();
