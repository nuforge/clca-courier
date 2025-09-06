/**
 * Simple Comprehensive PDF Metadata Extraction
 * Processes PDFs uploaded to Firebase Storage and creates Firestore metadata documents
 * No external dependencies - focuses on filename parsing and Firebase Storage integration
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
console.log('🔧 Initializing Firebase Admin SDK...');

try {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  process.exit(1);
}

const storage = admin.storage();
const db = admin.firestore();

/**
 * Complete metadata structure for newsletters
 */
const METADATA_SCHEMA = {
  // Core identification
  id: '', // Document ID: newsletter-YYYY-season
  filename: '', // Original filename
  title: '', // Extracted or assigned title

  // Publication details
  publicationDate: '', // ISO date string
  issueNumber: '', // YYYY-season format
  season: '', // spring, summer, fall, winter
  year: 0, // Numeric year
  volume: null, // Manual entry or extracted
  issue: null, // Manual entry or extracted

  // Content description
  description: '', // Auto-generated or manual
  summary: null, // Manual entry for featured issues
  featured: false, // Manual flag for homepage

  // File properties (automatically extracted)
  fileSize: 0, // Bytes
  pageCount: null, // Number of pages (requires PDF library)
  dimensions: null, // PDF dimensions (requires PDF library)
  contentType: 'application/pdf',

  // Storage references
  downloadUrl: '', // Firebase Storage signed URL
  storageRef: '', // Firebase Storage path
  thumbnailUrl: null, // Generated thumbnail
  webOptimizedUrl: null, // Future: compressed version

  // Text content (future extraction)
  searchableText: null, // Full text for search
  keyTerms: [], // Extracted key phrases
  topics: [], // Auto-categorized topics
  wordCount: 0, // Total word count

  // Visual elements
  thumbnails: {
    small: null, // 150x200 thumbnail
    medium: null, // 300x400 thumbnail
    large: null, // 600x800 preview
  },
  hasImages: false, // Contains significant images
  imageCount: 0, // Number of images extracted

  // Categorization (manual/automatic)
  tags: [], // Searchable tags
  categories: [], // Newsletter sections
  contributors: [], // Manual entry

  // Admin metadata
  isPublished: true, // Visibility flag
  createdAt: '', // ISO timestamp
  updatedAt: '', // ISO timestamp
  createdBy: 'system', // Who uploaded
  updatedBy: 'system', // Last editor

  // Action availability
  actions: {
    canView: true,
    canDownload: true,
    canSearch: false, // Until text extracted
    hasThumbnail: false,
    hasWebOptimized: false,
  },

  // Storage configuration
  storage: {
    primary: {
      provider: 'firebase',
      downloadUrl: '',
      storageRef: '',
      fileSize: 0,
    },
  },
};

/**
 * Extract comprehensive metadata from PDF filename
 */
function extractFilenameMetadata(filename) {
  console.log(`🔍 Analyzing filename: ${filename}`);

  const nameWithoutExt = filename.replace(/\.pdf$/i, '');
  let metadata = {
    filename,
    title: 'Conashaugh Courier',
    year: new Date().getFullYear(),
    season: 'summer',
    issueNumber: '',
    volume: null,
    issue: null,
    tags: ['newsletter', 'conashaugh', 'courier'],
  };

  // Pattern 1: YYYY.season-title.pdf (e.g., 2024.summer-conashaugh-courier.pdf)
  const pattern1 = /^(\d{4})\.(\w+)-(.+)$/;
  const match1 = nameWithoutExt.match(pattern1);

  if (match1) {
    metadata.year = parseInt(match1[1]);
    metadata.season = normalizeSeasonName(match1[2]);
    metadata.title = formatTitle(match1[3]);
    metadata.issueNumber = `${metadata.year}-${metadata.season}`;
  } else {
    // Pattern 2: YYYY-season-title.pdf
    const pattern2 = /^(\d{4})-(\w+)-(.+)$/;
    const match2 = nameWithoutExt.match(pattern2);

    if (match2) {
      metadata.year = parseInt(match2[1]);
      metadata.season = normalizeSeasonName(match2[2]);
      metadata.title = formatTitle(match2[3]);
      metadata.issueNumber = `${metadata.year}-${metadata.season}`;
    } else {
      // Pattern 3: Extract year and season separately
      const yearMatch = nameWithoutExt.match(/(\d{4})/);
      const seasonMatch = nameWithoutExt.match(/(spring|summer|fall|autumn|winter)/i);

      if (yearMatch) metadata.year = parseInt(yearMatch[1]);
      if (seasonMatch) metadata.season = normalizeSeasonName(seasonMatch[1]);
      metadata.issueNumber = `${metadata.year}-${metadata.season}`;
      metadata.title = formatTitle(nameWithoutExt);
    }
  }

  // Extract volume/issue numbers if present
  const volumeMatch = nameWithoutExt.match(/vol(?:ume)?[\s\-_]*(\d+)/i);
  const issueMatch = nameWithoutExt.match(/(?:issue|no|num)[\s\-_]*(\d+)/i);

  if (volumeMatch) metadata.volume = parseInt(volumeMatch[1]);
  if (issueMatch) metadata.issue = parseInt(issueMatch[1]);

  // Generate additional tags
  metadata.tags.push(metadata.season, metadata.year.toString());

  // Add decade tag
  const decade = Math.floor(metadata.year / 10) * 10;
  metadata.tags.push(`${decade}s`);

  // Add title-based tags
  const titleWords = metadata.title.toLowerCase().split(/\s+/);
  titleWords.forEach((word) => {
    if (word.length > 3 && !metadata.tags.includes(word)) {
      metadata.tags.push(word);
    }
  });

  console.log(`   📄 Parsed: ${metadata.year} ${metadata.season} - ${metadata.title}`);
  if (metadata.volume) console.log(`   📖 Volume: ${metadata.volume}`);
  if (metadata.issue) console.log(`   📃 Issue: ${metadata.issue}`);

  return metadata;
}

