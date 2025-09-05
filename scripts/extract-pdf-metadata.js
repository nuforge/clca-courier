/**
 * PDF Metadata Extraction Script
 * Processes PDFs uploaded to Firebase Storage and creates Firestore metadata documents
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

// For development, we'll use application default credentials
// In production, you'd use a service account key file
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
 * Extract metadata from PDF filename
 */
function extractMetadataFromFilename(filename) {
  console.log(`🔍 Extracting metadata from: ${filename}`);

  // Remove extension
  const nameWithoutExt = filename.replace(/\.pdf$/i, '');

  // Parse different filename patterns
  let year, season, title, issueNumber;

  // Pattern: 2024.summer-conashaugh-courier.pdf
  const pattern1 = /^(\d{4})\.(\w+)-(.+)$/;
  const match1 = nameWithoutExt.match(pattern1);

  if (match1) {
    year = parseInt(match1[1]);
    season = match1[2].toLowerCase();
    title = match1[3].replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    issueNumber = `${year}-${season}`;
  } else {
    // Fallback parsing for other patterns
    const yearMatch = nameWithoutExt.match(/(\d{4})/);
    year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const seasonMatch = nameWithoutExt.match(/(spring|summer|fall|winter)/i);
    season = seasonMatch ? seasonMatch[1].toLowerCase() : 'unknown';

    title = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    issueNumber = `${year}-${season}`;
  }

  // Normalize season
  const validSeasons = ['spring', 'summer', 'fall', 'winter'];
  if (!validSeasons.includes(season)) {
    season = 'summer'; // Default fallback
  }

  console.log(`   📄 Parsed: ${year} ${season} - ${title}`);

  return {
    filename,
    title: title || 'Conashaugh Courier',
    year,
    season,
    issueNumber,
    publicationDate: `${year}-${getSeasonMonth(season)}-01T00:00:00.000Z`,
    tags: generateTags(title, year, season),
  };
}

/**
 * Get approximate month for season
 */
function getSeasonMonth(season) {
  const seasonMonths = {
    spring: '03',
    summer: '06',
    fall: '09',
    winter: '12',
  };
  return seasonMonths[season] || '06';
}

/**
 * Generate tags from metadata
 */
function generateTags(title, year, season) {
  const tags = ['newsletter', 'conashaugh', 'courier'];

  if (season) tags.push(season);
  if (year) tags.push(year.toString());

  // Add decade tag
  const decade = Math.floor(year / 10) * 10;
  tags.push(`${decade}s`);

  // Extract additional tags from title
  const titleWords = title.toLowerCase().split(/\s+/);
  titleWords.forEach((word) => {
    if (word.length > 3 && !tags.includes(word)) {
      tags.push(word);
    }
  });

  return tags;
}

/**
 * Create Firestore document for newsletter
 */
async function createNewsletterDocument(storageRef, downloadUrl, metadata, fileMetadata) {
  const docId = `newsletter-${metadata.year}-${metadata.season}`;

  const newsletterDoc = {
    id: docId,
    filename: metadata.filename,
    title: metadata.title,
    description: `${metadata.season.charAt(0).toUpperCase() + metadata.season.slice(1)} ${metadata.year} issue of the Conashaugh Courier`,
    publicationDate: metadata.publicationDate,
    issueNumber: metadata.issueNumber,
    season: metadata.season,
    year: metadata.year,
    fileSize: fileMetadata.size,
    pageCount: null, // To be filled by PDF processing

    // Firebase Storage references
    downloadUrl: downloadUrl,
    storageRef: storageRef.fullPath,
    thumbnailUrl: null, // To be generated

    // Future-ready storage configuration
    storage: {
      primary: {
        provider: 'firebase',
        downloadUrl: downloadUrl,
        storageRef: storageRef.fullPath,
        fileSize: fileMetadata.size,
      },
    },

    tags: metadata.tags,
    featured: false,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin', // System upload
    updatedBy: 'admin',
    searchableText: null, // To be extracted from PDF

    // Action availability
    actions: {
      canView: true,
      canDownload: true,
      canSearch: false, // Until text is extracted
      hasThumbnail: false, // Until thumbnail is generated
    },
  };

  console.log(`📝 Creating Firestore document: ${docId}`);

  try {
    await db.collection('newsletters').doc(docId).set(newsletterDoc);
    console.log(`✅ Created document: ${docId}`);
    return docId;
  } catch (error) {
    console.error(`❌ Error creating document ${docId}:`, error);
    throw error;
  }
}

/**
 * Process all PDFs in Firebase Storage
 */
async function processStoragePDFs() {
  console.log('🚀 Starting PDF metadata extraction...');

  try {
    console.log('📡 Connecting to Firebase Storage...');
    // List all items in the newsletters folder
    const bucket = storage.bucket();

    console.log('📂 Listing files in newsletters/ folder...');
    const [files] = await bucket.getFiles({ prefix: 'newsletters/' });

    console.log(`📁 Found ${files.length} files in Firebase Storage`);

    const results = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        console.log(`⏭️  Skipping non-PDF: ${file.name}`);
        continue;
      }

      // Extract filename from path (remove 'newsletters/' prefix)
      const filename = file.name.replace('newsletters/', '');

      try {
        console.log(`\n🔄 Processing: ${filename}`);

        // Get file metadata and download URL
        const [metadata] = await file.getMetadata();
        const [downloadUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
        });

        // Extract metadata from filename
        const extractedMetadata = extractMetadataFromFilename(filename);

        // Create Firestore document
        const docId = await createNewsletterDocument(
          file.name, // storageRef (full path)
          downloadUrl,
          extractedMetadata,
          metadata,
        );

        results.push({
          filename: filename,
          docId: docId,
          downloadUrl: downloadUrl,
          fileSize: metadata.size,
          metadata: extractedMetadata,
        });

        console.log(`✅ Processed: ${filename} -> ${docId}`);
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error);
        results.push({
          filename: filename,
          error: error.message,
        });
      }
    }

    console.log('\n📊 Processing Summary:');
    console.log(`   Total files: ${listResult.items.length}`);
    console.log(`   Processed: ${results.filter((r) => !r.error).length}`);
    console.log(`   Errors: ${results.filter((r) => r.error).length}`);

    // Save results to file
    const resultsPath = path.join(__dirname, '../temp/metadata-extraction-results.json');
    fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${resultsPath}`);

    return results;
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

/**
 * Check existing documents
 */
async function checkExistingDocuments() {
  console.log('🔍 Checking existing newsletter documents...');

  try {
    const querySnapshot = await db.collection('newsletters').get();
    console.log(`📋 Found ${querySnapshot.size} existing documents`);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   📄 ${doc.id}: ${data.title} (${data.year} ${data.season || 'season'})`);
    });

    return querySnapshot.size;
  } catch (error) {
    console.error('❌ Error checking documents:', error);
    return 0;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔥 PDF Metadata Extraction Tool');
  console.log('================================\n');

  try {
    // Check Firebase connection
    console.log('🔗 Testing Firebase connection...');
    await checkExistingDocuments();

    // Process storage PDFs
    const results = await processStoragePDFs();

    console.log('\n🎉 Metadata extraction completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the created Firestore documents');
    console.log('2. Run thumbnail generation script');
    console.log('3. Extract PDF text content for search');
    console.log('4. Test the newsletter archive interface');
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🎯 Script starting...');
main().catch(console.error);

export { processStoragePDFs, extractMetadataFromFilename, createNewsletterDocument };
