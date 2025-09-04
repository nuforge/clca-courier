// API Service for handling data operations
// This abstraction makes it easy to switch from JSON files to real APIs

import type { NewsItem, ClassifiedAd, Event, CommunityStats } from '../types';

export class ApiService {
  private static instance: ApiService;

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async getNews(): Promise<NewsItem[]> {
    try {
      // In the future, this could be: return await fetch('/api/news').then(r => r.json())
      const response = await import('../data/news.json');
      return response.default as NewsItem[];
    } catch (error) {
      console.error('Failed to load news:', error);
      return [];
    }
  }

  async getClassifieds(): Promise<ClassifiedAd[]> {
    try {
      // In the future, this could be: return await fetch('/api/classifieds').then(r => r.json())
      const response = await import('../data/classifieds.json');
      return response.default as ClassifiedAd[];
    } catch (error) {
      console.error('Failed to load classifieds:', error);
      return [];
    }
  }

  async getEvents(): Promise<Event[]> {
    try {
      // In the future, this could be: return await fetch('/api/events').then(r => r.json())
      const response = await import('../data/events.json');
      return response.default as Event[];
    } catch (error) {
      console.error('Failed to load events:', error);
      return [];
    }
  }

  getCommunityStats(): Promise<CommunityStats> {
    try {
      // In the future, this could be: return await fetch('/api/stats').then(r => r.json())
      return Promise.resolve({
        households: 450,
        lakes: 3,
        yearsPublished: 29,
        issuesPerYear: 12,
      });
    } catch (error) {
      console.error('Failed to load community stats:', error);
      return Promise.resolve({
        households: 0,
        lakes: 0,
        yearsPublished: 0,
        issuesPerYear: 0,
      });
    }
  }

  async getFeaturedNews(): Promise<NewsItem[]> {
    const news = await this.getNews();
    return news.filter((item) => item.featured);
  }

  async getRecentClassifieds(limit: number = 5): Promise<ClassifiedAd[]> {
    const classifieds = await this.getClassifieds();
    return classifieds
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
      .slice(0, limit);
  }

  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const events = await this.getEvents();
    const now = new Date();
    return events
      .filter((event) => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
