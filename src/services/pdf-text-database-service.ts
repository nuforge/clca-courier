/**
 * PDF Text Database Service
 * Manages storage and retrieval of extracted PDF text data using IndexedDB
 */

import type { AdvancedPdfExtraction } from './advanced-pdf-text-extraction-service';

interface PdfTextRecord {
  id: string; // filename
  data: AdvancedPdfExtraction;
  createdAt: string;
  updatedAt: string;
  version: string;
}

interface SearchQuery {
  text?: string;
  topics?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  minWords?: number;
  maxWords?: number;
}

interface SearchResult {
  record: PdfTextRecord;
  score: number;
  matches: Array<{
    type: 'title' | 'content' | 'article' | 'section';
    text: string;
    context: string;
  }>;
}

class PdfTextDatabaseService {
  private dbName = 'PDFTextDatabase';
  private dbVersion = 1;
  private storeName = 'pdfTexts';
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open PDF text database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[PDF Text Database] Database initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for PDF text data
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });

          // Create indexes for searching
          store.createIndex('filename', 'data.filename', { unique: false });
          store.createIndex('date', 'data.date', { unique: false });
          store.createIndex('topics', 'data.topics', { unique: false, multiEntry: true });
          store.createIndex('searchableTerms', 'data.searchableTerms', {
            unique: false,
            multiEntry: true,
          });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('wordCount', 'data.totalWords', { unique: false });

          console.log('[PDF Text Database] Object store created with indexes');
        }
      };
    });
  }

  /**
   * Store extracted PDF text data
   */
  async storePdfText(extractedData: AdvancedPdfExtraction): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const record: PdfTextRecord = {
        id: extractedData.filename,
        data: extractedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: extractedData.extractionVersion,
      };

      const request = store.put(record);

      request.onsuccess = () => {
        console.log(`[PDF Text Database] Stored: ${extractedData.filename}`);
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to store PDF text: ${extractedData.filename}`));
      };
    });
  }

  /**
   * Retrieve PDF text data by filename
   */
  async getPdfText(filename: string): Promise<PdfTextRecord | null> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(filename);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to retrieve PDF text: ${filename}`));
      };
    });
  }

  /**
   * Get all stored PDF text records
   */
  async getAllPdfTexts(): Promise<PdfTextRecord[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve all PDF texts'));
      };
    });
  }

  /**
   * Search PDF text records
   */
  async searchPdfTexts(query: SearchQuery): Promise<SearchResult[]> {
    const allRecords = await this.getAllPdfTexts();
    const results: SearchResult[] = [];

    for (const record of allRecords) {
      const matches = this.findMatches(record, query);
      if (matches.length > 0) {
        const score = this.calculateScore(record, query, matches);
        results.push({
          record,
          score,
          matches,
        });
      }
    }

    // Sort by score (descending)
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Find text matches in a PDF record
   */
  private findMatches(
    record: PdfTextRecord,
    query: SearchQuery,
  ): Array<{ type: 'title' | 'content' | 'article' | 'section'; text: string; context: string }> {
    const matches: Array<{
      type: 'title' | 'content' | 'article' | 'section';
      text: string;
      context: string;
    }> = [];
    const { data } = record;

    if (!query.text) {
      return matches;
    }

    const searchTerm = query.text.toLowerCase();

    // Search in title
    if (data.title.toLowerCase().includes(searchTerm)) {
      matches.push({
        type: 'title',
        text: data.title,
        context: data.title,
      });
    }

    // Search in main content
    const contentIndex = data.cleanedText.toLowerCase().indexOf(searchTerm);
    if (contentIndex !== -1) {
      const contextStart = Math.max(0, contentIndex - 100);
      const contextEnd = Math.min(data.cleanedText.length, contentIndex + searchTerm.length + 100);
      const context = data.cleanedText.substring(contextStart, contextEnd);

      matches.push({
        type: 'content',
        text: searchTerm,
        context: `...${context}...`,
      });
    }

    // Search in articles
    for (const article of data.articles) {
      if (
        article.title.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm)
      ) {
        const articleContentIndex = article.content.toLowerCase().indexOf(searchTerm);
        let context = article.title;

        if (articleContentIndex !== -1) {
          const contextStart = Math.max(0, articleContentIndex - 50);
          const contextEnd = Math.min(
            article.content.length,
            articleContentIndex + searchTerm.length + 50,
          );
          context = `${article.title}: ...${article.content.substring(contextStart, contextEnd)}...`;
        }

        matches.push({
          type: 'article',
          text: article.title,
          context,
        });
      }
    }

    // Search in sections
    for (const section of data.sections) {
      if (
        section.title.toLowerCase().includes(searchTerm) ||
        section.content.toLowerCase().includes(searchTerm)
      ) {
        const sectionContentIndex = section.content.toLowerCase().indexOf(searchTerm);
        let context = section.title;

        if (sectionContentIndex !== -1) {
          const contextStart = Math.max(0, sectionContentIndex - 50);
          const contextEnd = Math.min(
            section.content.length,
            sectionContentIndex + searchTerm.length + 50,
          );
          context = `${section.title}: ...${section.content.substring(contextStart, contextEnd)}...`;
        }

        matches.push({
          type: 'section',
          text: section.title,
          context,
        });
      }
    }

    return matches;
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateScore(
    record: PdfTextRecord,
    query: SearchQuery,
    matches: Array<{ type: string; text: string; context: string }>,
  ): number {
    let score = 0;
    const { data } = record;

    // Base score from number of matches
    score += matches.length * 10;

    // Boost score based on match types
    for (const match of matches) {
      switch (match.type) {
        case 'title':
          score += 50; // Title matches are most important
          break;
        case 'article':
          score += 30; // Article matches are valuable
          break;
        case 'section':
          score += 20; // Section matches are good
          break;
        case 'content':
          score += 10; // Content matches are baseline
          break;
      }
    }

    // Apply date range filter
    if (query.dateRange) {
      const pdfDate = new Date(data.date);
      const fromDate = new Date(query.dateRange.from);
      const toDate = new Date(query.dateRange.to);

      if (pdfDate < fromDate || pdfDate > toDate) {
        return 0; // Exclude if outside date range
      }
    }

    // Apply word count filters
    if (query.minWords && data.totalWords < query.minWords) {
      return 0;
    }
    if (query.maxWords && data.totalWords > query.maxWords) {
      return 0;
    }

    // Apply topic filter
    if (query.topics && query.topics.length > 0) {
      const hasMatchingTopic = query.topics.some((topic) => data.topics.includes(topic));
      if (!hasMatchingTopic) {
        score *= 0.5; // Reduce score if no matching topics
      } else {
        score += 25; // Boost score for matching topics
      }
    }

    return score;
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalRecords: number;
    totalWords: number;
    totalCharacters: number;
    oldestRecord: string;
    newestRecord: string;
    averageWordsPerRecord: number;
    topTopics: Array<{ topic: string; count: number }>;
  }> {
    const records = await this.getAllPdfTexts();

    if (records.length === 0) {
      return {
        totalRecords: 0,
        totalWords: 0,
        totalCharacters: 0,
        oldestRecord: '',
        newestRecord: '',
        averageWordsPerRecord: 0,
        topTopics: [],
      };
    }

    const totalWords = records.reduce((sum, record) => sum + record.data.totalWords, 0);
    const totalCharacters = records.reduce((sum, record) => sum + record.data.totalCharacters, 0);

    // Find oldest and newest records
    const sortedByDate = records.sort(
      (a, b) => new Date(a.data.date).getTime() - new Date(b.data.date).getTime(),
    );

    // Count topics
    const topicCounts = new Map<string, number>();
    for (const record of records) {
      for (const topic of record.data.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }

    const topTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRecords: records.length,
      totalWords,
      totalCharacters,
      oldestRecord: sortedByDate[0]?.data.filename || '',
      newestRecord: sortedByDate[sortedByDate.length - 1]?.data.filename || '',
      averageWordsPerRecord: Math.round(totalWords / records.length),
      topTopics,
    };
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[PDF Text Database] All data cleared');
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear database'));
      };
    });
  }

  /**
   * Export all data as JSON
   */
  async exportData(): Promise<string> {
    const records = await this.getAllPdfTexts();
    return JSON.stringify(records, null, 2);
  }

  /**
   * Import data from JSON
   */
  async importData(jsonData: string): Promise<number> {
    try {
      const records: PdfTextRecord[] = JSON.parse(jsonData);
      let importedCount = 0;

      for (const record of records) {
        try {
          await this.storePdfText(record.data);
          importedCount++;
        } catch (error) {
          console.warn(`[PDF Text Database] Failed to import record: ${record.id}`, error);
        }
      }

      console.log(`[PDF Text Database] Imported ${importedCount} records`);
      return importedCount;
    } catch (error) {
      throw new Error(
        `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Export singleton instance
export const pdfTextDatabaseService = new PdfTextDatabaseService();
export default pdfTextDatabaseService;
