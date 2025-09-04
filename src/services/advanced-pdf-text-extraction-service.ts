/**
 * Advanced PDF Text Extraction Service
 * Enhanced text extraction for database storage and search indexing
 */

import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import PDF_CONFIG from '../utils/pdf-config';

// PDF.js metadata interface for proper typing
interface PdfJsMetadata {
  Author?: string;
  Subject?: string;
  Keywords?: string;
  CreationDate?: string;
  ModDate?: string;
}

export interface ExtractedArticle {
  title: string;
  content: string;
  pageNumbers: number[];
  startPosition: number;
  endPosition: number;
  wordCount: number;
}

export interface ExtractedImage {
  pageNumber: number;
  position: { x: number; y: number; width: number; height: number };
  description?: string;
}

export interface AdvancedPdfExtraction {
  filename: string;
  title: string;
  date: string;

  // Full content
  rawText: string;
  cleanedText: string;
  structuredText: string;

  // Statistics
  totalWords: number;
  totalCharacters: number;
  readingTimeMinutes: number;

  // Page-by-page breakdown
  pages: Array<{
    pageNumber: number;
    rawText: string;
    cleanedText: string;
    wordCount: number;
    hasImages: boolean;
    extractedImages: ExtractedImage[];
  }>;

  // Structured content
  articles: ExtractedArticle[];
  sections: Array<{
    title: string;
    content: string;
    pageRange: [number, number];
  }>;

  // Metadata
  metadata: {
    author?: string;
    subject?: string;
    keywords?: string[];
    creationDate?: string;
    modifiedDate?: string;
    pageCount: number;
    fileSize?: number;
  };

  // Search optimization
  searchableTerms: string[];
  keyPhrases: string[];
  topics: string[];

  // Processing info
  extractedAt: string;
  processingTimeMs: number;
  extractionVersion: string;
}

class AdvancedPdfTextExtractionService {
  private readonly EXTRACTION_VERSION = '1.0.0';
  private readonly WORDS_PER_MINUTE = 200; // Average reading speed

  /**
   * Extract comprehensive text and structure data from PDF
   */
  async extractAdvancedPdfData(pdfUrl: string, filename: string): Promise<AdvancedPdfExtraction> {
    const startTime = Date.now();

    console.log(`[Advanced PDF Extraction] Starting extraction for: ${filename}`);

    try {
      // Use centralized PDF configuration to prevent worker issues
      const pdf = await PDF_CONFIG.createSafeLoadingTask(pdfUrl).promise;
      const numPages = pdf.numPages;

      // Extract metadata
      const info = await pdf.getMetadata();

      // Extract text from all pages
      const pages: AdvancedPdfExtraction['pages'] = [];
      let rawText = '';

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const pageData = await this.extractPageData(pdf, pageNum);
          pages.push(pageData);
          rawText += pageData.rawText + '\n\n';
        } catch (pageError) {
          console.warn(`[Advanced PDF Extraction] Error extracting page ${pageNum}:`, pageError);
          // Add empty page data to maintain page numbering
          pages.push({
            pageNumber: pageNum,
            rawText: '',
            cleanedText: '',
            wordCount: 0,
            hasImages: false,
            extractedImages: [],
          });
        }
      }

      // Process and clean text
      const cleanedText = this.cleanText(rawText);
      const structuredText = this.structureText(cleanedText);

      // Extract articles and sections
      const articles = this.extractArticles(structuredText, pages);
      const sections = this.extractSections(structuredText, pages);

      // Generate search terms and topics
      const searchableTerms = this.extractSearchableTerms(cleanedText);
      const keyPhrases = this.extractKeyPhrases(cleanedText);
      const topics = this.extractTopics(cleanedText);

      // Calculate statistics
      const totalWords = this.countWords(cleanedText);
      const totalCharacters = cleanedText.length;
      const readingTimeMinutes = Math.ceil(totalWords / this.WORDS_PER_MINUTE);

      // Parse date and title
      const date = this.extractDateFromFilename(filename);
      const title = this.generateTitleFromFilename(filename);

      const processingTime = Date.now() - startTime;

      // Extract metadata from PDF with proper typing
      const metadataInfo = info.info as PdfJsMetadata;
      const extractedKeywords: string[] = this.parseKeywords(metadataInfo?.Keywords) || [];

