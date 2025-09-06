/**
 * Firebase Newsletter Service
 * API-agnostic service for newsletter operations using Firebase backend
 * Following protocols: Firebase-first, dynamic content discovery, no hardcoded data
 */

import { ref, computed, type Ref } from 'vue';
import { firestoreService, type NewsletterMetadata } from './firebase-firestore.service';
import { firebaseStorageService, type FileUploadProgress } from './firebase-storage.service';
import { logger } from '../utils/logger';

export interface NewsletterSearchFilters {
  year?: number;
  season?: string;
  tags?: string[];
  featured?: boolean;
  contentType?: string;
  availability?: 'viewable' | 'downloadable' | 'local-only' | 'cloud-only' | 'multi-source';
  pageCount?: string; // '1-5', '6-10', '11-20', '20+'
  actions?: 'view' | 'download' | 'search' | 'thumbnail';

  // Enhanced filtering options
  dateRange?: {
    start?: string; // ISO date string
    end?: string; // ISO date string
  };

  // Search-specific options
  searchType?: 'exact' | 'fuzzy' | 'phrase';
  sortBy?:
    | 'relevance'
    | 'date-desc'
    | 'date-asc'
    | 'title-asc'
    | 'title-desc'
    | 'pages-desc'
    | 'pages-asc';

  // Accessibility and content options
  hasDescription?: boolean;
  hasThumbnail?: boolean;
  hasSearchableText?: boolean;
}

export interface NewsletterSearchResult {
  newsletters: NewsletterMetadata[];
  totalCount: number;
  searchStats: {
    indexedPdfs: number;
    searchTime: number;
    searchTerms?: string[];
    exactMatches?: number;
    partialMatches?: number;
  };
  suggestions?: string[]; // Search suggestions for better user experience
}

export interface NewsletterServiceStats {
  totalNewsletters: number;
  publishedThisYear: number;
  sourceCounts: {
    firebase: number;
    local: number;
    drive: number;
    hybrid: number;
  };
}

class FirebaseNewsletterService {
  // Reactive state
  private _newsletters: Ref<NewsletterMetadata[]> = ref([]);
  private _loading: Ref<boolean> = ref(false);
  private _error: Ref<string | null> = ref(null);
  private _stats: Ref<NewsletterServiceStats | null> = ref(null);

  // Real-time subscription unsubscribe function
  private unsubscribe: (() => void) | null = null;

  // Public reactive properties
  get newsletters() {
    return computed(() => this._newsletters.value);
  }

  get loading() {
    return computed(() => this._loading.value);
  }

  get error() {
    return computed(() => this._error.value);
  }

  get stats() {
    return computed(() => this._stats.value);
  }

  /**
   * Initialize the service and set up real-time subscription
   */
  async initialize(): Promise<void> {
    try {
      this._loading.value = true;
      this._error.value = null;

      logger.info('Initializing Firebase Newsletter Service...');

      // Set up real-time subscription to newsletters
      this.unsubscribe = firestoreService.subscribeToNewsletters((newsletters) => {
        this._newsletters.value = newsletters;
        this.updateStats();
        logger.success(`Real-time update: ${newsletters.length} newsletters loaded`);
      });

      // Load initial data
      await this.loadNewsletters();
      this.generateStats();

      logger.success('Firebase Newsletter Service initialized successfully');
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : 'Initialization failed';
      logger.error('Failed to initialize Firebase Newsletter Service:', error);
      throw error;
    } finally {
      this._loading.value = false;
    }
  }

  /**
   * Load all newsletters from Firebase Firestore
   */
  async loadNewsletters(): Promise<NewsletterMetadata[]> {
    try {
      this._loading.value = true;
      this._error.value = null;

      const newsletters = await firestoreService.getAllNewsletterMetadata();
      this._newsletters.value = newsletters;

      logger.success(`Loaded ${newsletters.length} newsletters from Firebase`);
      return newsletters;
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : 'Failed to load newsletters';
      logger.error('Error loading newsletters:', error);
      throw error;
    } finally {
      this._loading.value = false;
    }
  }

