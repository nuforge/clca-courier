import { ref, computed, readonly } from 'vue';
import type { IssueWithGoogleDrive } from '../types/google-drive-content';
import { pdfMetadataService } from '../services/pdf-metadata-service';

export interface SearchFilters {
  query: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  contentTypes: string[];
  categories: string[];
  minPages: number | null;
  maxPages: number | null;
  includeContent: boolean; // Whether to search inside PDF content - now opt-in only
}

export interface SearchResult {
  // Core issue properties - from IssueWithGoogleDrive
  id: number;
  title: string;
  date: string;
  pages: number;
  filename: string;
  status: 'google-drive' | 'local' | 'hybrid';
  syncStatus: 'synced' | 'outdated' | 'error' | 'syncing';

  // Optional issue properties
  url?: string | undefined;
  description?: string | undefined;
  fileSize?: string | undefined;
  thumbnailUrl?: string | undefined;
  tags?: readonly string[] | undefined;
  googleDriveFileId?: string | undefined;
  category?: string | undefined;
  localUrl?: string | undefined;
  googleDriveUrl?: string | undefined;
  cacheThumbnailUrl?: string | undefined;

  // Lightweight search properties
  score: number;
  matchType: 'title' | 'filename' | 'metadata' | 'content';
  snippet?: string | undefined;
  matchedTerms: readonly string[];

  // Highlighting for search results
  highlights?: {
    title?: string;
    description?: string;
    content?: readonly string[];
  };

  // Keep the original issue for backward compatibility
  issue: IssueWithGoogleDrive;
}

export interface SearchStats {
  totalResults: number;
  searchTime: number;
  searchMode: 'lightweight' | 'content';
  cachedResults: number;
  cachedIssues: number;
  hasContentMatches: boolean;
  averageScore: number;
  indexedPdfs: number;
}

