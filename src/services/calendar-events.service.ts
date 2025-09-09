/**
 * Calendar Events Service
 * Manages calendar-specific operations for UserContent marked as onCalendar
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { logger } from '../utils/logger';
import type { UserContent } from './firebase-firestore.service';

export interface CalendarEvent {
  id: string;
  title: string;
  content: string;
  type: UserContent['type'];
  eventDate: string; // ISO 8601 date string
  eventEndDate?: string;
  eventTime?: string;
  eventEndTime?: string;
  eventLocation?: string;
  allDay: boolean;
  featured: boolean;
  tags: string[];
  authorName: string;
  authorEmail: string;
  eventRecurrence?: UserContent['eventRecurrence'];
}

export interface CalendarEventFilters {
  startDate?: string; // ISO 8601 date
  endDate?: string; // ISO 8601 date
  types?: UserContent['type'][];
  featured?: boolean;
  tags?: string[];
}

class CalendarEventsService {
  private readonly COLLECTION = 'userContent';

  /**
   * Get calendar events for a specific date range
   */
  async getCalendarEvents(filters: CalendarEventFilters = {}): Promise<CalendarEvent[]> {
    try {
      logger.info('Fetching calendar events', { filters });

      let q = query(
        collection(firestore, this.COLLECTION),
        where('status', '==', 'published'),
        where('onCalendar', '==', true)
      );

      // Add date range filtering if provided
      if (filters.startDate) {
        q = query(q, where('eventDate', '>=', filters.startDate));
      }
      if (filters.endDate) {
        q = query(q, where('eventDate', '<=', filters.endDate));
      }

      // Add type filtering if provided
      if (filters.types && filters.types.length > 0) {
        q = query(q, where('type', 'in', filters.types));
      }

      // Order by event date
      q = query(q, orderBy('eventDate', 'asc'));

      const querySnapshot = await getDocs(q);
      const events: CalendarEvent[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as UserContent;

        // Only include events with valid eventDate
        if (data.eventDate) {
          const event: CalendarEvent = {
            id: doc.id,
            title: data.title,
            content: data.content,
            type: data.type,
            eventDate: data.eventDate,
            allDay: data.allDay || false,
            featured: data.featured || false,
            tags: data.tags || [],
            authorName: data.authorName,
            authorEmail: data.authorEmail,
          };

          // Only add optional properties if they exist
          if (data.eventEndDate) {
            event.eventEndDate = data.eventEndDate;
          }
          if (data.eventTime) {
            event.eventTime = data.eventTime;
          }
          if (data.eventEndTime) {
            event.eventEndTime = data.eventEndTime;
          }
          if (data.eventLocation) {
            event.eventLocation = data.eventLocation;
          }
          if (data.eventRecurrence) {
            event.eventRecurrence = data.eventRecurrence;
          }

          // Apply client-side filtering for features not supported by Firestore
          if (filters.featured !== undefined && event.featured !== filters.featured) {
            return;
          }

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
        }
      });

      logger.success(`Loaded ${events.length} calendar events`);
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
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0] ?? '';
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] ?? '';

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
      let q = query(
        collection(firestore, this.COLLECTION),
        where('status', '==', 'published'),
        where('onCalendar', '==', true)
      );

      // Add date range filtering if provided
      if (filters.startDate) {
        q = query(q, where('eventDate', '>=', filters.startDate));
      }
      if (filters.endDate) {
        q = query(q, where('eventDate', '<=', filters.endDate));
      }

      // Add type filtering if provided
      if (filters.types && filters.types.length > 0) {
        q = query(q, where('type', 'in', filters.types));
      }

      // Order by event date
      q = query(q, orderBy('eventDate', 'asc'));

      return onSnapshot(q, (querySnapshot) => {
        const events: CalendarEvent[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data() as UserContent;

          // Only include events with valid eventDate
          if (data.eventDate) {
            const event: CalendarEvent = {
              id: doc.id,
              title: data.title,
              content: data.content,
              type: data.type,
              eventDate: data.eventDate,
              allDay: data.allDay || false,
              featured: data.featured || false,
              tags: data.tags || [],
              authorName: data.authorName,
              authorEmail: data.authorEmail,
            };

            // Only add optional properties if they exist
            if (data.eventEndDate) {
              event.eventEndDate = data.eventEndDate;
            }
            if (data.eventTime) {
              event.eventTime = data.eventTime;
            }
            if (data.eventEndTime) {
              event.eventEndTime = data.eventEndTime;
            }
            if (data.eventLocation) {
              event.eventLocation = data.eventLocation;
            }
            if (data.eventRecurrence) {
              event.eventRecurrence = data.eventRecurrence;
            }

            // Apply client-side filtering
            if (filters.featured !== undefined && event.featured !== filters.featured) {
              return;
            }

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
          }
        });

        callback(events);
      });
    } catch (error) {
      logger.error('Failed to subscribe to calendar events', { error, filters });
      throw error;
    }
  }

  /**
   * Generate recurring events for display (client-side calculation)
   */
  generateRecurringEvents(
    baseEvent: CalendarEvent,
    startDate: Date,
    endDate: Date
  ): CalendarEvent[] {
    if (!baseEvent.eventRecurrence || baseEvent.eventRecurrence.type === 'none') {
      return [baseEvent];
    }

    const events: CalendarEvent[] = [];
    const recurrence = baseEvent.eventRecurrence;
    const eventStart = new Date(baseEvent.eventDate);

    let currentDate = new Date(Math.max(eventStart.getTime(), startDate.getTime()));
    const recurEndDate = recurrence.endDate ? new Date(recurrence.endDate) : endDate;

    while (currentDate <= endDate && currentDate <= recurEndDate) {
      // Create event instance for this occurrence
      const eventInstance: CalendarEvent = {
        id: `${baseEvent.id}_${currentDate.toISOString().split('T')[0] ?? ''}`,
        title: baseEvent.title,
        content: baseEvent.content,
        type: baseEvent.type,
        eventDate: currentDate.toISOString().split('T')[0] ?? '',
        allDay: baseEvent.allDay,
        featured: baseEvent.featured,
        tags: baseEvent.tags,
        authorName: baseEvent.authorName,
        authorEmail: baseEvent.authorEmail,
      };

      // Copy optional properties if they exist
      if (baseEvent.eventTime !== undefined) {
        eventInstance.eventTime = baseEvent.eventTime;
      }
      if (baseEvent.eventEndTime !== undefined) {
        eventInstance.eventEndTime = baseEvent.eventEndTime;
      }
      if (baseEvent.eventLocation !== undefined) {
        eventInstance.eventLocation = baseEvent.eventLocation;
      }
      if (baseEvent.eventRecurrence !== undefined) {
        eventInstance.eventRecurrence = baseEvent.eventRecurrence;
      }

      // Calculate end date if original event has one
      if (baseEvent.eventEndDate !== undefined) {
        const originalDuration = new Date(baseEvent.eventEndDate).getTime() - eventStart.getTime();
        const newEndDate = new Date(currentDate.getTime() + originalDuration);
        eventInstance.eventEndDate = newEndDate.toISOString().split('T')[0] ?? '';
      }

      events.push(eventInstance);

      // Calculate next occurrence
      switch (recurrence.type) {
        case 'daily':
          currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000 * (recurrence.interval || 1)));
          break;
        case 'weekly':
          currentDate = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000 * (recurrence.interval || 1)));
          break;
        case 'monthly': {
          const newMonth = new Date(currentDate);
          newMonth.setMonth(newMonth.getMonth() + (recurrence.interval || 1));
          currentDate = newMonth;
          break;
        }
        case 'yearly': {
          const newYear = new Date(currentDate);
          newYear.setFullYear(newYear.getFullYear() + (recurrence.interval || 1));
          currentDate = newYear;
          break;
        }
        default:
          break;
      }
    }

    return events;
  }

  /**
   * Format event time for display
   */
  formatEventTime(event: CalendarEvent): string {
    if (event.allDay) {
      return 'All Day';
    }

    if (!event.eventTime) {
      return '';
    }

    let timeStr = event.eventTime;
    if (event.eventEndTime) {
      timeStr += ` - ${event.eventEndTime}`;
    }

    return timeStr;
  }

  /**
   * Get event type icon
   */
  getEventTypeIcon(type: UserContent['type']): string {
    switch (type) {
      case 'event':
        return 'mdi-calendar-star';
      case 'announcement':
        return 'mdi-bullhorn';
      case 'article':
        return 'mdi-newspaper';
      case 'classified':
        return 'mdi-store';
      case 'photo':
        return 'mdi-camera';
      default:
        return 'mdi-calendar';
    }
  }

  /**
   * Get event type color
   */
  getEventTypeColor(type: UserContent['type']): string {
    switch (type) {
      case 'event':
        return 'primary';
      case 'announcement':
        return 'warning';
      case 'article':
        return 'info';
      case 'classified':
        return 'secondary';
      case 'photo':
        return 'positive';
      default:
        return 'grey-6';
    }
  }
}

export const calendarEventsService = new CalendarEventsService();
