/**
 * Update Word Counts from Extraction Data
 *
 * This script reads the existing word count data from the PDF text extraction file
 * and updates the enhanced-newsletter-metadata.json file with the actual word counts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const extractionDataPath = path.join(__dirname, '../docs/pdf-text-extraction-2025-09-04.json');
const metadataPath = path.join(__dirname, '../public/data/enhanced-newsletter-metadata.json');

console.log('📊 Starting word count update process...');

try {
  // Read the extraction data (contains actual word counts)
  console.log('📖 Reading PDF text extraction data...');
  const extractionData = JSON.parse(fs.readFileSync(extractionDataPath, 'utf8'));

  // Read the current metadata file
  console.log('📖 Reading current newsletter metadata...');
  const metadataData = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  // Create a lookup map of filename -> wordCount from extraction data
  const wordCountMap = new Map();
  extractionData.forEach((item) => {
    if (item.filename && item.wordCount) {
      wordCountMap.set(item.filename, item.wordCount);
      console.log(
        `✅ Found word count for ${item.filename}: ${item.wordCount.toLocaleString()} words`,
      );
    }
  });

  console.log(`🔢 Found word counts for ${wordCountMap.size} newsletters`);

  // Update the metadata with word counts
  let updatedCount = 0;
  metadataData.forEach((newsletter) => {
    const wordCount = wordCountMap.get(newsletter.filename);
    if (wordCount) {
      newsletter.wordCount = wordCount;
      updatedCount++;
      console.log(`📝 Updated ${newsletter.filename}: ${wordCount.toLocaleString()} words`);
    } else {
      // Set to 0 if no word count found
      newsletter.wordCount = 0;
      console.log(`⚠️  No word count found for ${newsletter.filename}, setting to 0`);
    }
  });

  // Write the updated metadata back to file
  console.log('💾 Writing updated metadata file...');
  fs.writeFileSync(metadataPath, JSON.stringify(metadataData, null, 2));

  console.log(`✅ Successfully updated word counts for ${updatedCount} newsletters!`);
  console.log(`📊 Total newsletters processed: ${metadataData.length}`);

  // Show some statistics
  const totalWords = metadataData.reduce((sum, newsletter) => sum + (newsletter.wordCount || 0), 0);
  const avgWords = Math.round(totalWords / metadataData.length);

  console.log('\n📈 Statistics:');
  console.log(`   Total words across all newsletters: ${totalWords.toLocaleString()}`);
  console.log(`   Average words per newsletter: ${avgWords.toLocaleString()}`);
  console.log(`   Newsletters with word counts: ${updatedCount}/${metadataData.length}`);
} catch (error) {
  console.error('❌ Error updating word counts:', error);
  process.exit(1);
}