      const result: AdvancedPdfExtraction = {
        filename,
        title,
        date,
        rawText,
        cleanedText,
        structuredText,
        totalWords,
        totalCharacters,
        readingTimeMinutes,
        pages,
        articles,
        sections,
        metadata: {
          ...(metadataInfo?.Author && { author: metadataInfo.Author }),
          ...(metadataInfo?.Subject && { subject: metadataInfo.Subject }),
          ...(extractedKeywords.length > 0 && { keywords: extractedKeywords }),
          ...(metadataInfo?.CreationDate && { creationDate: metadataInfo.CreationDate }),
          ...(metadataInfo?.ModDate && { modifiedDate: metadataInfo.ModDate }),
          pageCount: numPages,
        },
        searchableTerms,
        keyPhrases,
        topics,
        extractedAt: new Date().toISOString(),
        processingTimeMs: processingTime,
        extractionVersion: this.EXTRACTION_VERSION,
      };
      console.log(
        `[Advanced PDF Extraction] Successfully extracted ${filename} in ${processingTime}ms`,
      );
      console.log(`  - ${totalWords} words across ${numPages} pages`);
      console.log(`  - ${articles.length} articles, ${sections.length} sections`);
      console.log(`  - ${searchableTerms.length} searchable terms`);

      return result;
    } catch (error) {
      console.error(`[Advanced PDF Extraction] Failed to extract ${filename}:`, error);
      throw new Error(
        `Failed to extract PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Extract data from a single PDF page
   */
  private async extractPageData(
    pdf: PDFDocumentProxy,
    pageNum: number,
  ): Promise<AdvancedPdfExtraction['pages'][0]> {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Extract raw text
    const rawText = textContent.items
      .map((item) => {
        if ('str' in item && typeof (item as { str?: string }).str === 'string') {
          return (item as { str: string }).str;
        }
        return '';
      })
      .join(' ');

    // Clean text
    const cleanedText = this.cleanText(rawText);
    const wordCount = this.countWords(cleanedText);

    // Check for images (simplified detection)
    let hasImages = false;
    const extractedImages: ExtractedImage[] = [];

    try {
      const annotations = await page.getAnnotations();
      hasImages = annotations.some((ann) => ann.subtype === 'Image');

      // Note: Actual image extraction would require more complex processing
      // This is a placeholder for image detection
    } catch (error) {
      console.warn(
        `[Advanced PDF Extraction] Error checking for images on page ${pageNum}:`,
        error,
      );
    }

    return {
      pageNumber: pageNum,
      rawText,
      cleanedText,
      wordCount,
      hasImages,
      extractedImages,
    };
  }

  /**
   * Clean and normalize text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:-]/g, '') // Remove special characters but keep punctuation
      .replace(/\s+([.!?])/g, '$1') // Fix spacing around punctuation
      .trim();
  }

  /**
   * Structure text with better paragraph and section breaks
   */
  private structureText(text: string): string {
    return text
      .replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2') // Add paragraph breaks after sentences that start new topics
      .replace(/([a-z])\s+([A-Z][A-Z\s]+[A-Z])\s+/g, '$1\n\n## $2\n\n') // Detect section headers (ALL CAPS)
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
      .trim();
  }

  /**
   * Extract articles from structured text
   */
  private extractArticles(
    structuredText: string,
    pages: AdvancedPdfExtraction['pages'],
  ): ExtractedArticle[] {
    const articles: ExtractedArticle[] = [];

    // Simple article detection based on common patterns
    const articlePatterns = [
      /^##\s+(.+?)(?=\n\n##|\n\n[A-Z]{3,}|$)/gms, // Section headers
      /([A-Z][A-Z\s]{10,})\n\n(.*?)(?=\n\n[A-Z]{3,}|$)/gms, // ALL CAPS headers
    ];

    let articleIndex = 0;
    for (const pattern of articlePatterns) {
      let match;
      while ((match = pattern.exec(structuredText)) !== null) {
        const title = match[1]?.trim() || `Article ${articleIndex + 1}`;
        const content = match[2]?.trim() || match[0]?.trim() || '';

        if (content.length > 50) {
          // Only include substantial content
          articles.push({
            title,
            content,
            pageNumbers: this.findPageNumbers(content, pages),
            startPosition: match.index || 0,
            endPosition: (match.index || 0) + match[0].length,
            wordCount: this.countWords(content),
          });
          articleIndex++;
        }
      }
    }

    return articles;
  }

  /**
   * Extract sections from structured text
   */
  private extractSections(
    structuredText: string,
    pages: AdvancedPdfExtraction['pages'],
  ): Array<{ title: string; content: string; pageRange: [number, number] }> {
    const sections: Array<{ title: string; content: string; pageRange: [number, number] }> = [];

    // Split by major section breaks
    const sectionPattern = /^##\s+(.+?)\n\n(.*?)(?=\n\n##|$)/gms;
    let match;

    while ((match = sectionPattern.exec(structuredText)) !== null) {
      const title = match[1]?.trim() || '';
      const content = match[2]?.trim() || '';

      if (title && content.length > 30) {
        const pageNumbers = this.findPageNumbers(content, pages);
        const pageRange: [number, number] = [
          Math.min(...pageNumbers) || 1,
          Math.max(...pageNumbers) || pages.length,
        ];

        sections.push({
          title,
          content,
          pageRange,
        });
      }
    }

    return sections;
  }

  /**
   * Find which pages contain specific content
   */
  private findPageNumbers(content: string, pages: AdvancedPdfExtraction['pages']): number[] {
    const pageNumbers: number[] = [];
    const contentWords = content.toLowerCase().split(/\s+/).slice(0, 10); // Use first 10 words

    for (const page of pages) {
      const pageWords = page.cleanedText.toLowerCase().split(/\s+/);
      const hasContent = contentWords.some((word) => word.length > 3 && pageWords.includes(word));

      if (hasContent) {
        pageNumbers.push(page.pageNumber);
      }
    }

    return pageNumbers;
  }

  /**
   * Extract searchable terms (remove common words)
   */
  private extractSearchableTerms(text: string): string[] {
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
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'this',
      'that',
      'these',
      'those',
    ]);

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .sort();
  }

  /**
   * Extract key phrases (2-3 word combinations)
   */
  private extractKeyPhrases(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const phrases: string[] = [];

    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length > 6 && !phrases.includes(phrase)) {
        phrases.push(phrase);
      }
    }

    // Extract 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (phrase.length > 10 && !phrases.includes(phrase)) {
        phrases.push(phrase);
      }
    }

    return phrases.slice(0, 50); // Limit to top 50 phrases
  }

  /**
   * Extract topics based on common newsletter themes
   */
  private extractTopics(text: string): string[] {
    const topicKeywords = {
      'Community Events': ['event', 'celebration', 'festival', 'meeting', 'gathering'],
      'Lake Activities': ['lake', 'water', 'swimming', 'boating', 'fishing'],
      'Property Management': ['property', 'maintenance', 'repair', 'roads', 'dues'],
      Environmental: ['environment', 'wildlife', 'conservation', 'nature'],
      Safety: ['safety', 'security', 'emergency', 'fire', 'police'],
      'Board News': ['board', 'director', 'election', 'vote', 'meeting'],
      Recreation: ['recreation', 'sports', 'activities', 'club'],
      Classifieds: ['sale', 'buy', 'sell', 'wanted', 'classifieds'],
    };

    const lowerText = text.toLowerCase();
    const topics: string[] = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const hasKeywords = keywords.some((keyword) => lowerText.includes(keyword));
      if (hasKeywords) {
        topics.push(topic);
      }
    }

    return topics;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Extract date from filename
   */
  private extractDateFromFilename(filename: string): string {
    const patterns = [
      /(\d{4})\.(\d{2})/, // 2024.01
      /(\d{4})\.(summer|winter|spring|fall)/i, // 2024.summer
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'Unknown';
  }

  /**
   * Generate title from filename
   */
  private generateTitleFromFilename(filename: string): string {
    return filename
      .replace('.pdf', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace('Conashaugh', 'Conashaugh Lakes');
  }

  /**
   * Parse keywords from PDF metadata
   */
  private parseKeywords(keywordsString?: string): string[] | undefined {
    if (!keywordsString || typeof keywordsString !== 'string') {
      return undefined;
    }

    return keywordsString
      .split(/[,;]/)
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);
  }
}

// Export singleton instance
export const advancedPdfTextExtractionService = new AdvancedPdfTextExtractionService();
export default advancedPdfTextExtractionService;
