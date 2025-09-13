/**
 * Batch Content Transformer
 * Transforms batch processing JSON data into ContentDoc format for display
 */

import type { ContentDoc, ContentFeatures } from '../types/core/content.types';
import type { Timestamp } from 'firebase/firestore';
import { normalizeDate, getCurrentYear } from './date-formatter';

export interface BatchProcessingItem {
  file_path: string;
  file_name: string;
  processed_at: string;
  environment: string;
  model_used: string;
  content: {
    full_text: string;
    title: string;
    author: string;
    word_count: number;
    character_count: number;
  };
  structure: {
    sections: Array<{
      type: 'section_header' | 'text' | 'document_index' | 'table' | 'image' | 'advertisement';
      text: string;
      start: number;
      end: number;
    }>;
  };
}

export interface ExtractedArticle {
  title: string;
  content: string;
  author: string | undefined;
  sectionType: string;
  startPosition: number;
  endPosition: number;
  tags: string[];
}

/**
 * Transform batch processing data into individual ContentDoc articles
 */
export class BatchContentTransformer {
  /**
   * Extract individual articles from a batch processing item
   */
  static extractArticles(batchItem: BatchProcessingItem): ExtractedArticle[] {
    const articles: ExtractedArticle[] = [];
    const sections = batchItem.structure.sections;

    let currentArticle: Partial<ExtractedArticle> | null = null;

    for (const section of sections) {
      // Start new article on section headers
      if (section.type === 'section_header' && section.text.trim()) {
        // Save previous article if exists
        if (currentArticle && currentArticle.title && currentArticle.content) {
          articles.push({
            title: currentArticle.title,
            content: currentArticle.content,
            author: currentArticle.author,
            sectionType: currentArticle.sectionType || 'text',
            startPosition: currentArticle.startPosition || 0,
            endPosition: currentArticle.endPosition || 0,
            tags: currentArticle.tags || []
          });
        }

        // Start new article
        currentArticle = {
          title: section.text.trim(),
          content: '',
          sectionType: section.type,
          startPosition: section.start,
          endPosition: section.end,
          tags: this.generateTagsFromTitle(section.text)
        };
      }
      // Add content to current article
      else if (currentArticle && section.type === 'text' && section.text.trim()) {
        if (currentArticle.content) {
          currentArticle.content += '\n\n' + section.text.trim();
        } else {
          currentArticle.content = section.text.trim();
        }
        currentArticle.endPosition = section.end;
      }
    }

    // Add final article
    if (currentArticle && currentArticle.title && currentArticle.content) {
      articles.push({
        title: currentArticle.title,
        content: currentArticle.content,
        author: currentArticle.author,
        sectionType: currentArticle.sectionType || 'text',
        startPosition: currentArticle.startPosition || 0,
        endPosition: currentArticle.endPosition || 0,
        tags: currentArticle.tags || []
      });
    }

    return articles;
  }

  /**
   * Transform an extracted article into a ContentDoc
   */
  static transformToContentDoc(
    article: ExtractedArticle,
    batchItem: BatchProcessingItem,
    authorId: string,
    authorName: string,
    features: Partial<ContentFeatures> = {}
  ): Omit<ContentDoc, 'id'> {
    // Extract date information from filename or content
    const dateInfo = this.extractDateInfo(batchItem.file_name, article.content);

    // Generate comprehensive tags
    const tags = [
      'content-type:article',
      'source:newsletter',
      `newsletter:${this.extractNewsletterName(batchItem.file_name)}`,
      `year:${dateInfo.year}`,
      ...article.tags,
      ...this.generateContentTags(article.content)
    ];

    // Add date feature if date information is available
    if (dateInfo.date && !features['feat:date']) {
      features['feat:date'] = {
        start: dateInfo.date as unknown as Timestamp,
        isAllDay: true
      };
    }

    return {
      title: article.title,
      description: this.truncateContent(article.content, 500),
      authorId,
      authorName,
      tags,
      features,
      status: 'published',
      timestamps: {
        created: normalizeDate(batchItem.processed_at) as unknown as Timestamp,
        updated: normalizeDate(batchItem.processed_at) as unknown as Timestamp,
        published: normalizeDate(batchItem.processed_at) as unknown as Timestamp
      }
    };
  }

