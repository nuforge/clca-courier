/**
 * Content Extraction Composable
 * Handles PDF text extraction and Firebase syncing operations
 */

// Import Vue and services
import { useQuasar } from 'quasar';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import {
  localMetadataStorageService,
  type ExtractedMetadata,
} from '../services/local-metadata-storage.service';
import { advancedPdfTextExtractionService } from '../services/advanced-pdf-text-extraction-service';

import type { ContentManagementNewsletter, ExtractedContent } from '../types';

export function useContentExtraction() {
  const $q = useQuasar();

  // Stop words for keyword extraction
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
    'between',
    'among',
    'within',
    'without',
    'toward',
    'towards',
    'until',
    'since',
    'while',
    'although',
    'though',
    'because',
    'if',
    'when',
    'where',
    'how',
    'why',
    'what',
    'which',
    'who',
    'whom',
    'whose',
    'that',
    'this',
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
    'mine',
    'yours',
    'hers',
    'ours',
    'theirs',
    'myself',
    'yourself',
    'himself',
    'herself',
    'itself',
    'ourselves',
    'yourselves',
    'themselves',
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
    'committee',
    'president',
    'secretary',
    'treasurer',
    'director',
    'year',
    'month',
    'day',
    'time',
    'date',
    'please',
    'thank',
    'thanks',
    'contact',
    'information',
    'phone',
    'email',
    'address',
    'website',
    'www',
    'http',
    'https',
    'com',
    'org',
    'net',
  ]);

  function extractKeywordsWithCounts(fullText: string): {
    keywords: string[];
    keywordCounts: Record<string, number>;
  } {
    const words = fullText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    // Count word frequencies
    const wordCounts: Record<string, number> = {};
    words.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Sort by frequency and take top 10
    const sortedWords = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const topKeywords = sortedWords.map(([word]) => word);
    const keywordCounts = Object.fromEntries(sortedWords);

    console.log(
      '📊 Top 10 keywords extracted:',
      topKeywords.map((k) => `${k} (${keywordCounts[k]})`).join(', '),
    );

    return { keywords: topKeywords, keywordCounts };
  }

  async function extractAllText(
    newsletters: ContentManagementNewsletter[],
    onProgress?: (current: number, total: number) => void,
  ): Promise<void> {
    const newslettersToProcess = newsletters.filter((n) => !n.searchableText);

    if (newslettersToProcess.length === 0) {
      $q.notify({
        type: 'info',
        message: 'All newsletters already have extracted metadata',
        position: 'top',
      });
      return;
    }

    $q.notify({
      type: 'info',
      message: `Starting text extraction for ${newslettersToProcess.length} newsletters...`,
      position: 'top',
    });

    let processed = 0;
    let failed = 0;

    for (const newsletter of newslettersToProcess) {
      try {
        console.log(`Extracting text from ${newsletter.filename}...`);
        onProgress?.(processed + 1, newslettersToProcess.length);

        const pdfUrl = newsletter.downloadUrl?.startsWith('http')
          ? newsletter.downloadUrl
          : `${window.location.origin}${newsletter.downloadUrl || `/issues/${newsletter.filename}`}`;

        const extractionResult = await advancedPdfTextExtractionService.extractAdvancedPdfData(
          pdfUrl,
          newsletter.filename,
          {
            extractImages: false,
            extractText: true,
            extractArticles: false,
            extractTopics: false,
            generateThumbnails: false,
          },
        );

        // Store the extracted data locally in IndexedDB
        const keywordAnalysis = extractKeywordsWithCounts(extractionResult.cleanedText);

        const extractedMetadata: ExtractedMetadata = {
          filename: newsletter.filename,
          newsletterId: newsletter.id,
          searchableText: extractionResult.cleanedText,
          wordCount: extractionResult.totalWords,
          readingTimeMinutes: extractionResult.readingTimeMinutes,
          textExtractionVersion: extractionResult.extractionVersion,
          textExtractedAt: extractionResult.extractedAt,
          keywordCounts: keywordAnalysis.keywordCounts,
          extractedAt: new Date().toISOString(),
          status: 'pending',
        };

        await localMetadataStorageService.storeExtractedMetadata(extractedMetadata);

        console.log(
          `📊 Top keywords for ${newsletter.filename}:`,
          Object.entries(keywordAnalysis.keywordCounts)
            .slice(0, 5)
            .map(([word, count]) => `${word} (${count})`)
            .join(', '),
        );

        processed++;
        console.log(
          `✅ Extracted text from ${newsletter.filename} (${processed}/${newslettersToProcess.length})`,
        );
      } catch (error) {
        failed++;
        console.error(`❌ Failed to extract text from ${newsletter.filename}:`, error);
      }
    }

    $q.notify({
      type: 'positive',
      message: `Text extraction completed`,
      caption: `Processed: ${processed}, Failed: ${failed}. Data stored locally.`,
      position: 'top',
    });
  }

  async function syncLocalMetadataToFirebase(
    onProgress?: (current: number, total: number) => void,
  ): Promise<void> {
    const pendingMetadata = await localMetadataStorageService.getPendingMetadata();

    if (pendingMetadata.length === 0) {
      $q.notify({
        type: 'info',
        message: 'No pending metadata to sync',
        position: 'top',
      });
      return;
    }

    let synced = 0;
    let failed = 0;

    for (const metadata of pendingMetadata) {
      try {
        onProgress?.(synced + failed + 1, pendingMetadata.length);

        const updates = {
          searchableText: metadata.searchableText,
          wordCount: metadata.wordCount,
          readingTimeMinutes: metadata.readingTimeMinutes,
          textExtractionVersion: metadata.textExtractionVersion,
          textExtractedAt: metadata.textExtractedAt,
          keywordCounts: metadata.keywordCounts,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin-local-sync',
        };

        const docRef = doc(firestore, 'newsletters', metadata.newsletterId);
        await updateDoc(docRef, updates);

        await localMetadataStorageService.markAsSynced(metadata.newsletterId);
        synced++;

        console.log(`✅ Synced metadata for ${metadata.filename}`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await localMetadataStorageService.markAsError(metadata.newsletterId, errorMessage);
        console.error(`❌ Failed to sync ${metadata.filename}:`, error);
      }
    }

    $q.notify({
      type: synced > 0 ? 'positive' : 'negative',
      message: `Sync completed`,
      caption: `Synced: ${synced}, Failed: ${failed}`,
      position: 'top',
    });
  }

  async function clearLocalMetadata(): Promise<void> {
    try {
      await localMetadataStorageService.clearAllMetadata();

      $q.notify({
        type: 'positive',
        message: 'Local metadata cleared',
        position: 'top',
      });
    } catch (error) {
      console.error('Failed to clear local metadata:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to clear local metadata',
        caption: error instanceof Error ? error.message : 'Unknown error',
        position: 'top',
      });
    }
  }

  async function extractContentForFile(
    newsletter: ContentManagementNewsletter,
  ): Promise<ExtractedContent> {
    const pdfUrl = newsletter.downloadUrl?.startsWith('http')
      ? newsletter.downloadUrl
      : `${window.location.origin}${newsletter.downloadUrl || `/issues/${newsletter.filename}`}`;

    const extractionResult = await advancedPdfTextExtractionService.extractAdvancedPdfData(
      pdfUrl,
      newsletter.filename,
      {
        extractImages: false,
        extractText: true,
        extractArticles: true,
        extractTopics: true,
        generateThumbnails: false,
      },
    );

    const keywordAnalysis = extractKeywordsWithCounts(extractionResult.cleanedText);

    return {
      textContent: extractionResult.cleanedText,
      textPreview: extractionResult.cleanedText.substring(0, 500),
      wordCount: extractionResult.totalWords,
      suggestedTags: extractionResult.searchableTerms?.slice(0, 10) || [],
      topics: extractionResult.topics?.slice(0, 10) || [],
      keyTerms: keywordAnalysis.keywords,
      keywordCounts: keywordAnalysis.keywordCounts,
      articles:
        extractionResult.articles?.map(
          (article: {
            title: string;
            content: string;
            pageNumbers: number[];
            wordCount: number;
          }) => ({
            title: article.title,
            content: article.content,
            pageNumbers: article.pageNumbers,
            wordCount: article.wordCount,
          }),
        ) || [],
    };
  }

  return {
    extractAllText,
    syncLocalMetadataToFirebase,
    clearLocalMetadata,
    extractContentForFile,
    extractKeywordsWithCounts,
  };
}
