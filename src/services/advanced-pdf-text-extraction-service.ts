/**
 * Advanced PDF Text Extraction Service
 * Enhanced text extraction for database storage and search indexing
 */

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import PDF_CONFIG from '../utils/pdf-config';
import { logger } from '../utils/logger';

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
  thumbnail: string; // Base64 image data (small for display)
  fullSize: string; // Base64 image data (full resolution for download)
  size: number; // File size in bytes
  format: string; // Image format (jpeg, png, etc.)
  isSignificant: boolean; // Whether image meets size/content criteria
}

export interface ExtractionOptions {
  extractImages?: boolean;
  extractText?: boolean;
  extractArticles?: boolean;
  extractTopics?: boolean;
  generateThumbnails?: boolean; // Generate optimized thumbnails for extracted images
  thumbnailMaxSize?: number; // Maximum thumbnail dimension (default: 200)
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
      generateThumbnails: true,
      thumbnailMaxSize: 200,
    },
  ): Promise<AdvancedPdfExtraction> {
    const startTime = Date.now();

    logger.pdf(`Starting extraction for: ${filename}`);

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
          logger.warn(`Error extracting page ${pageNum}:`, pageError);
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
      logger.pdf(`Successfully extracted ${filename} in ${processingTime}ms`);
      logger.pdf(`  - ${totalWords} words across ${numPages} pages`);
      logger.pdf(`  - ${articles.length} articles, ${sections.length} sections`);
      logger.pdf(`  - ${searchableTerms.length} searchable terms`);

      return result;
    } catch (error) {
      logger.error(`Failed to extract ${filename}:`, error);
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
        // Simple approach: Create one high-quality page thumbnail
        const pageThumbnail = await this.createPageThumbnail(page, pageNum, options);
        if (pageThumbnail) {
          extractedImages.push(pageThumbnail);
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
    options: ExtractionOptions = {},
  ): Promise<ExtractedImage[]> {
    const extractedImages: ExtractedImage[] = [];

    try {
      // Access page resources to find image XObjects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resources = (page as any)._pageInfo?.resources;
      if (resources && resources.XObject) {
        const xObjects = resources.XObject;
        let imageIndex = 0;

        for (const [name, obj] of Object.entries(xObjects)) {
          try {
            const xObj = obj as {
              dict?: {
                get?: (key: string) => { name?: string } | number | null;
              };
              getBytes?: () => Promise<Uint8Array>;
            };

            // Check if this is an image XObject
            const subtype = xObj?.dict?.get?.('Subtype') as { name?: string } | undefined;
            if (xObj && xObj.dict && xObj.dict.get && subtype?.name === 'Image') {
              const width = xObj.dict.get('Width') as number;
              const height = xObj.dict.get('Height') as number;
              const bitsPerComponent = (xObj.dict.get('BitsPerComponent') as number) || 8;

              // Only process reasonably sized images
              if (width > 10 && height > 10 && width < 5000 && height < 5000) {
                try {
                  // Get the image data
                  const imageData = xObj.getBytes ? await xObj.getBytes() : null;

                  if (imageData && imageData.length > 0) {
                    // Create canvas to render the image
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (ctx) {
                      canvas.width = width;
                      canvas.height = height;

                      // Try to create image data from raw bytes
                      let extractedImageData: string | null = null;

                      try {
                        // For simple RGB images
                        if (bitsPerComponent === 8 && imageData.length >= width * height * 3) {
                          const imgData = ctx.createImageData(width, height);
                          const data = imgData.data;

                          // Convert RGB to RGBA
                          for (let i = 0; i < width * height; i++) {
                            const srcIdx = i * 3;
                            const dstIdx = i * 4;

                            if (srcIdx + 2 < imageData.length) {
                              data[dstIdx] = imageData[srcIdx] ?? 0; // R
                              data[dstIdx + 1] = imageData[srcIdx + 1] ?? 0; // G
                              data[dstIdx + 2] = imageData[srcIdx + 2] ?? 0; // B
                              data[dstIdx + 3] = 255; // A
                            }
                          }

                          ctx.putImageData(imgData, 0, 0);
                          extractedImageData =
                            options.generateThumbnails !== false
                              ? this.generateOptimizedThumbnail(
                                  canvas,
                                  options.thumbnailMaxSize || 200,
                                  0.7,
                                )
                              : canvas.toDataURL('image/png');
                        }
                        // For JPEG images (try to create blob and convert)
                        else if (imageData.length > 100) {
                          // Try to detect JPEG header
                          if (imageData[0] === 0xff && imageData[1] === 0xd8) {
                            const blob = new Blob([new Uint8Array(imageData)], {
                              type: 'image/jpeg',
                            });
                            const img = new Image();

                            await new Promise((resolve, reject) => {
                              img.onload = () => {
                                ctx.drawImage(img, 0, 0);
                                extractedImageData =
                                  options.generateThumbnails !== false
                                    ? this.generateOptimizedThumbnail(
                                        canvas,
                                        options.thumbnailMaxSize || 200,
                                        0.8,
                                      )
                                    : canvas.toDataURL('image/png');
                                resolve(void 0);
                              };
                              img.onerror = reject;
                              img.src = URL.createObjectURL(blob);
                            });
                          }
                        }
                      } catch (conversionError) {
                        console.warn(`Failed to convert image data for ${name}:`, conversionError);
                      }

                      // Add successfully extracted image
                      if (extractedImageData) {
                        extractedImages.push({
                          pageNumber: pageNum,
                          position: {
                            x: 0,
                            y: 0,
                            width: width,
                            height: height,
                          },
                          description: `Embedded Image "${name}" from page ${pageNum} (${width}x${height})`,
                          thumbnail: extractedImageData,
                          fullSize: extractedImageData, // Same as thumbnail for embedded images
                          size: imageData.length,
                          format: imageData[0] === 0xff && imageData[1] === 0xd8 ? 'jpeg' : 'png',
                          isSignificant: width > 50 && height > 50,
                        });
                        imageIndex++;

                        console.log(
                          `[PDF Image Extraction] Successfully extracted embedded image: ${name} (${width}x${height}) from page ${pageNum}`,
                        );
                      }
                    }
                  }
                } catch (imageProcessingError) {
                  console.warn(`Failed to process embedded image ${name}:`, imageProcessingError);
                }
              }
            }
          } catch (objError) {
            console.warn(`Error processing XObject ${name}:`, objError);
          }
        }

        if (imageIndex > 0) {
          console.log(
            `[PDF Image Extraction] Extracted ${imageIndex} embedded images from page ${pageNum}`,
          );
        }
      }

      // Method 3: Fallback - operator list approach (original method, but enhanced)
      if (extractedImages.length === 0) {
        const operatorList = await page.getOperatorList();
        let imageIndex = 0;

        for (let i = 0; i < operatorList.fnArray.length; i++) {
          const fn = operatorList.fnArray[i];
          const args = operatorList.argsArray[i];

          // Look for image painting operations
          if (fn === 84 || fn === 85) {
            // OPS.paintImageXObject or OPS.paintInlineImageXObject
            try {
              const imageName = args[0];

              // Try to get image from page objects
              const pageObjs = (
                page as unknown as {
                  objs?: { has?: (name: string) => boolean; get?: (name: string) => unknown };
                }
              ).objs;
              if (pageObjs?.has?.(imageName)) {
                const imgObj = pageObjs.get?.(imageName) as
                  | { width?: number; height?: number }
                  | undefined;

                if (
                  imgObj &&
                  imgObj.width &&
                  imgObj.height &&
                  imgObj.width > 10 &&
                  imgObj.height > 10
                ) {
                  // Found a valid image object
                  console.log(
                    `[PDF Image Extraction] Found image object: ${imageName} (${imgObj.width}x${imgObj.height})`,
                  );

                  // Try to extract the actual image by rendering a region of the page
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');

                  if (ctx) {
                    // Set up canvas size based on image dimensions
                    const maxDimension = 400; // Reasonable size for extraction
                    const aspectRatio = imgObj.width / imgObj.height;

                    let canvasWidth, canvasHeight;
                    if (imgObj.width > imgObj.height) {
                      canvasWidth = Math.min(imgObj.width, maxDimension);
                      canvasHeight = Math.round(canvasWidth / aspectRatio);
                    } else {
                      canvasHeight = Math.min(imgObj.height, maxDimension);
                      canvasWidth = Math.round(canvasHeight * aspectRatio);
                    }

                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;

                    try {
                      // Render the page to extract the actual image
                      const viewport = page.getViewport({ scale: 1.0 });
                      const renderContext = {
                        canvasContext: ctx,
                        viewport: viewport,
                      };

                      await page.render(renderContext).promise;

                      // Generate optimized thumbnail from the rendered page
                      const thumbnail =
                        options.generateThumbnails !== false
                          ? this.generateOptimizedThumbnail(
                              canvas,
                              options.thumbnailMaxSize || 200,
                              0.8,
                            )
                          : canvas.toDataURL('image/png');

                      console.log(
                        `[PDF Image Extraction] Successfully extracted embedded image: ${imageName} (${imgObj.width}x${imgObj.height}) from page ${pageNum} - Full page rendered`,
                      );

                      extractedImages.push({
                        pageNumber: pageNum,
                        position: {
                          x: args[1] || 0,
                          y: args[2] || 0,
                          width: imgObj.width,
                          height: imgObj.height,
                        },
                        description: `Embedded Image "${imageName}" detected on page ${pageNum} (${imgObj.width}x${imgObj.height}) - Full page rendered`,
                        thumbnail: thumbnail,
                        fullSize: thumbnail, // Same as thumbnail for this method
                        size: Math.round((imgObj.width * imgObj.height * 3) / 1024), // Estimated size in KB
                        format: 'embedded',
                        isSignificant: imgObj.width > 50 && imgObj.height > 50,
                      });

                      imageIndex++;
                    } catch (renderError) {
                      console.warn(`Failed to render page for image extraction:`, renderError);

                      // Fallback to a more informative placeholder
                      ctx.fillStyle = '#e3f2fd';
                      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                      ctx.strokeStyle = '#1976d2';
                      ctx.lineWidth = 2;
                      ctx.strokeRect(2, 2, canvasWidth - 4, canvasHeight - 4);

                      ctx.fillStyle = '#1976d2';
                      ctx.font = 'bold 14px Arial';
                      ctx.textAlign = 'center';
                      ctx.fillText('EMBEDDED', canvasWidth / 2, canvasHeight / 2 - 15);
                      ctx.fillText('IMAGE', canvasWidth / 2, canvasHeight / 2);
                      ctx.font = '12px Arial';
                      ctx.fillText(
                        `${imgObj.width}×${imgObj.height}`,
                        canvasWidth / 2,
                        canvasHeight / 2 + 15,
                      );

                      const thumbnail =
                        options.generateThumbnails !== false
                          ? this.generateOptimizedThumbnail(
                              canvas,
                              options.thumbnailMaxSize || 200,
                              0.8,
                            )
                          : canvas.toDataURL('image/png');

                      console.log(
                        `[PDF Image Extraction] Fallback placeholder created for embedded image: ${imageName} (${imgObj.width}x${imgObj.height}) from page ${pageNum} - Render failed`,
                      );

                      extractedImages.push({
                        pageNumber: pageNum,
                        position: {
                          x: args[1] || 0,
                          y: args[2] || 0,
                          width: imgObj.width,
                          height: imgObj.height,
                        },
                        description: `Embedded Image "${imageName}" from page ${pageNum} (${imgObj.width}x${imgObj.height}) - Detected but render failed`,
                        thumbnail: thumbnail,
                        fullSize: thumbnail, // Same as thumbnail for fallback
                        size: Math.round((imgObj.width * imgObj.height * 3) / 1024),
                        format: 'embedded',
                        isSignificant: imgObj.width > 50 && imgObj.height > 50,
                      });

                      imageIndex++;
                    }
                  }
                }
              }
            } catch (imageError) {
              console.warn(`Error extracting image from operator list:`, imageError);
            }
          }
        }

        if (imageIndex > 0) {
          console.log(
            `[PDF Image Extraction] Fallback method extracted ${imageIndex} image objects from page ${pageNum}`,
          );
        }
      }
    } catch (error) {
      console.warn(`Error extracting embedded images from page ${pageNum}:`, error);
    }

    return extractedImages;
  }

  /**
   * Create a high-quality render of the full page containing all visual content
   */
  private async createFullPageRender(
    page: PDFPageProxy,
    pageNum: number,
    options: ExtractionOptions = {},
  ): Promise<ExtractedImage | null> {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) return null;

      // Use higher scale for better quality
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render the page with all its content
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Generate optimized thumbnail
      const thumbnail =
        options.generateThumbnails !== false
          ? this.generateOptimizedThumbnail(canvas, options.thumbnailMaxSize || 300, 0.85)
          : canvas.toDataURL('image/png', 0.9);

      // Determine the actual format based on what was generated
      const actualFormat = options.generateThumbnails !== false ? 'jpeg' : 'png';

      // Generate full-size image for download
      const fullSize = canvas.toDataURL('image/jpeg', 0.95);

      return {
        pageNumber: pageNum,
        position: { x: 0, y: 0, width: viewport.width, height: viewport.height },
        description: `Full page render from page ${pageNum} - Contains all visual content including embedded images`,
        thumbnail: thumbnail,
        fullSize: fullSize,
        size: Math.round(fullSize.length * 0.75),
        format: actualFormat,
        isSignificant: true,
      };
    } catch (error) {
      console.warn(`Error creating full page render for page ${pageNum}:`, error);
      return null;
    }
  }

  /**
   * Generate optimized thumbnail from image data or canvas
   */
  private generateOptimizedThumbnail(
    sourceCanvas: HTMLCanvasElement,
    maxSize: number = 200,
    quality: number = 0.7,
  ): string {
    try {
      const sourceWidth = sourceCanvas.width;
      const sourceHeight = sourceCanvas.height;

      // Calculate thumbnail dimensions maintaining aspect ratio
      let thumbnailWidth = sourceWidth;
      let thumbnailHeight = sourceHeight;

      if (sourceWidth > maxSize || sourceHeight > maxSize) {
        const aspectRatio = sourceWidth / sourceHeight;

        if (sourceWidth > sourceHeight) {
          thumbnailWidth = maxSize;
          thumbnailHeight = Math.round(maxSize / aspectRatio);
        } else {
          thumbnailHeight = maxSize;
          thumbnailWidth = Math.round(maxSize * aspectRatio);
        }
      }

      // Create thumbnail canvas
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailCtx = thumbnailCanvas.getContext('2d');

      if (!thumbnailCtx) {
        return sourceCanvas.toDataURL('image/jpeg', quality);
      }

      thumbnailCanvas.width = thumbnailWidth;
      thumbnailCanvas.height = thumbnailHeight;

      // Use better image scaling
      thumbnailCtx.imageSmoothingEnabled = true;
      thumbnailCtx.imageSmoothingQuality = 'medium';

      // Draw scaled image
      thumbnailCtx.drawImage(sourceCanvas, 0, 0, thumbnailWidth, thumbnailHeight);

      // Return optimized thumbnail with specified quality
      return thumbnailCanvas.toDataURL('image/jpeg', quality);
    } catch (error) {
      console.warn('Error generating optimized thumbnail:', error);
      // Fallback to original canvas with lower quality
      return sourceCanvas.toDataURL('image/jpeg', 0.5);
    }
  }

  /**
   * Extract SVG and vector graphics from PDF page
   */
  private async extractSvgGraphics(
    page: PDFPageProxy,
    pageNum: number,
    options: ExtractionOptions = {},
  ): Promise<ExtractedImage[]> {
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

            // Convert to data URL with optimized thumbnail
            const svgDataUrl =
              options.generateThumbnails !== false
                ? this.generateOptimizedThumbnail(canvas, options.thumbnailMaxSize || 200, 0.8)
                : canvas.toDataURL('image/png', 0.9);

            // Determine actual format
            const actualFormat = options.generateThumbnails !== false ? 'jpeg' : 'png';

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
              fullSize: svgDataUrl, // Same as thumbnail for SVG
              size: Math.round(svgDataUrl.length * 0.75),
              format: actualFormat,
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
    options: ExtractionOptions = {},
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
      // Generate optimized thumbnail for display
      const thumbnail =
        options.generateThumbnails !== false
          ? this.generateOptimizedThumbnail(canvas, options.thumbnailMaxSize || 200, 0.8)
          : canvas.toDataURL('image/jpeg', 0.8);

      // Generate full-size image for download (higher quality)
      const fullSize = canvas.toDataURL('image/jpeg', 0.95);

      return {
        pageNumber: pageNum,
        position: { x: 0, y: 0, width: viewport.width, height: viewport.height },
        description: `Page ${pageNum} thumbnail - Complete page visual content`,
        thumbnail: thumbnail,
        fullSize: fullSize,
        size: Math.round(fullSize.length * 0.75),
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
