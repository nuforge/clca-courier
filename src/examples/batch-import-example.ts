/**
 * Batch Import Example
 * Demonstrates how to use the batch import system with your JSON data
 */

import { BatchImportService, type ImportOptions } from '../services/batch-import.service';
import { BatchContentTransformer, type ExtractedArticle } from '../utils/batch-content-transformer';
import type { BatchProcessingItem } from '../utils/batch-content-transformer';
import type { Timestamp } from 'firebase/firestore';

/**
 * Example: Import your batch processing data
 */
export async function importBatchDataExample() {
  // Load your JSON data (this would come from your file)
  const jsonData: BatchProcessingItem[] = [
    // Your batch processing data would go here
    // This is the structure from your batch_processing_20250912_215805.json file
  ];

  // Configure import options
  const importOptions: ImportOptions = {
    importArticles: true,        // Extract individual articles
    importNewsletter: false,     // Don't import newsletter as single item
    skipExisting: true,          // Skip if content already exists
    authorId: 'system-import',   // Or use current user's ID
    authorName: 'System Import'
  };

  try {
    // Get preview of what will be imported
    const preview = BatchImportService.getImportPreview(jsonData);
    console.log('Import Preview:', preview);

    // Perform the import
    const result = await BatchImportService.importFromJson(jsonData, importOptions);

    console.log('Import Results:', {
      articlesImported: result.articlesImported,
      newslettersImported: result.newslettersImported,
      totalErrors: result.errors.length,
      processingTime: result.processingTime
    });

    if (result.errors.length > 0) {
      console.warn('Import completed with errors:', result.errors);
    }

    return result;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

/**
 * Example: Extract articles from a single batch item
 */
export function extractArticlesExample(batchItem: BatchProcessingItem) {
  // Extract individual articles from the newsletter
  const articles = BatchContentTransformer.extractArticles(batchItem);

  console.log(`Found ${articles.length} articles in ${batchItem.file_name}:`);
  articles.forEach((article, index) => {
    console.log(`${index + 1}. ${article.title} (${article.content.length} chars)`);
  });

  return articles;
}

/**
 * Example: Transform a single article to ContentDoc format
 */
export function transformArticleExample(
  article: ExtractedArticle,
  batchItem: BatchProcessingItem,
  authorId: string,
  authorName: string
) {
  const contentDoc = BatchContentTransformer.transformToContentDoc(
    article,
    batchItem,
    authorId,
    authorName,
    {
      // Add date feature if the article has date information
      'feat:date': {
        start: new Date(batchItem.processed_at) as unknown as Timestamp,
        isAllDay: true
      }
    }
  );

  console.log('Transformed ContentDoc:', {
    title: contentDoc.title,
    tags: contentDoc.tags,
    features: Object.keys(contentDoc.features),
    status: contentDoc.status
  });

  return contentDoc;
}

/**
 * Example: Use in a Vue component
 */
export const vueComponentExample = `
<template>
  <div>
    <!-- Import Button -->
    <q-btn
      color="primary"
      @click="showImportDialog = true"
      icon="upload_file"
    >
      Import Batch Data
    </q-btn>

    <!-- Import Dialog -->
    <BatchImportDialog
      v-model="showImportDialog"
      @import-complete="handleImportComplete"
    />

    <!-- Results Display -->
    <div v-if="importResult" class="q-mt-md">
      <q-card>
        <q-card-section>
          <div class="text-h6">Import Results</div>
          <div>Articles: {{ importResult.articlesImported }}</div>
          <div>Newsletters: {{ importResult.newslettersImported }}</div>
          <div>Errors: {{ importResult.errors.length }}</div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BatchImportDialog from '@/components/admin/BatchImportDialog.vue';

const showImportDialog = ref(false);
const importResult = ref(null);

const handleImportComplete = (result) => {
  importResult.value = result;
  showImportDialog.value = false;
};
</script>
`;

/**
 * Example: Direct file import
 */
export async function importFromFileExample(file: File) {
  const importOptions: ImportOptions = {
    importArticles: true,
    importNewsletter: true,
    skipExisting: true
  };

  try {
    const result = await BatchImportService.importFromFile(file, importOptions);
    return result;
  } catch (error) {
    console.error('File import failed:', error);
    throw error;
  }
}
