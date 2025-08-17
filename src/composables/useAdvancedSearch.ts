import { ref, computed, watch, readonly } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import type { IssueWithGoogleDrive } from '../types/google-drive-content';

// Configure PDF.js worker with correct base path for GitHub Pages
const getWorkerPath = () => {
  if (typeof window !== 'undefined') {
    const isProduction = import.meta.env.PROD;
    const basePath = isProduction ? '/clca-courier' : '';
    return `${basePath}/pdf.worker.min.js`;
  }
  return '/pdf.worker.min.js';
};

pdfjsLib.GlobalWorkerOptions.workerSrc = getWorkerPath();

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
  includeContent: boolean; // Whether to search inside PDF content
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

  // Search-specific properties
  score: number;
  matchType: 'title' | 'description' | 'content' | 'metadata';
  snippet?: string | undefined;
  highlightedText?: string | undefined;
  pageNumber?: number | undefined;
  highlights: {
    title?: string | undefined;
    description?: string | undefined;
    content?: readonly string[] | undefined;
  };
  matchedTerms: readonly string[];

  // Keep the original issue for backward compatibility
  issue: IssueWithGoogleDrive;
}

export interface SearchStats {
  totalResults: number;
  searchTime: number;
  indexedPdfs: number;
  skippedPdfs: number;
  cachedIssues: number;
  hasContentMatches: boolean;
  averageScore: number;
}

