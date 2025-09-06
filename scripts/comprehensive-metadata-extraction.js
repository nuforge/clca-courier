/**
 * Comprehensive PDF Metadata Extraction and Management System
 *
 * This script handles:
 * 1. Automatic metadata extraction from filenames and PDF properties
 * 2. PDF text extraction for search indexing
 * 3. Thumbnail generation
 * 4. Web-optimized PDF creation (future capability)
 * 5. Complete metadata structure for Firebase storage
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pdf2pic from 'pdf2pic';
import sharp from 'sharp';

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
  pageCount: 0, // Number of pages
  dimensions: { width: 0, height: 0 }, // PDF dimensions
  contentType: 'application/pdf',

  // Storage references
  downloadUrl: '', // Firebase Storage signed URL
  storageRef: '', // Firebase Storage path
  thumbnailUrl: null, // Generated thumbnail
  webOptimizedUrl: null, // Future: compressed version

  // Text content (extracted)
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

  // Future storage tiers
  storage: {
    primary: {
      provider: 'firebase',
      downloadUrl: '',
      storageRef: '',
      fileSize: 0,
    },
    // Reserved for future multi-tier
    archive: null,
    webOptimized: null,
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
 * Extract topics and key terms from text content
 */
function extractTopicsAndTerms(textContent) {
  if (!textContent) return { topics: [], keyTerms: [] };

  const text = textContent.toLowerCase();

  // Common newsletter topics
  const topicPatterns = {
    'community events': /event|festival|celebration|gathering|meeting/g,
    'lake activities': /lake|water|swimming|boating|fishing/g,
    wildlife: /deer|bear|bird|wildlife|nature|forest/g,
    'property matters': /property|tax|assessment|real estate|zoning/g,
    recreation: /recreation|park|trail|hiking|camping/g,
    weather: /weather|storm|temperature|rain|snow/g,
    'local business': /business|shop|service|contractor|vendor/g,
    'community news': /neighbor|resident|family|community/g,
  };

  const topics = [];
  const keyTerms = [];

  // Extract topics
  Object.entries(topicPatterns).forEach(([topic, pattern]) => {
    if (pattern.test(text)) {
      topics.push(topic);
    }
  });

  // Extract key terms (simple frequency analysis)
  const words = text.match(/\b\w{4,}\b/g) || [];
  const frequency = {};

  words.forEach((word) => {
    if (!isCommonWord(word)) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });

  // Get top terms
  const sortedTerms = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([term]) => term);

  keyTerms.push(...sortedTerms);

  return { topics, keyTerms };
}

/**
 * Check if word is common/stop word
 */
function isCommonWord(word) {
  const commonWords = new Set([
    'the',
    'and',
    'for',
    'are',
    'but',
    'not',
    'you',
    'all',
    'can',
    'had',
    'her',
    'was',
    'one',
    'our',
    'out',
    'day',
    'get',
    'has',
    'him',
    'his',
    'how',
    'its',
    'may',
    'new',
    'now',
    'old',
    'see',
    'two',
    'who',
    'boy',
    'did',
    'doesn',
    'each',
    'she',
    'them',
    'very',
    'what',
    'with',
    'have',
  ]);
  return commonWords.has(word.toLowerCase());
}

/**
 * Generate thumbnail from PDF
 */
async function generateThumbnail(storageRef, filename) {
  console.log(`🖼️  Generating thumbnail for: ${filename}`);

  try {
    // Download PDF to temp location
    const tempPdfPath = path.join(__dirname, '../temp', filename);
    const tempDir = path.dirname(tempPdfPath);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const bucket = storage.bucket();
    const file = bucket.file(storageRef);

    await file.download({ destination: tempPdfPath });

    // Generate thumbnail using pdf2pic
    const convert = pdf2pic.fromPath(tempPdfPath, {
      density: 100,
      saveFilename: 'thumbnail',
      savePath: tempDir,
      format: 'png',
      width: 300,
      height: 400,
    });

    const result = await convert(1); // First page only

    if (result && result.path) {
      // Optimize with Sharp
      const optimizedPath = path.join(tempDir, `${filename}-thumb.webp`);

      await sharp(result.path)
        .resize(300, 400, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(optimizedPath);

      // Upload thumbnail to Firebase Storage
      const thumbStoragePath = `thumbnails/${filename}-thumb.webp`;
      const thumbFile = bucket.file(thumbStoragePath);

      await thumbFile.save(fs.readFileSync(optimizedPath), {
        metadata: {
          contentType: 'image/webp',
        },
      });

      // Get thumbnail URL
      const [thumbUrl] = await thumbFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
      });

      // Cleanup temp files
      [tempPdfPath, result.path, optimizedPath].forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      console.log(`✅ Thumbnail generated: ${thumbStoragePath}`);
      return {
        thumbnailUrl: thumbUrl,
        storageRef: thumbStoragePath,
      };
    }

    throw new Error('Failed to generate thumbnail');
  } catch (error) {
    console.error(`❌ Thumbnail generation failed for ${filename}:`, error);
    return null;
  }
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

        // TODO: Add thumbnail generation in next phase
        // const thumbnail = await generateThumbnail(file.name, filename);

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
  console.log('🔥 Comprehensive PDF Metadata Extraction System');
  console.log('================================================\n');

  try {
    const results = await processAllPDFs();

    console.log('\n🎉 Comprehensive metadata extraction completed!');
    console.log('\nNext steps available:');
    console.log('1. ✅ Review Firebase documents');
    console.log('2. 🖼️  Generate thumbnails (run thumbnail script)');
    console.log('3. 📝 Extract PDF text content (run text extraction)');
    console.log('4. 🔍 Test search functionality');
    console.log('5. ⚙️  Configure admin metadata editing interface');
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
