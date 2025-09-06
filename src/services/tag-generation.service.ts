/**
 * Unified Tag Generation Service
 * Consolidates tag generation logic for both bulk and individual operations
 * Ensures consistent data types and processing across all extraction methods
 */

import {
  advancedPdfTextExtractionService,
  type AdvancedPdfExtraction,
} from './advanced-pdf-text-extraction-service';
import type { Newsletter } from '../types/core/newsletter.types';

export interface TagGenerationResult {
  // Text tags for display and search
  suggestedTags: string[]; // Word-based tags from text analysis
  topics: string[]; // Category-based topics (Community Events, etc.)

  // Keyword analysis for detailed insights
  keyTerms: string[]; // Top keywords without counts
  keywordCounts: Record<string, number>; // Full keyword frequency data

  // Text content for storage
  textContent: string;
  textPreview: string;
  wordCount: number;
}

export class TagGenerationService {
  /**
   * Generate tags from PDF file - single source of truth for tag generation
   */
  async generateTagsFromPdf(pdfUrl: string, filename: string): Promise<TagGenerationResult> {
    console.log(`🏷️ [TagGenerationService] Generating tags for: ${filename}`);

    try {
      // Use advanced PDF extraction service
      const extractionResult = await advancedPdfTextExtractionService.extractAdvancedPdfData(
        pdfUrl,
        filename,
        {
          extractImages: false,
          extractText: true,
          extractArticles: false,
          extractTopics: true,
          generateThumbnails: false,
        },
      );

      // Perform keyword analysis using the same method as useContentExtraction
      const keywordAnalysis = this.analyzeKeywords(extractionResult.cleanedText);

      // Return properly typed and filtered results
      const result: TagGenerationResult = {
        // Tags: Clean text words for tagging (NO NUMBERS)
        suggestedTags: this.filterAndLimitTags(extractionResult.searchableTerms || [], 10),

        // Topics: Category classifications (Community Events, Lake Activities, etc.)
        topics: this.filterAndLimitTags(extractionResult.topics || [], 5),

        // Keywords: Analysis data with counts
        keyTerms: keywordAnalysis.keywords,
        keywordCounts: keywordAnalysis.keywordCounts,

        // Text content
        textContent: extractionResult.cleanedText,
        textPreview: extractionResult.cleanedText.substring(0, 500),
        wordCount: extractionResult.totalWords,
      };

      console.log(`🏷️ [TagGenerationService] Generated for ${filename}:`, {
        suggestedTags: result.suggestedTags.length,
        topics: result.topics.length,
        keyTerms: result.keyTerms.length,
      });

      return result;
    } catch (error) {
      console.error(`❌ [TagGenerationService] Failed to generate tags for ${filename}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Tag generation failed: ${errorMessage}`);
    }
  }

  /**
   * Apply generated tags to newsletter object - single method for all operations
   */
  applyTagsToNewsletter(
    newsletter: Newsletter,
    tagResult: TagGenerationResult,
    options: {
      maxNewTags?: number;
      maxNewCategories?: number;
      replaceExisting?: boolean;
    } = {},
  ): Newsletter {
    const { maxNewTags = 10, maxNewCategories = 5, replaceExisting = false } = options;

    console.log(`🏷️ [TagGenerationService] Applying tags to: ${newsletter.filename}`);

    // Ensure existing arrays exist
    const existingTags = newsletter.tags || [];
    const existingTopics = newsletter.topics || [];

    // Filter out tags that already exist (unless replacing)
    const newTags = replaceExisting
      ? tagResult.suggestedTags.slice(0, maxNewTags)
      : tagResult.suggestedTags.filter((tag) => !existingTags.includes(tag)).slice(0, maxNewTags);

    const newTopics = replaceExisting
      ? tagResult.topics.slice(0, maxNewCategories)
      : tagResult.topics
          .filter((topic) => !existingTopics.includes(topic))
          .slice(0, maxNewCategories);

    // Create updated newsletter object
    const updatedNewsletter: Newsletter = {
      ...newsletter,
      // Text-based tags (NO NUMBERS - only strings!)
      tags: replaceExisting ? newTags : [...existingTags, ...newTags],

      // Category-based topics
      topics: replaceExisting ? newTopics : [...existingTopics, ...newTopics],

      // Store keyword analysis data separately (not in Newsletter interface)
      // keywordCounts: tagResult.keywordCounts,

      // Text content (if Newsletter interface supports it)
      // textContent: tagResult.textContent,
      // textPreview: tagResult.textPreview,
      // wordCount: tagResult.wordCount,

      // Mark as processed
      isProcessed: true,
    };

    console.log(`🏷️ [TagGenerationService] Applied to ${newsletter.filename}:`, {
      totalTags: updatedNewsletter.tags?.length || 0,
      totalTopics: updatedNewsletter.topics?.length || 0,
      newTagsAdded: newTags.length,
      newTopicsAdded: newTopics.length,
    });

    return updatedNewsletter;
  }

  /**
   * Filter tags to ensure only strings, no numbers, and limit count
   */
  private filterAndLimitTags(tags: string[], limit: number): string[] {
    return tags
      .filter((tag) => {
        // Ensure it's a string and not just a number
        if (typeof tag !== 'string') return false;

        // Filter out purely numeric strings
        if (/^\d+$/.test(tag.trim())) return false;

        // Filter out very short or empty strings
        if (tag.trim().length < 2) return false;

        return true;
      })
      .slice(0, limit);
  }

  /**
   * Keyword analysis - extracted from useContentExtraction for consistency
   */
  private analyzeKeywords(text: string): {
    keywords: string[];
    keywordCounts: Record<string, number>;
  } {
    // Stop words to filter out
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'up',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'is',
      'am',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'having',
      'do',
      'does',
      'did',
      'doing',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'shall',
      'ought',
      'need',
      'dare',
      'used',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'me',
      'him',
      'her',
      'us',
      'them',
      'my',
      'your',
      'his',
      'her',
      'its',
      'our',
      'their',
      'myself',
      'yourself',
      'himself',
      'herself',
      'itself',
      'ourselves',
      'yourselves',
      'themselves',
      // Newsletter-specific common words
      'newsletter',
      'issue',
      'volume',
      'page',
      'pages',
      'article',
      'news',
      'update',
      'report',
      'meeting',
      'board',
      'member',
      'members',
      'community',
      'association',
    ]);

    // Extract and count words
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(
        (word) => word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word), // Filter out pure numbers
      );

    // Count word frequencies
    const wordCounts: Record<string, number> = {};
    words.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Sort by frequency and get top keywords
    const sortedWords = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50); // Top 50 keywords

    const topKeywords = sortedWords.map(([word]) => word);
    const keywordCounts = Object.fromEntries(sortedWords);

    console.log(`🔍 [TagGenerationService] Keyword analysis completed:`, {
      totalWords: words.length,
      uniqueKeywords: topKeywords.length,
      topKeywords: topKeywords.slice(0, 5),
    });

    return { keywords: topKeywords, keywordCounts };
  }
}

// Export singleton instance for consistent usage
export const tagGenerationService = new TagGenerationService();
