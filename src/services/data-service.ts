// Data service to simulate API calls by loading local JSON files
// This service is specifically for the site-store-simple.ts
import type { NewsItem, Classified, Event } from '../components/models';

// Import JSON data - NO ISSUES.JSON REFERENCE
import newsData from '../data/news.json';
import classifiedsData from '../data/classifieds.json';
import eventsData from '../data/events.json';
import communityStatsData from '../data/community-stats.json';

export interface CommunityStats {
  households: number;
  lakes: number;
  yearsPublished: number;
  issuesPerYear: number;
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const dataService = {
  // Simulate fetching news items from API
  async getNewsItems(): Promise<NewsItem[]> {
    await delay(100); // Simulate network delay
    return newsData as NewsItem[];
  },

  // Simulate fetching classifieds from API
  async getClassifieds(): Promise<Classified[]> {
    await delay(100);
    return classifiedsData as Classified[];
  },

  // Simulate fetching events from API
  async getEvents(): Promise<Event[]> {
    await delay(100);
    return eventsData as Event[];
  },

  // REMOVED: getArchivedIssues - NO ISSUES.JSON REFERENCES ALLOWED

  // Simulate fetching community stats from API
  async getCommunityStats(): Promise<CommunityStats> {
    await delay(100);
    return communityStatsData as CommunityStats;
  },
};