export function useAdvancedSearch() {
  // Search state
  const isSearching = ref(false);
  const searchResults = ref<SearchResult[]>([]);
  const searchError = ref<string | null>(null);
  const searchStats = ref<SearchStats>({
    totalResults: 0,
    searchTime: 0,
    searchMode: 'lightweight',
    cachedResults: 0,
    cachedIssues: 0,
    hasContentMatches: false,
    averageScore: 0,
    indexedPdfs: 0,
  });

  // Search filters - lightweight by default
  const filters = ref<SearchFilters>({
    query: '',
    dateRange: {
      start: null,
      end: null,
    },
    contentTypes: [],
    categories: [],
    minPages: null,
    maxPages: null,
    includeContent: false, // Default to false for fast performance
  });

  // Filtered results based on current filters
  const filteredResults = computed(() => {
    let results = [...searchResults.value];

    // Apply date range filter
    if (filters.value.dateRange.start || filters.value.dateRange.end) {
      results = results.filter((result) => {
        const issueDate = result.date ? new Date(result.date) : null;
        if (!issueDate) return false;

        if (filters.value.dateRange.start && issueDate < filters.value.dateRange.start) {
          return false;
        }
        if (filters.value.dateRange.end && issueDate > filters.value.dateRange.end) {
          return false;
        }
        return true;
      });
    }

    // Apply content type filter
    if (filters.value.contentTypes.length > 0) {
      results = results.filter((result) => {
        return filters.value.contentTypes.some(
          (type) =>
            result.title?.toLowerCase().includes(type.toLowerCase()) ||
            result.description?.toLowerCase().includes(type.toLowerCase()),
        );
      });
    }

    // Apply page count filters
    if (filters.value.minPages !== null || filters.value.maxPages !== null) {
      results = results.filter((result) => {
        const pageCount = result.pages;
        if (!pageCount) return false;

        if (filters.value.minPages !== null && pageCount < filters.value.minPages) {
          return false;
        }
        if (filters.value.maxPages !== null && pageCount > filters.value.maxPages) {
          return false;
        }
        return true;
      });
    }

    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score);
  });

  /**
   * Create a SearchResult from an IssueWithGoogleDrive
   */
  function createSearchResult(
    issue: IssueWithGoogleDrive,
    score: number,
    matchType: 'title' | 'filename' | 'metadata' | 'content',
    options: {
      snippet?: string;
      matchedTerms?: readonly string[];
    } = {},
  ): SearchResult {
    return {
      // Core issue properties
      id: issue.id,
      title: issue.title,
      date: issue.date,
      pages: issue.pages,
      filename: issue.filename,
      status: issue.status,
      syncStatus: issue.syncStatus,

      // Optional properties
      ...(issue.url && { url: issue.url }),
      ...(issue.description && { description: issue.description }),
      ...(issue.fileSize && { fileSize: issue.fileSize }),
      ...(issue.thumbnailUrl && { thumbnailUrl: issue.thumbnailUrl }),
      ...(issue.tags && { tags: issue.tags }),
      ...(issue.googleDriveFileId && { googleDriveFileId: issue.googleDriveFileId }),
      ...(issue.category && { category: issue.category }),
      ...(issue.localUrl && { localUrl: issue.localUrl }),
      ...(issue.googleDriveUrl && { googleDriveUrl: issue.googleDriveUrl }),
      ...(issue.cacheThumbnailUrl && { cacheThumbnailUrl: issue.cacheThumbnailUrl }),

      // Search-specific properties
      score,
      matchType,
      snippet: options.snippet,
      matchedTerms: options.matchedTerms || [],

      // Keep original issue for backward compatibility
      issue,
    };
  }

  /**
   * Calculate relevance score for search result
   */
  function calculateRelevanceScore(
    issue: IssueWithGoogleDrive,
    query: string,
    matchType: string,
  ): number {
    let score = 0;
    const queryLower = query.toLowerCase();

    // Base score by match type
    switch (matchType) {
      case 'title':
        score += 100;
        break;
      case 'filename':
        score += 80;
        break;
      case 'metadata':
        score += 60;
        break;
      case 'content':
        score += 40;
        break;
    }

    // Boost score for exact matches
    if (issue.title?.toLowerCase().includes(queryLower)) {
      score += 50;
    }
    if (issue.description?.toLowerCase().includes(queryLower)) {
      score += 30;
    }
    if (issue.filename?.toLowerCase().includes(queryLower)) {
      score += 40;
    }

    // Boost for recent content
    if (issue.date) {
      const publishDate = new Date(issue.date);
      const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublish < 30) {
        score += 20;
      } else if (daysSincePublish < 90) {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Generate snippet from text content
   */
  function generateSnippet(text: string, query: string, maxLength: number = 150): string {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(queryLower);

    if (index === -1) {
      return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    const snippet = text.slice(start, end);

    return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
  }

  /**
   * LIGHTWEIGHT: Search only in metadata, filenames, and cached info
   * No PDF processing - instant results
   */
  function performLightweightSearch(issues: IssueWithGoogleDrive[], query: string): SearchResult[] {
    if (!query || query.length < 2) return [];

    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    issues.forEach((issue) => {
      let score = 0;
      let matchType: 'title' | 'filename' | 'metadata' | 'content' = 'metadata';
      const matchedTerms: string[] = [];

      // Search in title (highest priority)
      if (issue.title?.toLowerCase().includes(queryLower)) {
        score += 100;
        matchType = 'title';
        matchedTerms.push(query);
      }

      // Search in filename (high priority)
      if (issue.filename?.toLowerCase().includes(queryLower)) {
        score += 80;
        if (matchType === 'metadata') matchType = 'filename';
        matchedTerms.push(query);
      }

      // Search in description (medium priority)
      if (issue.description?.toLowerCase().includes(queryLower)) {
        score += 60;
        matchedTerms.push(query);
      }

      // Search in tags (medium priority)
      if (issue.tags?.some((tag) => tag.toLowerCase().includes(queryLower))) {
        score += 40;
        matchedTerms.push(query);
      }

      // Check cached metadata for additional search terms
      const cachedMetadata = pdfMetadataService.getCachedMetadata(issue.filename);
      if (cachedMetadata) {
        // Search in cached extracted topics
        if (
          cachedMetadata.extractedTopics?.some((topic) => topic.toLowerCase().includes(queryLower))
        ) {
          score += 30;
          matchedTerms.push(query);
        }

        // If content search is enabled and we have cached text, search it
        if (
          filters.value.includeContent &&
          cachedMetadata.searchableText?.toLowerCase().includes(queryLower)
        ) {
          score += 50;
          matchType = 'content';
          matchedTerms.push(query);
        }
      }

      // Boost for recent content
      if (issue.date) {
        const publishDate = new Date(issue.date);
        const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublish < 30) score += 20;
        else if (daysSincePublish < 90) score += 10;
      }

      if (score > 0) {
        const snippet =
          issue.description ||
          (cachedMetadata?.searchableText
            ? generateSnippet(cachedMetadata.searchableText, query)
            : issue.title) ||
          '';

        results.push(
          createSearchResult(issue, score, matchType, {
            snippet,
            matchedTerms,
          }),
        );
      }
    });

    return results;
  }

  /**
   * MAIN SEARCH FUNCTION: Fast by default, with optional cached content search
   */
  async function performSearch(
    issues: IssueWithGoogleDrive[],
    searchQuery?: string,
  ): Promise<void> {
    const query = searchQuery || filters.value.query.trim();

    if (!query || query.length < 2) {
      searchResults.value = [];
      searchError.value = null;
      return;
    }

    isSearching.value = true;
    searchError.value = null;
    const startTime = Date.now();

    try {
      // Always start with lightweight search (instant)
      const lightweightResults = performLightweightSearch(issues, query);
      searchResults.value = lightweightResults;

      // Allow any pending background operations to complete
      await Promise.resolve();

      // Count how many results came from cached content
      const cachedContentResults = lightweightResults.filter(
        (r) => r.matchType === 'content',
      ).length;

      // Calculate additional stats
      const hasContentMatches = lightweightResults.some((r) => r.matchType === 'content');
      const averageScore =
        lightweightResults.length > 0
          ? lightweightResults.reduce((sum, r) => sum + r.score, 0) / lightweightResults.length
          : 0;

      searchStats.value = {
        totalResults: lightweightResults.length,
        searchTime: Date.now() - startTime,
        searchMode: filters.value.includeContent ? 'content' : 'lightweight',
        cachedResults: cachedContentResults,
        cachedIssues: cachedContentResults,
        hasContentMatches,
        averageScore,
        indexedPdfs: issues.length,
      };

      console.log(
        `[AdvancedSearch] Found ${lightweightResults.length} results in ${searchStats.value.searchTime}ms (${cachedContentResults} from cached content)`,
      );
    } catch (error) {
      console.error('Search error:', error);
      searchError.value = error instanceof Error ? error.message : 'Search failed';
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }

  /**
   * Clear search results and filters
   */
  function clearSearch(): void {
    searchResults.value = [];
    searchError.value = null;
    filters.value.query = '';
    searchStats.value = {
      totalResults: 0,
      searchTime: 0,
      searchMode: 'lightweight',
      cachedResults: 0,
      cachedIssues: 0,
      hasContentMatches: false,
      averageScore: 0,
      indexedPdfs: 0,
    };
  }

  /**
   * Update search filters
   */
  function updateFilters(newFilters: Partial<SearchFilters>): void {
    Object.assign(filters.value, newFilters);
  }

  /**
   * Get search suggestions based on current query
   */
  function getSearchSuggestions(issues: IssueWithGoogleDrive[], query: string): string[] {
    if (query.length < 2) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    issues.forEach((issue) => {
      // Extract words from title, filename, and description
      const text =
        `${issue.title || ''} ${issue.filename || ''} ${issue.description || ''}`.toLowerCase();
      const words = text.match(/\b\w{3,}\b/g) || [];

      words.forEach((word) => {
        if (word.includes(queryLower) && word !== queryLower) {
          suggestions.add(word);
        }
      });

      // Add suggestions from cached metadata
      const cachedMetadata = pdfMetadataService.getCachedMetadata(issue.filename);
      if (cachedMetadata?.extractedTopics) {
        cachedMetadata.extractedTopics.forEach((topic) => {
          if (topic.toLowerCase().includes(queryLower) && topic.toLowerCase() !== queryLower) {
            suggestions.add(topic);
          }
        });
      }
    });

    return Array.from(suggestions).slice(0, 8);
  }

  /**
   * Clear cached PDF content
   */
  function clearContentCache(): void {
    try {
      pdfMetadataService.clearCache();
      console.log('[AdvancedSearch] PDF content cache cleared');
    } catch (error) {
      console.error('[AdvancedSearch] Error clearing cache:', error);
    }
  }

  return {
    // State
    isSearching: readonly(isSearching),
    searchResults: readonly(searchResults),
    filteredResults,
    searchError: readonly(searchError),
    searchStats: readonly(searchStats),
    filters: readonly(filters),
    searchFilters: readonly(filters), // Alias for compatibility

    // Methods
    performSearch,
    clearSearch,
    clearContentCache,
    updateFilters,
    getSearchSuggestions,

    // Utility methods for external use
    calculateRelevanceScore,
    generateSnippet,
  };
}
