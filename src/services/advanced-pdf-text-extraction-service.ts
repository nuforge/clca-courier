/**
 * Advanced PDF Text Extraction Service
 * Enhanced text extraction for database storage and search indexing
 */

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
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
  // Enhanced properties for intelligent article detection
  associatedImages?: number; // Number of associated images
  significance?: number; // Calculated significance score (0-100)
  type?: string; // Article detection pattern type
}

export interface ExtractedImage {
  pageNumber: number;
  position: { x: number; y: number; width: number; height: number };
  description?: string;
  thumbnail: string; // Base64 image data
  size: number; // File size in bytes
  format: string; // Image format (jpeg, png, etc.)
  isSignificant: boolean; // Whether image meets size/content criteria
}

export interface ExtractionOptions {
  extractImages?: boolean;
  extractText?: boolean;
  extractArticles?: boolean;
  extractTopics?: boolean;
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
  async extractAdvancedPdfData(
    pdfUrl: string,
    filename: string,
    options: ExtractionOptions = {
      extractImages: true,
      extractText: true,
      extractArticles: true,
      extractTopics: true,
    },
  ): Promise<AdvancedPdfExtraction> {
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
          const pageData = await this.extractPageData(pdf, pageNum, options);
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

      // Extract articles and sections (only if requested)
      const articles =
        options.extractArticles !== false ? this.extractArticles(structuredText, pages) : [];
      const sections = this.extractSections(structuredText, pages);

      // Generate search terms and topics (only if requested)
      const searchableTerms = this.extractSearchableTerms(cleanedText);
      const keyPhrases = this.extractKeyPhrases(cleanedText);
      const topics = options.extractTopics !== false ? this.extractTopics(cleanedText) : [];

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
    options: ExtractionOptions = {},
  ): Promise<AdvancedPdfExtraction['pages'][0]> {
    const page = await pdf.getPage(pageNum);

    // Extract raw text (only if requested)
    let rawText = '';
    let cleanedText = '';
    let wordCount = 0;

    if (options.extractText !== false) {
      const textContent = await page.getTextContent();
      rawText = textContent.items
        .map((item) => {
          if ('str' in item && typeof (item as { str?: string }).str === 'string') {
            return (item as { str: string }).str;
          }
          return '';
        })
        .join(' ');

      // Clean text
      cleanedText = this.cleanText(rawText);
      wordCount = this.countWords(cleanedText);
    }

    // Extract embedded images and SVG content from page
    let hasImages = false;
    const extractedImages: ExtractedImage[] = [];

    // Only extract images if requested
    if (options.extractImages !== false) {
      try {
        // Method 1: Extract actual embedded images using PDF.js operator list
        const embeddedImages = await this.extractEmbeddedImages(page, pageNum);
        extractedImages.push(...embeddedImages);

        // Method 2: Extract SVG/vector graphics
        const svgImages = await this.extractSvgGraphics(page, pageNum);
        extractedImages.push(...svgImages);

        // Method 3: Page thumbnail as fallback (keep your current approach)
        if (extractedImages.length === 0 && cleanedText.length > 100) {
          const pageThumbnail = await this.createPageThumbnail(page, pageNum);
          if (pageThumbnail) {
            extractedImages.push(pageThumbnail);
          }
        }

        hasImages = extractedImages.length > 0;
      } catch (error) {
        console.warn(
          `[Advanced PDF Extraction] Error extracting images from page ${pageNum}:`,
          error,
        );
      }
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
   * Extract articles from structured text with enhanced intelligence
   */
  private extractArticles(
    structuredText: string,
    pages: AdvancedPdfExtraction['pages'],
  ): ExtractedArticle[] {
    const articles: ExtractedArticle[] = [];

    // Enhanced article detection patterns
    const articlePatterns = [
      // Pattern 1: Section headers with ## markup
      {
        pattern: /^##\s+(.+?)\n\n(.*?)(?=\n\n##|\n\n[A-Z]{3,}|$)/gms,
        titleIndex: 1,
        contentIndex: 2,
        type: 'section',
      },
      // Pattern 2: ALL CAPS headers
      {
        pattern: /([A-Z][A-Z\s]{8,}[A-Z])\n\n(.*?)(?=\n\n[A-Z]{3,}|$)/gms,
        titleIndex: 1,
        contentIndex: 2,
        type: 'caps_header',
      },
      // Pattern 3: Bold-style headers (simulated with repeated chars or spacing)
      {
        pattern: /([A-Z][a-zA-Z\s]{5,}[a-z])\n\n((?:[A-Z][a-z].*?\n.*?){2,})(?=\n\n[A-Z]|$)/gms,
        titleIndex: 1,
        contentIndex: 2,
        type: 'bold_header',
      },
      // Pattern 4: Paragraph-based articles (multiple sentences)
      {
        pattern: /(.*?[.!?])\s*\n\n((?:.*?[.!?]\s*){3,})(?=\n\n|$)/gms,
        titleIndex: 1,
        contentIndex: 2,
        type: 'paragraph',
      },
    ];

    let articleIndex = 0;
    for (const patternConfig of articlePatterns) {
      let match;
      while ((match = patternConfig.pattern.exec(structuredText)) !== null) {
        const rawTitle = match[patternConfig.titleIndex]?.trim() || '';
        const rawContent = match[patternConfig.contentIndex]?.trim() || '';

        // Clean and validate title
        const title = this.cleanArticleTitle(rawTitle) || `Article ${articleIndex + 1}`;
        const content = this.cleanArticleContent(rawContent);

        // Only include substantial content
        if (content.length > 100 && title.length > 3) {
          const pageNumbers = this.findPageNumbers(content, pages);
          const associatedImages = this.findAssociatedImages(pageNumbers, pages);

          // Determine article significance based on content quality
          const significance = this.calculateArticleSignificance(title, content, associatedImages);

          articles.push({
            title,
            content,
            pageNumbers,
            startPosition: match.index || 0,
            endPosition: (match.index || 0) + match[0].length,
            wordCount: this.countWords(content),
            // Extended properties for enhanced article detection
            associatedImages: associatedImages.length,
            significance,
            type: patternConfig.type,
          });
          articleIndex++;
        }
      }
    }

    // Sort articles by significance and position
    return articles.sort((a, b) => (b.significance || 0) - (a.significance || 0)).slice(0, 20); // Limit to top 20 most significant articles
  }

  /**
   * Clean article title
   */
  private cleanArticleTitle(title: string): string {
    return title
      .replace(/^#+\s*/, '') // Remove markdown headers
      .replace(/[^\w\s-.,!?]/g, ' ') // Remove special chars except basic punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .slice(0, 100); // Limit length
  }

  /**
   * Clean article content
   */
  private cleanArticleContent(content: string): string {
    return content
      .replace(/\n+/g, ' ') // Convert newlines to spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s-.,!?()]/g, ' ') // Remove problematic special chars
      .trim();
  }

  /**
   * Find images associated with specific pages
   */
  private findAssociatedImages(
    pageNumbers: number[],
    pages: AdvancedPdfExtraction['pages'],
  ): ExtractedImage[] {
    const associatedImages: ExtractedImage[] = [];

    for (const pageNum of pageNumbers) {
      const page = pages.find((p) => p.pageNumber === pageNum);
      if (page && page.extractedImages) {
        associatedImages.push(...page.extractedImages.filter((img) => img.isSignificant));
      }
    }

    return associatedImages;
  }

  /**
   * Calculate article significance score
   */
  private calculateArticleSignificance(
    title: string,
    content: string,
    images: ExtractedImage[],
  ): number {
    let score = 0;

    // Title quality (0-30 points)
    if (title.length > 10) score += 10;
    if (title.match(/[A-Z][a-z]/)) score += 10; // Proper capitalization
    if (!title.match(/^(Article|Section|Page)/i)) score += 10; // Not generic

    // Content quality (0-40 points)
    const wordCount = this.countWords(content);
    if (wordCount > 50) score += 10;
    if (wordCount > 150) score += 10;
    if ((content.match(/[.!?]/g) || []).length > 2) score += 10; // Multiple sentences
    if (content.toLowerCase().includes('clca') || content.toLowerCase().includes('conashaugh'))
      score += 10;

    // Image association (0-30 points)
    if (images.length > 0) score += 15;
    if (images.length > 2) score += 15;

    return score;
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
   * Extract embedded images from PDF page using PDF.js operator list
   */
  private async extractEmbeddedImages(
    page: PDFPageProxy,
    pageNum: number,
  ): Promise<ExtractedImage[]> {
    const extractedImages: ExtractedImage[] = [];

    try {
      // Get page operator list to find image operations
      const operatorList = await page.getOperatorList();

      let imageIndex = 0;
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];
        const args = operatorList.argsArray[i];

        // Look for image painting operations (Do operator with image objects)
        if (fn === 84 || fn === 85) {
          // OPS.paintImageXObject or OPS.paintInlineImageXObject
          try {
            const imageName = args[0];

            // Try to extract the actual image data
            let extractedImageData: string | null = null;
            let width = 0,
              height = 0;

            // Check if we can get the image from page resources
            if (page.objs && page.objs.has && page.objs.has(imageName)) {
              const imgObj = page.objs.get(imageName);
              if (imgObj && imgObj.data && imgObj.width && imgObj.height) {
                // Only process if we have actual image data and reasonable dimensions
                if (imgObj.width > 10 && imgObj.height > 10) {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');

                  if (ctx) {
                    canvas.width = imgObj.width;
                    canvas.height = imgObj.height;
                    width = imgObj.width;
                    height = imgObj.height;

                    try {
                      // Create ImageData and put it on canvas
                      const imageData = ctx.createImageData(width, height);
                      imageData.data.set(imgObj.data);
                      ctx.putImageData(imageData, 0, 0);

                      extractedImageData = canvas.toDataURL('image/png');
                    } catch (imageProcessingError) {
                      console.warn(
                        `Failed to process image data for ${imageName}:`,
                        imageProcessingError,
                      );
                    }
                  }
                }
              }
            }

            // Only add to results if we successfully extracted actual image data
            if (extractedImageData && width > 10 && height > 10) {
              extractedImages.push({
                pageNumber: pageNum,
                position: {
                  x: args[1] || 0,
                  y: args[2] || 0,
                  width: width,
                  height: height,
                },
                description: `Embedded Image ${imageIndex + 1} from page ${pageNum}`,
                thumbnail: extractedImageData,
                size: Math.round(extractedImageData.length * 0.75),
                format: 'png',
                isSignificant: width > 50 && height > 50, // Consider significant if reasonably sized
              });
              imageIndex++;
            }
          } catch (imageError) {
            console.warn(
              `Error extracting embedded image ${imageIndex} from page ${pageNum}:`,
              imageError,
            );
          }
        }
      }
    } catch (error) {
      console.warn(`Error accessing operator list for page ${pageNum}:`, error);
    }

    return extractedImages;
  }

  /**
   * Extract SVG and vector graphics from PDF page
   */
  private async extractSvgGraphics(page: PDFPageProxy, pageNum: number): Promise<ExtractedImage[]> {
    const extractedImages: ExtractedImage[] = [];

    try {
      // Get page content to analyze for vector graphics
      const operatorList = await page.getOperatorList();

      let hasPathOperations = false;
      let pathCount = 0;

      // Look for vector drawing operations
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];

        // Look for path operations (moveTo, lineTo, curveTo, etc.)
        if (fn && fn >= 60 && fn <= 75) {
          // Range of path-related operations in PDF.js
          hasPathOperations = true;
          pathCount++;
        }
      }

      // If we found significant vector content, create an SVG representation
      if (hasPathOperations && pathCount > 5) {
        try {
          // Create a canvas to render the page and extract as SVG-style image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (ctx) {
            const scale = 1.0;
            const scaledViewport = page.getViewport({ scale });
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            // Render the page
            const renderContext = {
              canvasContext: ctx,
              viewport: scaledViewport,
            };

            await page.render(renderContext).promise;

            // Convert to data URL (we'll treat this as our "SVG" extraction)
            const svgDataUrl = canvas.toDataURL('image/png', 0.9);

            extractedImages.push({
              pageNumber: pageNum,
              position: {
                x: 0,
                y: 0,
                width: scaledViewport.width,
                height: scaledViewport.height,
              },
              description: `Vector Graphics from page ${pageNum} (${pathCount} paths)`,
              thumbnail: svgDataUrl,
              size: Math.round(svgDataUrl.length * 0.75),
              format: 'svg', // Conceptually SVG, but stored as PNG
              isSignificant: pathCount > 10,
            });
          }
        } catch (renderError) {
          console.warn(`Error rendering SVG content from page ${pageNum}:`, renderError);
        }
      }
    } catch (error) {
      console.warn(`Error extracting SVG graphics from page ${pageNum}:`, error);
    }

    return extractedImages;
  }

  /**
   * Create page thumbnail as fallback image extraction
   */
  private async createPageThumbnail(
    page: PDFPageProxy,
    pageNum: number,
  ): Promise<ExtractedImage | null> {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) return null;

      // Set up canvas with reasonable size
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Create a thumbnail of the whole page
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);

      return {
        pageNumber: pageNum,
        position: { x: 0, y: 0, width: viewport.width, height: viewport.height },
        description: `Page ${pageNum} thumbnail`,
        thumbnail: thumbnail,
        size: Math.round(thumbnail.length * 0.75),
        format: 'jpeg',
        isSignificant: true,
      };
    } catch (error) {
      console.warn(`Error creating page thumbnail for page ${pageNum}:`, error);
      return null;
    }
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