  /**
   * Admin method: Load all newsletters regardless of publication status
   * This is for admin interfaces where we need to see unpublished content
   */
  async loadAllNewslettersForAdmin(): Promise<NewsletterMetadata[]> {
    try {
      this._loading.value = true;
      this._error.value = null;

      logger.info('Admin: Loading ALL newsletters (including unpublished)...');
      const allNewsletters = await firestoreService.getAllNewslettersForAdmin();

      // Convert to regular format
      const newsletters = allNewsletters;
      this._newsletters.value = newsletters;

      logger.success(`Admin: Loaded ${newsletters.length} total newsletters from Firebase`);
      return newsletters;
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : 'Failed to load newsletters';
      logger.error('Admin: Error loading all newsletters:', error);
      throw error;
    } finally {
      this._loading.value = false;
    }
  }

  /**
   * Search newsletters with enhanced features and accessibility
   */
  async searchNewsletters(
    query: string,
    filters: NewsletterSearchFilters = {},
  ): Promise<NewsletterSearchResult> {
    try {
      const startTime = Date.now();
      let results: NewsletterMetadata[] = [];
      let exactMatches = 0;
      let partialMatches = 0;
      const searchTerms = query
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 0);

      if (query.trim()) {
        // Use Firebase text search with enhanced relevance
        results = await firestoreService.searchNewsletters(query);

        // Count match types for analytics
        results.forEach((newsletter) => {
          const hasExactMatch = searchTerms.some(
            (term) =>
              newsletter.title.toLowerCase().includes(term.toLowerCase()) ||
              newsletter.tags.some((tag) => tag.toLowerCase() === term.toLowerCase()),
          );

          if (hasExactMatch) {
            exactMatches++;
          } else {
            partialMatches++;
          }
        });
      } else {
        // Return all newsletters if no query
        results = this._newsletters.value;
      }

      // Apply client-side filters
      results = this.applyFilters(results, filters);

      // Generate search suggestions for better UX
      const suggestions = this.generateSearchSuggestions(query, results);

      const searchTime = Date.now() - startTime;

      return {
        newsletters: results,
        totalCount: results.length,
        searchStats: {
          indexedPdfs: this._newsletters.value.length,
          searchTime,
          searchTerms,
          exactMatches,
          partialMatches,
        },
        suggestions,
      };
    } catch (error) {
      logger.error('Error searching newsletters:', error);
      throw error;
    }
  }

  /**
   * Generate search suggestions based on available content
   */
  private generateSearchSuggestions(query: string, results: NewsletterMetadata[]): string[] {
    if (!query || results.length === 0) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    // Collect potential suggestions from tags and titles
    this._newsletters.value.forEach((newsletter) => {
      // Suggest similar tags
      newsletter.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(queryLower) && tag.toLowerCase() !== queryLower) {
          suggestions.add(tag);
        }
      });

      // Suggest years if searching for partial year
      if (newsletter.year.toString().includes(query)) {
        suggestions.add(newsletter.year.toString());
      }

      // Suggest seasons
      if (newsletter.season && newsletter.season.toLowerCase().includes(queryLower)) {
        suggestions.add(newsletter.season);
      }
    });

    return Array.from(suggestions).slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Get newsletter by ID
   */
  async getNewsletterById(id: string): Promise<NewsletterMetadata | null> {
    try {
      // First check cache
      const cached = this._newsletters.value.find((n) => n.id === id);
      if (cached) {
        return cached;
      }

      // Fetch from Firebase if not in cache
      return await firestoreService.getNewsletterMetadata(id);
    } catch (error) {
      logger.error('Error getting newsletter by ID:', error);
      throw error;
    }
  }

  /**
   * Get newsletters by year
   */
  getNewslettersByYear(year: number): NewsletterMetadata[] {
    return this._newsletters.value.filter((newsletter) => newsletter.year === year);
  }

  /**
   * Get featured newsletters
   */
  getFeaturedNewsletters(limit = 5): NewsletterMetadata[] {
    return this._newsletters.value.filter((newsletter) => newsletter.featured).slice(0, limit);
  }

  /**
   * Get newsletter years for filter options
   */
  getAvailableYears(): number[] {
    const years = new Set<number>();
    this._newsletters.value.forEach((newsletter) => {
      years.add(newsletter.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }

  /**
   * Get available tags for filter options
   */
  getAvailableTags(): string[] {
    const tags = new Set<string>();
    this._newsletters.value.forEach((newsletter) => {
      newsletter.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Apply client-side filters to newsletters with enhanced filtering
   */
  private applyFilters(
    newsletters: NewsletterMetadata[],
    filters: NewsletterSearchFilters,
  ): NewsletterMetadata[] {
    let filtered = [...newsletters];

    // Year filter
    if (filters.year) {
      filtered = filtered.filter((n) => n.year === filters.year);
    }

    // Season filter
    if (filters.season) {
      filtered = filtered.filter((n) => n.season === filters.season);
    }

    // Tags filter - improved to handle partial matches
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((n) =>
        filters.tags!.some((filterTag) =>
          n.tags.some((newsletterTag) =>
            newsletterTag.toLowerCase().includes(filterTag.toLowerCase()),
          ),
        ),
      );
    }

    // Featured filter
    if (filters.featured !== undefined) {
      filtered = filtered.filter((n) => n.featured === filters.featured);
    }

    // Date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      if (start) {
        filtered = filtered.filter((n) => new Date(n.publicationDate) >= new Date(start));
      }
      if (end) {
        filtered = filtered.filter((n) => new Date(n.publicationDate) <= new Date(end));
      }
    }

    // Content availability filters
    if (filters.hasDescription !== undefined) {
      filtered = filtered.filter((n) => !!n.description === filters.hasDescription);
    }

    if (filters.hasThumbnail !== undefined) {
      filtered = filtered.filter((n) => !!n.thumbnailUrl === filters.hasThumbnail);
    }

    if (filters.hasSearchableText !== undefined) {
      filtered = filtered.filter((n) => !!n.searchableText === filters.hasSearchableText);
    }

    // Page count filter
    if (filters.pageCount) {
      filtered = filtered.filter((n) => {
        const pageCount = n.pageCount || 0;
        switch (filters.pageCount) {
          case '1-5':
            return pageCount >= 1 && pageCount <= 5;
          case '6-10':
            return pageCount >= 6 && pageCount <= 10;
          case '11-20':
            return pageCount >= 11 && pageCount <= 20;
          case '20+':
            return pageCount > 20;
          default:
            return true;
        }
      });
    }

    // Availability filter (Firebase Storage based)
    if (filters.availability) {
      filtered = filtered.filter((n) => {
        const hasDownloadUrl = !!n.downloadUrl;
        const hasStorage = !!n.storageRef;

        switch (filters.availability) {
          case 'viewable':
            return hasDownloadUrl;
          case 'downloadable':
            return hasDownloadUrl;
          case 'cloud-only':
            return hasStorage;
          default:
            return true;
        }
      });
    }

    // Actions filter
    if (filters.actions) {
      filtered = filtered.filter((n) => {
        switch (filters.actions) {
          case 'view':
            return !!n.downloadUrl;
          case 'download':
            return !!n.downloadUrl;
          case 'search':
            return !!n.searchableText;
          case 'thumbnail':
            return !!n.thumbnailUrl;
          default:
            return true;
        }
      });
    }

    // Apply sorting based on sortBy filter
    if (filters.sortBy && filters.sortBy !== 'relevance') {
      filtered = this.sortNewsletters(filtered, filters.sortBy);
    }

    return filtered;
  }

  /**
   * Sort newsletters by specified criteria
   */
  private sortNewsletters(newsletters: NewsletterMetadata[], sortBy: string): NewsletterMetadata[] {
    const [field, direction] = sortBy.split('-');

    return newsletters.sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case 'date': {
          const dateA = new Date(a.publicationDate);
          const dateB = new Date(b.publicationDate);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        }
        case 'title':
          comparison = a.title.localeCompare(b.title, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
          break;
        case 'pages':
          comparison = (a.pageCount || 0) - (b.pageCount || 0);
          break;
        default:
          comparison = 0;
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Generate service statistics
   */
  private generateStats(): void {
    try {
      const newsletters = this._newsletters.value;
      const currentYear = new Date().getFullYear();

      this._stats.value = {
        totalNewsletters: newsletters.length,
        publishedThisYear: newsletters.filter((n) => n.year === currentYear).length,
        sourceCounts: {
          firebase: newsletters.filter((n) => !!n.storageRef).length,
          local: 0, // No local files in Firebase-first architecture
          drive: 0, // Legacy support can be added if needed
          hybrid: 0,
        },
      };
    } catch (error) {
      logger.error('Error generating stats:', error);
    }
  }

  /**
   * Update stats when newsletters change
   */
  private updateStats(): void {
    this.generateStats();
  }

  /**
   * Clean up subscriptions
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Upload new newsletter (admin function)
   */
  async uploadNewsletter(
    file: File,
    metadata: {
      title: string;
      issueNumber?: string;
      publicationDate: string;
      year: number;
      season?: 'spring' | 'summer' | 'fall' | 'winter';
      tags?: string[];
      featured?: boolean;
    },
    onProgress?: (progress: FileUploadProgress) => void,
  ): Promise<string> {
    try {
      // Upload to Firebase Storage
      const uploadResult = await firebaseStorageService.uploadNewsletterPdf(
        file,
        metadata,
        onProgress,
      );

      // Save metadata to Firestore
      const newsletterMetadata: Omit<NewsletterMetadata, 'id'> = {
        filename: file.name,
        title: metadata.title,
        description: '',
        publicationDate: metadata.publicationDate,
        year: metadata.year,
        fileSize: file.size,
        pageCount: 0, // Will be updated by processing
        downloadUrl: uploadResult.downloadUrl,
        storageRef: uploadResult.storagePath,
        tags: metadata.tags || [],
        featured: metadata.featured || false,
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: '', // Will be set by service
        updatedBy: '', // Will be set by service
        actions: {
          canView: true,
          canDownload: true,
          canSearch: false,
          hasThumbnail: false,
        },
      };

      // Add optional fields only if they exist
      if (metadata.issueNumber) {
        newsletterMetadata.issueNumber = metadata.issueNumber;
      }
      if (metadata.season) {
        newsletterMetadata.season = metadata.season;
      }

      const newsletterId = await firestoreService.saveNewsletterMetadata(newsletterMetadata);

      logger.success('Newsletter uploaded successfully:', newsletterId);
      return newsletterId;
    } catch (error) {
      logger.error('Error uploading newsletter:', error);
      throw error;
    }
  }

  /**
   * Delete newsletter (admin function)
   */
  async deleteNewsletter(id: string): Promise<void> {
    try {
      const newsletter = await this.getNewsletterById(id);
      if (!newsletter) {
        throw new Error('Newsletter not found');
      }

      // Delete from Firebase Storage if storage reference exists
      if (newsletter.storageRef) {
        try {
          await firebaseStorageService.deleteFile(newsletter.storageRef);
          logger.success('Newsletter PDF deleted from Firebase Storage:', newsletter.storageRef);
        } catch (storageError) {
          logger.warn('Could not delete PDF from storage (may not exist):', storageError);
        }
      }

      // Delete from Firestore
      await firestoreService.deleteNewsletterMetadata(id);

      // Remove from local cache
      const index = this._newsletters.value.findIndex((n) => n.id === id);
      if (index > -1) {
        this._newsletters.value.splice(index, 1);
      }

      logger.success('Newsletter deleted successfully:', id);
    } catch (error) {
      logger.error('Error deleting newsletter:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseNewsletterService = new FirebaseNewsletterService();
export default firebaseNewsletterService;
