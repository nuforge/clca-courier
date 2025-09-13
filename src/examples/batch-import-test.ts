/**
 * Batch Import Test
 * Test the complete workflow from batch data to displayed content
 */

import { BatchContentTransformer } from '../utils/batch-content-transformer';
import type { BatchProcessingItem } from '../utils/batch-content-transformer';

// Sample data based on your batch processing structure
const sampleBatchItem: BatchProcessingItem = {
  file_path: "input\\2014.summer-conashaugh-courier.pdf",
  file_name: "2014.summer-conashaugh-courier.pdf",
  processed_at: "2025-09-12T21:51:26.289314",
  environment: "dev",
  model_used: "en_core_web_sm",
  content: {
    full_text: "'Vandal' Mystery Solved!\n\nWhen the snow finally melted in April, we began receiving calls from homeowners on the lake. There was a concern regarding what appeared to be vandalism to trees in that area. An inspection of the trees revealed at least one very busy beaver was at work over the winter cutting down trees for its lodge.\n\nSAVE ThE DATE!\n\nAnnual Meeting Saturday Set For September 27, 2014\n\nThe Summer Issue of the Conashaugh Courier is our prelude to the Community's Annual Meeting. It includes information regarding the 2014/15 proposed budget and a copy of the CLCA reserve schedule along with minutes from last year's Annual Meeting.",
    title: "'Vandal' Mystery Solved!",
    author: "CLCA Staff",
    word_count: 6792,
    character_count: 40871
  },
  structure: {
    sections: [
      {
        type: "section_header",
        text: "'Vandal' Mystery Solved!",
        start: 0,
        end: 6
      },
      {
        type: "text",
        text: "When the snow finally melted in April, we began receiving calls from homeowners on the lake. There was a concern regarding what appeared to be vandalism to trees in that area. An inspection of the trees revealed at least one very busy beaver was at work over the winter cutting down trees for its lodge.",
        start: 7,
        end: 120
      },
      {
        type: "section_header",
        text: "SAVE ThE DATE!",
        start: 121,
        end: 125
      },
      {
        type: "section_header",
        text: "Annual Meeting Saturday Set For September 27, 2014",
        start: 126,
        end: 135
      },
      {
        type: "text",
        text: "The Summer Issue of the Conashaugh Courier is our prelude to the Community's Annual Meeting. It includes information regarding the 2014/15 proposed budget and a copy of the CLCA reserve schedule along with minutes from last year's Annual Meeting.",
        start: 136,
        end: 190
      }
    ]
  }
};

/**
 * Test the complete workflow
 */
export function testBatchImportWorkflow() {
  console.log('=== Batch Import Workflow Test ===\n');

  // Step 1: Extract articles from batch data
  console.log('1. Extracting articles from batch data...');
  const articles = BatchContentTransformer.extractArticles(sampleBatchItem);
  console.log(`   Found ${articles.length} articles:`);
  articles.forEach((article, index) => {
    console.log(`   ${index + 1}. "${article.title}" (${article.content.length} chars)`);
  });
  console.log('');

  // Step 2: Transform articles to ContentDoc format
  console.log('2. Transforming articles to ContentDoc format...');
  const authorId = 'test-user-123';
  const authorName = 'Test User';
  
  articles.forEach((article, index) => {
    const contentDoc = BatchContentTransformer.transformToContentDoc(
      article,
      sampleBatchItem,
      authorId,
      authorName
    );
    
    console.log(`   Article ${index + 1}:`);
    console.log(`     Title: ${contentDoc.title}`);
    console.log(`     Tags: ${contentDoc.tags.join(', ')}`);
    console.log(`     Features: ${Object.keys(contentDoc.features).join(', ') || 'None'}`);
    console.log(`     Status: ${contentDoc.status}`);
    console.log(`     Description: ${contentDoc.description.substring(0, 100)}...`);
    console.log('');
  });

  // Step 3: Transform newsletter as single content item
  console.log('3. Transforming newsletter as single content item...');
  const newsletterContent = BatchContentTransformer.transformNewsletterToContentDoc(
    sampleBatchItem,
    authorId,
    authorName
  );
  
  console.log(`   Newsletter:`);
  console.log(`     Title: ${newsletterContent.title}`);
  console.log(`     Tags: ${newsletterContent.tags.join(', ')}`);
  console.log(`     Features: ${Object.keys(newsletterContent.features).join(', ') || 'None'}`);
  console.log(`     Status: ${newsletterContent.status}`);
  console.log('');

  // Step 4: Show how this would appear in ContentCard
  console.log('4. ContentCard Display Preview:');
  articles.forEach((article, index) => {
    const contentDoc = BatchContentTransformer.transformToContentDoc(
      article,
      sampleBatchItem,
      authorId,
      authorName
    );
    
    console.log(`   ContentCard ${index + 1}:`);
    console.log(`     Header: ${contentDoc.title}`);
    console.log(`     Type: Article (from content-type:article tag)`);
    console.log(`     Description: ${contentDoc.description}`);
    console.log(`     Tags: ${contentDoc.tags.filter(t => !t.startsWith('content-type:')).join(', ')}`);
    console.log(`     Author: ${contentDoc.authorName}`);
    console.log(`     Date: ${contentDoc.timestamps.created}`);
    console.log('');
  });

  console.log('=== Test Complete ===');
  console.log('The imported content will appear alongside other content types in your system.');
  console.log('Users can filter by tags like "source:newsletter", "year:2014", "category:meeting", etc.');
  console.log('The ContentCard component will automatically display the appropriate icons and features.');

  return {
    articles,
    newsletterContent,
    sampleBatchItem
  };
}

/**
 * Test with your actual data
 */
export async function testWithActualData() {
  try {
    // This would load your actual batch processing JSON
    // const response = await fetch('/src/data/batch_processing_20250912_215805.json');
    // const jsonData = await response.json();
    
    console.log('To test with your actual data:');
    console.log('1. Load your batch_processing_20250912_215805.json file');
    console.log('2. Use BatchImportService.importFromJson(jsonData, options)');
    console.log('3. The content will be created in your Firebase ContentDoc collection');
    console.log('4. It will appear in your content management interface');
    console.log('5. Users can view it alongside other content types');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
if (typeof window === 'undefined') {
  // Only run in Node.js environment
  testBatchImportWorkflow();
}