export function useAdvancedSearch() {
  // Search state
  const isSearching = ref(false);
  const searchResults = ref<SearchResult[]>([]);
  const searchError = ref<string | null>(null);
  const searchStats = ref<SearchStats>({
    totalResults: 0,
    searchTime: 0,
    indexedPdfs: 0,
    skippedPdfs: 0,
    cachedIssues: 0,
    hasContentMatches: false,
    averageScore: 0,
  });

  // Search filters
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
    includeContent: true,
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

  // Watch for filter changes to re-filter results
  watch(
    () => filters.value,
    () => {
      // Results are automatically filtered via computed property
    },
    { deep: true },
  );

  /**
   * Create a SearchResult from an IssueWithGoogleDrive
   */
  function createSearchResult(
    issue: IssueWithGoogleDrive,
    score: number,
    matchType: 'title' | 'description' | 'content' | 'metadata',
    options: {
      snippet?: string;
      highlightedText?: string;
      pageNumber?: number;
      highlights?: {
        title?: string;
        description?: string;
        content?: readonly string[];
      };
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
      highlightedText: options.highlightedText,
      pageNumber: options.pageNumber,
      highlights: options.highlights || {
        title: undefined,
        description: undefined,
        content: undefined as readonly string[] | undefined,
      },
      matchedTerms: options.matchedTerms || [],

      // Keep original issue for backward compatibility
      issue,
    };
  }

  /**
   * Extract text content from PDF
   */
  async function extractPdfText(pdfUrl: string): Promise<string> {
    try {
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;
      let fullText = '';

      // Extract text from all pages (limit to first 10 pages for performance)
      const maxPages = Math.min(pdf.numPages, 10);
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: TextItem | TextMarkedContent) => {
            if ('str' in item) {
              return item.str;
            }
            return '';
          })
          .join(' ');
        fullText += pageText + ' ';
      }

      return fullText.trim();
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw error;
    }
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
      case 'description':
        score += 80;
        break;
      case 'content':
        score += 60;
        break;
      case 'metadata':
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
   * Search within a single PDF
   */
  async function searchInPdf(issue: IssueWithGoogleDrive, query: string): Promise<SearchResult[]> {
    if (!filters.value.includeContent || !issue.url) {
      return [];
    }

    try {
      const pdfUrl = issue.url || '';

      // Skip Google Drive files for now due to CORS limitations
      // Future enhancement: implement server-side proxy or Google Drive API
      if (pdfUrl.includes('drive.google.com') || pdfUrl.includes('googleusercontent.com')) {
        searchStats.value.skippedPdfs++;
        return [];
      }

      // Try to extract text from PDF
      const pdfText = await extractPdfText(pdfUrl);
      searchStats.value.indexedPdfs++;

      if (pdfText.toLowerCase().includes(query.toLowerCase())) {
        const snippet = generateSnippet(pdfText, query);
        const score = calculateRelevanceScore(issue, query, 'content');

        return [
          createSearchResult(issue, score, 'content', {
            snippet,
            highlightedText: snippet,
            highlights: {
              content: [snippet],
            },
            matchedTerms: [query],
          }),
        ];
      }
    } catch (error) {
      console.warn(`Failed to search in PDF: ${issue.title}`, error);
      searchStats.value.skippedPdfs++;
    }

    return [];
  }

  /**
   * Search in issue metadata (title, description, etc.)
   */
  function searchInMetadata(issue: IssueWithGoogleDrive, query: string): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    // Search in title
    if (issue.title?.toLowerCase().includes(queryLower)) {
      results.push(
        createSearchResult(issue, calculateRelevanceScore(issue, query, 'title'), 'title', {
          highlightedText: issue.title,
          highlights: {
            title: issue.title,
          },
          matchedTerms: [query],
        }),
      );
    }

    // Search in description
    if (issue.description?.toLowerCase().includes(queryLower)) {
      const snippet = generateSnippet(issue.description, query);
      results.push(
        createSearchResult(
          issue,
          calculateRelevanceScore(issue, query, 'description'),
          'description',
          {
            snippet,
            highlightedText: snippet,
            highlights: {
              description: snippet,
            },
            matchedTerms: [query],
          },
        ),
      );
    }

    return results;
  }

  /**
   * Perform advanced search across all issues
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

    // Reset stats
    searchStats.value = {
      totalResults: 0,
      searchTime: 0,
      indexedPdfs: 0,
      skippedPdfs: 0,
      cachedIssues: 0,
      hasContentMatches: false,
      averageScore: 0,
    };

    try {
      const allResults: SearchResult[] = [];

      // Process issues in parallel for metadata search
      const metadataPromises = issues.map((issue) =>
        Promise.resolve(searchInMetadata(issue, query)),
      );

      const metadataResults = await Promise.all(metadataPromises);
      metadataResults.forEach((results) => allResults.push(...results));

      // Process PDFs for content search (if enabled)
      if (filters.value.includeContent) {
        // Process PDFs in smaller batches to avoid overwhelming the browser
        const batchSize = 5;
        for (let i = 0; i < issues.length; i += batchSize) {
          const batch = issues.slice(i, i + batchSize);
          const pdfPromises = batch.map((issue) => searchInPdf(issue, query));
          const pdfResults = await Promise.all(pdfPromises);
          pdfResults.forEach((results) => allResults.push(...results));
        }
      }

      // Remove duplicates and merge results by issue
      const uniqueResults = new Map<string, SearchResult>();
      for (const result of allResults) {
        const key = String(result.id);
        const existing = uniqueResults.get(key);

        if (!existing || result.score > existing.score) {
          uniqueResults.set(key, result);
        }
      }

      searchResults.value = Array.from(uniqueResults.values());

      // Update stats
      const totalResults = searchResults.value.length;
      const hasContentMatches = searchResults.value.some((r) => r.matchType === 'content');
      const averageScore =
        totalResults > 0
          ? searchResults.value.reduce((sum, r) => sum + r.score, 0) / totalResults
          : 0;

      searchStats.value = {
        totalResults,
        searchTime: Date.now() - startTime,
        indexedPdfs: searchStats.value.indexedPdfs,
        skippedPdfs: searchStats.value.skippedPdfs,
        cachedIssues: 0, // Not implemented yet
        hasContentMatches,
        averageScore,
      };
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
      indexedPdfs: 0,
      skippedPdfs: 0,
      cachedIssues: 0,
      hasContentMatches: false,
      averageScore: 0,
    };
  }

  /**
   * Update search filters
   */
  function updateFilters(newFilters: Partial<SearchFilters>): void {
    Object.assign(filters.value, newFilters);
  }

  /**
   * Clear content cache (placeholder)
   */
  function clearContentCache(): void {
    // Placeholder for cache clearing functionality
    searchStats.value.cachedIssues = 0;
  }

  /**
   * Get search suggestions based on current query
   */
  function getSearchSuggestions(issues: IssueWithGoogleDrive[], query: string): string[] {
    if (query.length < 2) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    issues.forEach((issue) => {
      // Extract words from title and description
      const text = `${issue.title || ''} ${issue.description || ''}`.toLowerCase();
      const words = text.match(/\b\w{3,}\b/g) || [];

      words.forEach((word) => {
        if (word.includes(queryLower) && word !== queryLower) {
          suggestions.add(word);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
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
    updateFilters,
    getSearchSuggestions,
    clearContentCache,

    // Utility methods for external use
    extractPdfText,
    calculateRelevanceScore,
    generateSnippet,
  };
}
