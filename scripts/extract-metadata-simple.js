/**
 * Simple PDF Metadata Extraction Script
 * Uses Firebase Web SDK with authentication for quick development
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

/**
 * Extract metadata from PDF filename
 */
function extractMetadataFromFilename(filename) {
  console.log(`🔍 Extracting metadata from: ${filename}`);

  const patterns = [
    // Pattern: 2024.01-conashaugh-courier.pdf
    /(\d{4})\.(\d{2})-([^.]+)\.pdf$/i,
    // Pattern: 2024.summer-conashaugh-courier.pdf
    /(\d{4})\.(summer|winter)-([^.]+)\.pdf$/i,
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      let season = 'summer'; // default

      if (match[2].length === 2) {
        // Month number
        const month = parseInt(match[2]);
        season = month <= 6 ? 'summer' : 'winter';
      } else {
        // Explicit season
        season = match[2].toLowerCase();
      }

      const title = `${year} ${season} - Conashaugh Courier`;
      const publicationDate = `${year}-${season === 'summer' ? '06' : '12'}-01`;

      console.log(`   📄 Parsed: ${title}`);

      return {
        title,
        year,
        season,
        publicationDate,
        tags: ['newsletter', 'community', season, year.toString()],
      };
    }
  }

  // Fallback
  console.log(`   ⚠️  Using fallback parsing`);
  return {
    title: filename.replace('.pdf', ''),
    year: new Date().getFullYear(),
    season: 'summer',
    publicationDate: new Date().toISOString().split('T')[0],
    tags: ['newsletter'],
  };
}

/**
 * Create newsletter document in Firestore
 */
async function createNewsletterDocument(metadata, downloadUrl, storageRef, fileSize) {
  // Generate document ID
  const docId = `newsletter-${metadata.year}-${metadata.season}`;

  const newsletterDoc = {
    filename: storageRef.split('/').pop(),
    title: metadata.title,
    description: '',
    publicationDate: metadata.publicationDate,
    year: metadata.year,
    season: metadata.season,
    fileSize: fileSize,
    pageCount: 0,
    downloadUrl: downloadUrl,
    storageRef: storageRef,
    tags: metadata.tags,
    featured: false,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: process.env.ADMIN_UID || '',
    updatedBy: process.env.ADMIN_UID || '',
    actions: {
      canView: true,
      canDownload: true,
      canSearch: false,
      hasThumbnail: false,
    },
  };

  console.log(`📝 Creating Firestore document: ${docId}`);

  try {
    await setDoc(doc(db, 'newsletters', docId), newsletterDoc);
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
    // List all items in the newsletters folder
    const newslettersRef = ref(storage, 'newsletters');
    const listResult = await listAll(newslettersRef);

    console.log(`📁 Found ${listResult.items.length} files in Firebase Storage`);

    const results = [];

    for (const itemRef of listResult.items) {
      if (!itemRef.name.toLowerCase().endsWith('.pdf')) {
        console.log(`⏭️  Skipping non-PDF: ${itemRef.name}`);
        continue;
      }

      try {
        console.log(`\n🔄 Processing: ${itemRef.name}`);

        // Get file metadata and download URL
        const [fileMetadata, downloadUrl] = await Promise.all([
          getMetadata(itemRef),
          getDownloadURL(itemRef),
        ]);

        // Extract metadata from filename
        const extractedMetadata = extractMetadataFromFilename(itemRef.name);

        // Create Firestore document
        const docId = await createNewsletterDocument(
          extractedMetadata,
          downloadUrl,
          itemRef.fullPath,
          fileMetadata.size,
        );

        results.push({
          filename: itemRef.name,
          docId: docId,
          downloadUrl: downloadUrl,
          fileSize: fileMetadata.size,
          metadata: extractedMetadata,
        });

        console.log(`✅ Processed: ${itemRef.name} -> ${docId}`);
      } catch (error) {
        console.error(`❌ Error processing ${itemRef.name}:`, error);
        results.push({
          filename: itemRef.name,
          error: error.message,
        });
      }
    }

    console.log(`\n📊 Processing Summary:`);
    console.log(`   Total files: ${listResult.items.length}`);
    console.log(`   Processed: ${results.filter((r) => !r.error).length}`);
    console.log(`   Errors: ${results.filter((r) => r.error).length}`);

    return results;
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔥 PDF Metadata Extraction Tool');
  console.log('================================');

  try {
    console.log('� Attempting to process files...');
    const results = await processStoragePDFs();
    console.log('\n🎉 Metadata extraction completed successfully!');
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    console.log('\n💡 Next steps:');
    console.log('1. Check Firebase security rules');
    console.log('2. Or use the web interface to upload files manually');
    process.exit(1);
  }
} // Run the script
main().catch(console.error);