/**
 * Normalize season names
 */
function normalizeSeasonName(season) {
  const normalized = season.toLowerCase();
  const seasonMap = {
    spring: 'spring',
    summer: 'summer',
    fall: 'fall',
    autumn: 'fall',
    winter: 'winter',
  };
  return seasonMap[normalized] || 'summer';
}

/**
 * Format title from filename component
 */
function formatTitle(titlePart) {
  return (
    titlePart
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim() || 'Conashaugh Courier'
  );
}

/**
 * Generate publication date from year and season
 */
function generatePublicationDate(year, season) {
  const seasonDates = {
    spring: `${year}-03-21`,
    summer: `${year}-06-21`,
    fall: `${year}-09-21`,
    winter: `${year}-12-21`,
  };
  return `${seasonDates[season] || seasonDates.summer}T00:00:00.000Z`;
}

/**
 * Create comprehensive newsletter document
 */
async function createComprehensiveDocument(storageRef, downloadUrl, filename, fileMetadata) {
  const filenameMetadata = extractFilenameMetadata(filename);
  const docId = `newsletter-${filenameMetadata.year}-${filenameMetadata.season}`;

  console.log(`📝 Creating comprehensive document: ${docId}`);

  // Base document structure
  const newsletterDoc = {
    ...METADATA_SCHEMA,

    // Core identification
    id: docId,
    filename: filenameMetadata.filename,
    title: filenameMetadata.title,

    // Publication details
    publicationDate: generatePublicationDate(filenameMetadata.year, filenameMetadata.season),
    issueNumber: filenameMetadata.issueNumber,
    season: filenameMetadata.season,
    year: filenameMetadata.year,
    volume: filenameMetadata.volume,
    issue: filenameMetadata.issue,

    // Content description
    description: `${filenameMetadata.season.charAt(0).toUpperCase() + filenameMetadata.season.slice(1)} ${filenameMetadata.year} issue of the Conashaugh Courier`,

    // File properties
    fileSize: fileMetadata.size,
    contentType: fileMetadata.contentType || 'application/pdf',

    // Storage references
    downloadUrl: downloadUrl,
    storageRef: storageRef,

    // Categorization
    tags: filenameMetadata.tags,

    // Storage configuration
    storage: {
      primary: {
        provider: 'firebase',
        downloadUrl: downloadUrl,
        storageRef: storageRef,
        fileSize: fileMetadata.size,
      },
    },

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    updatedBy: 'system',
  };

  try {
    await db.collection('newsletters').doc(docId).set(newsletterDoc);
    console.log(`✅ Created comprehensive document: ${docId}`);
    return { docId, document: newsletterDoc };
  } catch (error) {
    console.error(`❌ Error creating document ${docId}:`, error);
    throw error;
  }
}

/**
 * Process all PDFs with comprehensive metadata extraction
 */
async function processAllPDFs() {
  console.log('🚀 Starting comprehensive PDF metadata extraction...');

  try {
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: 'newsletters/' });

    console.log(`📁 Found ${files.length} files in Firebase Storage`);

    const results = [];
    let processed = 0;

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        continue;
      }

      const filename = file.name.replace('newsletters/', '');
      processed++;

      try {
        console.log(`\n🔄 Processing ${processed}: ${filename}`);

        // Get file metadata and download URL
        const [metadata] = await file.getMetadata();
        const [downloadUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
        });

        // Create comprehensive document
        const result = await createComprehensiveDocument(
          file.name,
          downloadUrl,
          filename,
          metadata,
        );

        results.push({
          ...result,
          filename,
          downloadUrl,
          fileSize: metadata.size,
          success: true,
        });

        console.log(`✅ Completed: ${filename}`);
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error);
        results.push({
          filename,
          error: error.message,
          success: false,
        });
      }
    }

    // Save results
    const resultsPath = path.join(__dirname, '../temp/comprehensive-metadata-results.json');
    fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    console.log('\n📊 Processing Summary:');
    console.log(`   Total PDFs processed: ${processed}`);
    console.log(`   Successful: ${results.filter((r) => r.success).length}`);
    console.log(`   Errors: ${results.filter((r) => !r.success).length}`);
    console.log(`📄 Results saved to: ${resultsPath}`);

    return results;
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔥 Simple Comprehensive PDF Metadata Extraction System');
  console.log('======================================================\n');

  try {
    const results = await processAllPDFs();

    console.log('\n🎉 Comprehensive metadata extraction completed!');
    console.log('\nNext steps available:');
    console.log('1. ✅ Review Firebase documents at /admin/metadata');
    console.log('2. 🖼️  Generate thumbnails (placeholder SVGs available)');
    console.log('3. 📝 Extract PDF text content via admin interface');
    console.log('4. 🔍 Test search functionality in newsletter archive');
    console.log('5. ⚙️  Use admin interface for manual metadata editing');
    console.log('\nAdmin Dashboard: http://localhost:8080/admin');
    console.log('Metadata Manager: http://localhost:8080/admin/metadata');
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { extractFilenameMetadata, createComprehensiveDocument, processAllPDFs, METADATA_SCHEMA };