  /**
   * Transform the entire newsletter as a single content item
   */
  static transformNewsletterToContentDoc(
    batchItem: BatchProcessingItem,
    authorId: string,
    authorName: string,
    features: Partial<ContentFeatures> = {}
  ): Omit<ContentDoc, 'id'> {
    const dateInfo = this.extractDateInfo(batchItem.file_name, batchItem.content.full_text);

    const tags = [
      'content-type:newsletter',
      'source:pdf',
      `newsletter:${this.extractNewsletterName(batchItem.file_name)}`,
      `year:${dateInfo.year}`,
      ...this.generateContentTags(batchItem.content.full_text)
    ];

    if (dateInfo.date && !features['feat:date']) {
      features['feat:date'] = {
        start: dateInfo.date as unknown as Timestamp,
        isAllDay: true
      };
    }

    return {
      title: batchItem.content.title || this.extractNewsletterName(batchItem.file_name),
      description: this.truncateContent(batchItem.content.full_text, 1000),
      authorId,
      authorName,
      tags,
      features,
      status: 'published',
      timestamps: {
        created: normalizeDate(batchItem.processed_at) as unknown as Timestamp,
        updated: normalizeDate(batchItem.processed_at) as unknown as Timestamp,
        published: normalizeDate(batchItem.processed_at) as unknown as Timestamp
      }
    };
  }

  /**
   * Generate tags from article title
   */
  private static generateTagsFromTitle(title: string): string[] {
    const tags: string[] = [];
    const lowerTitle = title.toLowerCase();

    // Category tags based on title content
    if (lowerTitle.includes('meeting') || lowerTitle.includes('annual')) {
      tags.push('category:meeting');
    }
    if (lowerTitle.includes('security') || lowerTitle.includes('report')) {
      tags.push('category:security');
    }
    if (lowerTitle.includes('budget') || lowerTitle.includes('financial')) {
      tags.push('category:financial');
    }
    if (lowerTitle.includes('event') || lowerTitle.includes('picnic') || lowerTitle.includes('social')) {
      tags.push('category:event');
    }
    if (lowerTitle.includes('maintenance') || lowerTitle.includes('repair')) {
      tags.push('category:maintenance');
    }
    if (lowerTitle.includes('letter') || lowerTitle.includes('thank')) {
      tags.push('category:community');
    }

    return tags;
  }

  /**
   * Generate content-based tags
   */
  private static generateContentTags(content: string): string[] {
    const tags: string[] = [];
    const lowerContent = content.toLowerCase();

    // Extract key terms and create tags
    const keyTerms = [
      'lake', 'community', 'association', 'board', 'meeting', 'security',
      'maintenance', 'pool', 'recreation', 'budget', 'dues', 'property'
    ];

    keyTerms.forEach(term => {
      if (lowerContent.includes(term)) {
        tags.push(`topic:${term}`);
      }
    });

    return tags;
  }

  /**
   * Extract date information from filename and content
   */
  private static extractDateInfo(filename: string, content: string): {
    year: number;
    date?: Date;
    season?: string | undefined;
  } {
    // Extract year from filename (e.g., "2014.summer-conashaugh-courier.pdf")
    const yearMatch = filename.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]!) : getCurrentYear();

    // Extract season from filename
    const seasonMatch = filename.match(/\.(spring|summer|fall|winter)/i);
    const season = seasonMatch ? seasonMatch[1]!.toLowerCase() : undefined;

    // Try to extract specific date from content
    const dateMatch = content.match(/(\w+ \d{1,2}, \d{4})/);
    let date: Date | undefined;

    if (dateMatch) {
      // Use normalizeDate for safe date parsing
      const parsedDate = normalizeDate(dateMatch[1]);
      date = parsedDate || new Date(year, season === 'spring' ? 2 : season === 'summer' ? 5 : season === 'fall' ? 8 : 11, 1);
    } else {
      // Create approximate date based on season
      date = new Date(year, season === 'spring' ? 2 : season === 'summer' ? 5 : season === 'fall' ? 8 : 11, 1);
    }

    return { year, date, season };
  }

  /**
   * Extract newsletter name from filename
   */
  private static extractNewsletterName(filename: string): string {
    // Remove year and season, extract main name
    return filename
      .replace(/^\d{4}\./, '')
      .replace(/\.(spring|summer|fall|winter)/i, '')
      .replace(/\.pdf$/i, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Truncate content for description field
   */
  private static truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;

    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
}
