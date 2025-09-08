/**
 * Firebase Newsletter Service
 * API-agnostic service for newsletter operations using Firebase backend
 * Following protocols: Firebase-first, dynamic content discovery, no hardcoded data
 */

import { ref, computed, type Ref } from 'vue';
import {
  firestoreService,
  deleteField,
  type NewsletterMetadata,
} from './firebase-firestore.service';
import { firebaseStorageService, type FileUploadProgress } from './firebase-storage.service';
import { firebaseAuthService } from './firebase-auth.service';
import { dateManagementService } from './date-management.service';
import { generatePdfThumbnail } from '../utils/pdfThumbnailGenerator';
import { logger } from '../utils/logger';

export interface NewsletterSearchFilters {
  year?: number;
  month?: number; // 1-12 for January-December
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

    // Month filter (simple month matching only - exclude season-only newsletters)
    if (filters.month) {
      filtered = filtered.filter((n) => {
        // Only match newsletters that have a real publication date AND no season
        if (n.publicationDate && !n.season) {
          const newsletterMonth = new Date(n.publicationDate).getMonth() + 1;
          return newsletterMonth === filters.month;
        }
        return false;
      });
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
      if (filters.featured) {
        // Show only featured newsletters
        filtered = filtered.filter((n) => n.featured === true);
      } else {
        // Show all newsletters (both non-featured and those without featured property)
        filtered = filtered.filter((n) => !n.featured);
      }
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
      logger.info(`Starting upload process for: ${file.name}`);

      // Step 1: Extract enhanced date metadata from filename
      const enhancedDate = dateManagementService.parseFilenameDate(file.name);
      logger.debug('Enhanced date metadata:', enhancedDate);

      // Step 2: Process PDF to extract page count and text content
      let pdfProcessingResult: { pageCount: number; textContent?: string; wordCount?: number } = {
        pageCount: 0,
      };

      try {
        // Import PDF processor dynamically to avoid issues
        const { processPdfFile } = await import('../utils/pdfProcessor');
        pdfProcessingResult = await processPdfFile(file);
        logger.debug('PDF processing result:', {
          pageCount: pdfProcessingResult.pageCount,
          wordCount: pdfProcessingResult.wordCount,
          hasText: !!pdfProcessingResult.textContent,
        });
      } catch (processingError) {
        logger.warn('PDF processing failed, continuing with upload:', processingError);
      }

      // Step 3: Generate thumbnail from PDF
      let thumbnailUrl: string | undefined;
      try {
        logger.debug('Generating thumbnail for PDF...');
        const thumbnailResult = await generatePdfThumbnail(file, {
          maxWidth: 300,
          maxHeight: 400,
          quality: 0.8,
          format: 'jpeg',
        });
        thumbnailUrl = thumbnailResult.thumbnailUrl;
        logger.success(
          `Thumbnail generated: ${thumbnailResult.width}x${thumbnailResult.height} (${thumbnailResult.size} bytes)`,
        );
      } catch (thumbnailError) {
        logger.warn('Thumbnail generation failed, continuing without thumbnail:', thumbnailError);
      }

      // Step 4: Upload to Firebase Storage
      const uploadResult = await firebaseStorageService.uploadNewsletterPdf(
        file,
        metadata,
        onProgress,
      );

      // Step 5: Get current user for attribution
      const currentUser = firebaseAuthService.getCurrentUser();
      const userName = currentUser?.displayName || currentUser?.email || 'System';

      // Step 6: Create comprehensive metadata object
      const newsletterMetadata: Omit<NewsletterMetadata, 'id'> = {
        filename: file.name,
        title: metadata.title,
        description: '', // Can be enhanced later
        publicationDate: enhancedDate?.publicationDate || metadata.publicationDate,
        year: enhancedDate?.year || metadata.year,
        fileSize: file.size,
        pageCount: pdfProcessingResult.pageCount,
        downloadUrl: uploadResult.downloadUrl,
        storageRef: uploadResult.storagePath,
        tags: metadata.tags || [],
        featured: metadata.featured || false,
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userName,
        updatedBy: userName,
        actions: {
          canView: true,
          canDownload: true,
          canSearch: !!pdfProcessingResult.textContent,
          hasThumbnail: !!thumbnailUrl,
        },
      };

      // Add thumbnail if generated
      if (thumbnailUrl) {
        newsletterMetadata.thumbnailUrl = thumbnailUrl;
      }

      // Add enhanced date fields if available
      if (enhancedDate) {
        if (enhancedDate.month !== undefined) {
          newsletterMetadata.month = enhancedDate.month;
        }
        if (enhancedDate.season) {
          newsletterMetadata.season = enhancedDate.season;
        }
        if (enhancedDate.displayDate) {
          newsletterMetadata.displayDate = enhancedDate.displayDate;
        }
        if (enhancedDate.sortValue !== undefined) {
          newsletterMetadata.sortValue = enhancedDate.sortValue;
        }
      }

      // Add PDF processing results if available
      if (pdfProcessingResult.textContent) {
        newsletterMetadata.searchableText = pdfProcessingResult.textContent;
      }

      // Add optional fields from input metadata
      if (metadata.issueNumber) {
        newsletterMetadata.issueNumber = metadata.issueNumber;
      }
      if (metadata.season && !newsletterMetadata.season) {
        newsletterMetadata.season = metadata.season;
      }

      // Step 7: Save to Firestore
      const newsletterId = await firestoreService.saveNewsletterMetadata(newsletterMetadata);

      // Step 8: Update with word count as separate operation (since it might not be in the base type)
      if (pdfProcessingResult.wordCount) {
        try {
          await firestoreService.updateNewsletterMetadata(newsletterId, {
            wordCount: pdfProcessingResult.wordCount,
          } as Partial<NewsletterMetadata>);
          logger.debug(`Updated word count: ${pdfProcessingResult.wordCount}`);
        } catch (wordCountError) {
          logger.warn('Failed to update word count:', wordCountError);
        }
      }

      logger.success('Newsletter uploaded successfully:', {
        id: newsletterId,
        filename: file.name,
        pageCount: pdfProcessingResult.pageCount,
        wordCount: pdfProcessingResult.wordCount,
        hasSearchableText: !!pdfProcessingResult.textContent,
      });

      return newsletterId;
    } catch (error) {
      logger.error('Error uploading newsletter:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for existing newsletter (admin function)
   */
  async generateNewsletterThumbnail(newsletterId: string): Promise<void> {
    try {
      const newsletter = await this.getNewsletterById(newsletterId);
      if (!newsletter) {
        throw new Error('Newsletter not found');
      }

      // Skip if thumbnail already exists
      if (newsletter.thumbnailUrl) {
        logger.info(`Newsletter ${newsletterId} already has thumbnail, skipping`);
        return;
      }

      // Download PDF file from Firebase Storage
      if (!newsletter.downloadUrl) {
        throw new Error('Newsletter download URL not available');
      }

      logger.debug(`Downloading PDF for thumbnail generation: ${newsletter.filename}`);
      const response = await fetch(newsletter.downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], newsletter.filename, { type: 'application/pdf' });

      // Generate thumbnail
      logger.debug(`Generating thumbnail for: ${newsletter.filename}`);
      const thumbnailResult = await generatePdfThumbnail(file, {
        maxWidth: 300,
        maxHeight: 400,
        quality: 0.8,
        format: 'jpeg',
      });

      // Update newsletter metadata with thumbnail
      await firestoreService.updateNewsletterMetadata(newsletterId, {
        thumbnailUrl: thumbnailResult.thumbnailUrl,
        actions: {
          ...newsletter.actions,
          hasThumbnail: true,
        },
        updatedAt: new Date().toISOString(),
        updatedBy: firebaseAuthService.getCurrentUser()?.displayName || 'System',
      } as Partial<NewsletterMetadata>);

      // Update local cache
      const index = this._newsletters.value.findIndex((n) => n.id === newsletterId);
      if (index > -1) {
        const currentNewsletter = this._newsletters.value[index];
        if (currentNewsletter) {
          this._newsletters.value[index] = {
            ...currentNewsletter,
            thumbnailUrl: thumbnailResult.thumbnailUrl,
            actions: {
              ...currentNewsletter.actions,
              hasThumbnail: true,
            },
          };
        }
      }

      logger.success(
        `Thumbnail generated for ${newsletter.filename}: ${thumbnailResult.width}x${thumbnailResult.height} (${thumbnailResult.size} bytes)`,
      );
    } catch (error) {
      logger.error(`Error generating thumbnail for newsletter ${newsletterId}:`, error);
      throw error;
    }
  }

  /**
   * Generate thumbnails for multiple newsletters (admin function)
   */
  async generateMultipleThumbnails(
    newsletterIds: string[],
    onProgress?: (completed: number, total: number, current: string) => void,
  ): Promise<void> {
    logger.info(`Starting batch thumbnail generation for ${newsletterIds.length} newsletters`);

    let completed = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const newsletterId of newsletterIds) {
      try {
        const newsletter = await this.getNewsletterById(newsletterId);
        const filename = newsletter?.filename || newsletterId;

        onProgress?.(completed, newsletterIds.length, filename);

        await this.generateNewsletterThumbnail(newsletterId);
        completed++;

        logger.debug(`Thumbnail ${completed}/${newsletterIds.length} completed: ${filename}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ id: newsletterId, error: errorMessage });
        logger.error(`Thumbnail generation failed for ${newsletterId}:`, error);
        // Continue with other newsletters
      }
    }

    onProgress?.(newsletterIds.length, newsletterIds.length, 'Completed');

    logger.success(
      `Batch thumbnail generation completed: ${completed}/${newsletterIds.length} successful`,
    );

    if (errors.length > 0) {
      logger.warn(`${errors.length} thumbnails failed to generate:`, errors);
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

  /**
   * Enhance newsletter metadata with improved date information (admin function)
   */
  async enhanceNewsletterWithDateInfo(newsletterId: string): Promise<void> {
    try {
      const newsletter = await this.getNewsletterById(newsletterId);
      if (!newsletter) {
        throw new Error('Newsletter not found');
      }

      // Parse the filename to get enhanced date information
      const enhancedDate = dateManagementService.enhanceNewsletterMetadata(
        newsletter.filename,
        newsletter,
      );

      // Debug logging
      console.log(`🔧 Enhancing ${newsletter.filename}:`);
      console.log('  📝 Enhanced data:', enhancedDate);
      console.log('  📅 Month:', enhancedDate.month);
      console.log('  🌸 Season:', enhancedDate.season);

      // Update the newsletter with enhanced date fields
      const updateFields: Record<string, unknown> = {};

      // Handle month/season data properly - clear conflicting fields
      if (enhancedDate.month !== undefined) {
        // This is a monthly newsletter
        updateFields.month = enhancedDate.month;
        updateFields.season = deleteField(); // Explicitly clear season field
      } else if (enhancedDate.season !== undefined) {
        // This is a seasonal newsletter
        updateFields.season = enhancedDate.season;
        updateFields.month = deleteField(); // Explicitly clear month field
      }

      // Set other fields
      if (enhancedDate.displayDate !== undefined) {
        updateFields.displayDate = enhancedDate.displayDate;
      }
      if (enhancedDate.sortValue !== undefined) {
        updateFields.sortValue = enhancedDate.sortValue;
      }
      if (enhancedDate.issueNumber !== undefined) {
        updateFields.issueNumber = enhancedDate.issueNumber;
      }

      console.log('  🔄 Updating Firebase with fields:', updateFields);

      await firestoreService.updateNewsletterMetadata(
        newsletterId,
        updateFields as Partial<NewsletterMetadata>,
      );

      // Verify what was actually saved by re-reading from Firebase
      const updatedNewsletter = await this.getNewsletterById(newsletterId);
      console.log('  ✅ After update - Firebase data:', {
        filename: updatedNewsletter?.filename,
        month: updatedNewsletter?.month,
        season: updatedNewsletter?.season,
        displayDate: updatedNewsletter?.displayDate,
      });

      // Update local cache (only with actual values, not deleteField operations)
      const index = this._newsletters.value.findIndex((n) => n.id === newsletterId);
      if (index > -1) {
        const newsletter = this._newsletters.value[index];
        if (newsletter) {
          // Update month/season data based on what type this newsletter is
          if (enhancedDate.month !== undefined) {
            // Monthly newsletter
            newsletter.month = enhancedDate.month;
            delete newsletter.season; // Remove season from local object
          } else if (enhancedDate.season !== undefined) {
            // Seasonal newsletter
            newsletter.season = enhancedDate.season;
            delete newsletter.month; // Remove month from local object
          }

          // Update other fields if they exist
          if (enhancedDate.displayDate !== undefined) {
            newsletter.displayDate = enhancedDate.displayDate;
          }
          if (enhancedDate.sortValue !== undefined) {
            newsletter.sortValue = enhancedDate.sortValue;
          }
          if (enhancedDate.issueNumber !== undefined) {
            newsletter.issueNumber = enhancedDate.issueNumber;
          }
        }
      }

      logger.success('Newsletter enhanced with date info:', newsletterId);
    } catch (error) {
      logger.error('Error enhancing newsletter with date info:', error);
      throw error;
    }
  }

  /**
   * Batch enhance all newsletters with date information (admin function)
   */
  async batchEnhanceNewslettersWithDateInfo(): Promise<{
    processed: number;
    updated: number;
    errors: number;
    results: string[];
  }> {
    try {
      const newsletters = await this.loadAllNewslettersForAdmin();

      const result = {
        processed: 0,
        updated: 0,
        errors: 0,
        results: [] as string[],
      };

      for (const newsletter of newsletters) {
        result.processed++;

        try {
          await this.enhanceNewsletterWithDateInfo(newsletter.id);
          result.updated++;
          result.results.push(`✅ Enhanced: ${newsletter.filename}`);
        } catch (error) {
          result.errors++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.results.push(`❌ Failed: ${newsletter.filename} - ${errorMsg}`);
        }
      }

      logger.info(`Batch enhancement complete: ${result.updated}/${result.processed} updated`);
      return result;
    } catch (error) {
      logger.error('Error in batch enhance newsletters:', error);
      throw error;
    }
  }

  /**
   * Create Firebase database record for existing local PDF file (admin function)
   */
  async createRecordForLocalFile(filename: string): Promise<string> {
    try {
      // Parse the filename to get date information
      const enhancedData = dateManagementService.enhanceNewsletterMetadata(filename);

      if (!enhancedData.year) {
        throw new Error(`Could not parse date information from filename: ${filename}`);
      }

      // Create basic metadata for the local file
      const newsletterMetadata: Omit<NewsletterMetadata, 'id'> = {
        filename,
        title: enhancedData.title || `Conashaugh Lakes Courier - ${enhancedData.displayDate}`,
        description: '',
        publicationDate: enhancedData.publicationDate || new Date().toISOString(),
        year: enhancedData.year,
        fileSize: 0, // Will be updated by processing
        pageCount: 0, // Will be updated by processing
        downloadUrl: `${window.location.origin}/issues/${filename}`, // Absolute URL for local files
        storageRef: '', // Empty for local files
        tags: [],
        featured: false,
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        updatedBy: 'admin',
        actions: {
          canView: true,
          canDownload: true,
          canSearch: false,
          hasThumbnail: false,
        },
      };

      // Add optional fields from parsed date
      if (enhancedData.issueNumber) {
        newsletterMetadata.issueNumber = enhancedData.issueNumber;
      }
      if (enhancedData.month) {
        newsletterMetadata.month = enhancedData.month;
      }
      if (enhancedData.season) {
        newsletterMetadata.season = enhancedData.season;
      }
      if (enhancedData.displayDate) {
        newsletterMetadata.displayDate = enhancedData.displayDate;
      }
      if (enhancedData.sortValue) {
        newsletterMetadata.sortValue = enhancedData.sortValue;
      }

      const newsletterId = await firestoreService.saveNewsletterMetadata(newsletterMetadata);

      // Add to local cache
      this._newsletters.value.push({
        id: newsletterId,
        ...newsletterMetadata,
      });

      logger.success('Created database record for local file:', filename);
      return newsletterId;
    } catch (error) {
      logger.error('Error creating record for local file:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseNewsletterService = new FirebaseNewsletterService();
export default firebaseNewsletterService;
