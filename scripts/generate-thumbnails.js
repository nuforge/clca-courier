/**
 * Thumbnail Generation Script
 * Generates thumbnails for PDFs in Firebase Storage and updates Firestore metadata
 */

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, doc, updateDoc, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

/**
 * Generate thumbnail from local PDF file
 * This is a placeholder - you'll need to implement based on your preferred method
 */
async function generateThumbnailFromLocalPdf(pdfPath, outputPath) {
  console.log(`🖼️  Generating thumbnail for: ${path.basename(pdfPath)}`);

  try {
    // Option 1: Use pdf-poppler (requires poppler installation)
    // const poppler = await import('pdf-poppler');
    // const options = {
    //   format: 'jpeg',
    //   out_dir: path.dirname(outputPath),
    //   out_prefix: path.basename(outputPath, '.jpg'),
    //   page: 1
    // };
    // await poppler.convert(pdfPath, options);

    // Option 2: Use pdf2pic (requires imagemagick)
    // const pdf2pic = await import('pdf2pic');
    // const convert = pdf2pic.fromPath(pdfPath, {
    //   density: 150,
    //   saveFilename: path.basename(outputPath, '.jpg'),
    //   savePath: path.dirname(outputPath),
    //   format: 'jpg',
    //   width: 300,
    //   height: 400
    // });
    // await convert(1);

    // Option 3: Placeholder - create a simple image file
    // For now, we'll create a placeholder or copy from existing thumbnails
    const placeholderPath = path.join(__dirname, '../public/thumbnails/placeholder.jpg');
    if (fs.existsSync(placeholderPath)) {
      fs.copyFileSync(placeholderPath, outputPath);
    } else {
      // Create a simple placeholder file
      const placeholderContent = Buffer.from('placeholder thumbnail');
      fs.writeFileSync(outputPath, placeholderContent);
    }

    console.log(`   ✅ Thumbnail created: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`   ❌ Error generating thumbnail: ${error.message}`);
    throw error;
  }
}

/**
 * Upload thumbnail to Firebase Storage
 */
async function uploadThumbnailToStorage(thumbnailPath, newsletter) {
  const thumbnailName = `${newsletter.id}-thumbnail.jpg`;
  const storageRef = ref(storage, `newsletters/thumbnails/${thumbnailName}`);

  try {
    console.log(`📤 Uploading thumbnail: ${thumbnailName}`);

    const thumbnailFile = fs.readFileSync(thumbnailPath);
    const uploadResult = await uploadBytes(storageRef, thumbnailFile, {
      contentType: 'image/jpeg',
    });

    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`   ✅ Uploaded to: ${downloadUrl}`);

    return {
      thumbnailUrl: downloadUrl,
      storageRef: storageRef.fullPath,
    };
  } catch (error) {
    console.error(`   ❌ Upload failed: ${error.message}`);
    throw error;
  }
}

/**
 * Update Firestore document with thumbnail information
 */
async function updateNewsletterWithThumbnail(newsletterId, thumbnailInfo) {
  try {
    console.log(`📝 Updating Firestore document: ${newsletterId}`);

    const docRef = doc(db, 'newsletters', newsletterId);
    await updateDoc(docRef, {
      thumbnailUrl: thumbnailInfo.thumbnailUrl,
      'storage.thumbnail': {
        provider: 'firebase',
        downloadUrl: thumbnailInfo.thumbnailUrl,
        storageRef: thumbnailInfo.storageRef,
      },
      'actions.hasThumbnail': true,
      updatedAt: new Date().toISOString(),
    });

    console.log(`   ✅ Updated document: ${newsletterId}`);
  } catch (error) {
    console.error(`   ❌ Update failed: ${error.message}`);
    throw error;
  }
}

/**
 * Process thumbnails for existing newsletters
 */
async function generateThumbnailsForNewsletters() {
  console.log('🎨 Starting thumbnail generation...');

  try {
    // Get all newsletter documents
    const querySnapshot = await getDocs(collection(db, 'newsletters'));
    console.log(`📋 Found ${querySnapshot.size} newsletter documents`);

    const results = [];
    const tempDir = path.join(__dirname, '../temp/thumbnails');
    fs.mkdirSync(tempDir, { recursive: true });

    for (const docSnapshot of querySnapshot.docs) {
      const newsletter = docSnapshot.data();
      const newsletterId = docSnapshot.id;

      try {
        console.log(`\n🔄 Processing: ${newsletter.filename}`);

        // Check if thumbnail already exists
        if (newsletter.thumbnailUrl) {
          console.log(`   ⏭️  Thumbnail already exists, skipping`);
          results.push({
            newsletterId,
            filename: newsletter.filename,
            status: 'skipped',
            reason: 'thumbnail exists',
          });
          continue;
        }

        // Look for corresponding local PDF
        const localPdfPath = path.join(__dirname, '../public/issues', newsletter.filename);
        if (!fs.existsSync(localPdfPath)) {
          console.log(`   ⚠️  Local PDF not found: ${localPdfPath}`);
          results.push({
            newsletterId,
            filename: newsletter.filename,
            status: 'error',
            reason: 'local PDF not found',
          });
          continue;
        }

        // Generate thumbnail
        const thumbnailPath = path.join(tempDir, `${newsletterId}-thumbnail.jpg`);
        await generateThumbnailFromLocalPdf(localPdfPath, thumbnailPath);

        // Upload to Firebase Storage
        const thumbnailInfo = await uploadThumbnailToStorage(thumbnailPath, newsletter);

        // Update Firestore document
        await updateNewsletterWithThumbnail(newsletterId, thumbnailInfo);

        // Clean up temp file
        fs.unlinkSync(thumbnailPath);

        results.push({
          newsletterId,
          filename: newsletter.filename,
          status: 'success',
          thumbnailUrl: thumbnailInfo.thumbnailUrl,
        });

        console.log(`   ✅ Completed: ${newsletter.filename}`);
      } catch (error) {
        console.error(`   ❌ Error processing ${newsletter.filename}:`, error.message);
        results.push({
          newsletterId,
          filename: newsletter.filename,
          status: 'error',
          reason: error.message,
        });
      }
    }

    console.log('\n📊 Thumbnail Generation Summary:');
    console.log(`   Total newsletters: ${querySnapshot.size}`);
    console.log(`   Successful: ${results.filter((r) => r.status === 'success').length}`);
    console.log(`   Skipped: ${results.filter((r) => r.status === 'skipped').length}`);
    console.log(`   Errors: ${results.filter((r) => r.status === 'error').length}`);

    // Save results
    const resultsPath = path.join(__dirname, '../temp/thumbnail-generation-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${resultsPath}`);

    return results;
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

/**
 * Copy existing thumbnails from public directory
 */
async function copyExistingThumbnails() {
  console.log('📋 Copying existing thumbnails from public directory...');

  const publicThumbnailsDir = path.join(__dirname, '../public/thumbnails');
  if (!fs.existsSync(publicThumbnailsDir)) {
    console.log('   ⚠️  No public thumbnails directory found');
    return [];
  }

  const thumbnailFiles = fs
    .readdirSync(publicThumbnailsDir)
    .filter((file) => file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png'));

  console.log(`   📁 Found ${thumbnailFiles.length} existing thumbnails`);

  const results = [];

  for (const thumbnailFile of thumbnailFiles) {
    try {
      // Try to match with newsletter document
      const pdfName = thumbnailFile.replace(/\.(jpg|png)$/i, '.pdf');
      const querySnapshot = await getDocs(collection(db, 'newsletters'));

      let matchedNewsletter = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.filename === pdfName) {
          matchedNewsletter = { id: doc.id, ...data };
        }
      });

      if (matchedNewsletter && !matchedNewsletter.thumbnailUrl) {
        console.log(`   🔗 Matching ${thumbnailFile} with ${matchedNewsletter.filename}`);

        // Upload existing thumbnail
        const thumbnailPath = path.join(publicThumbnailsDir, thumbnailFile);
        const thumbnailInfo = await uploadThumbnailToStorage(thumbnailPath, matchedNewsletter);

        // Update Firestore
        await updateNewsletterWithThumbnail(matchedNewsletter.id, thumbnailInfo);

        results.push({
          thumbnailFile,
          newsletterId: matchedNewsletter.id,
          status: 'success',
        });
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${thumbnailFile}:`, error.message);
      results.push({
        thumbnailFile,
        status: 'error',
        reason: error.message,
      });
    }
  }

  console.log(`   ✅ Processed ${results.length} existing thumbnails`);
  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Thumbnail Generation Tool');
  console.log('============================\n');

  try {
    // First, try to copy existing thumbnails
    await copyExistingThumbnails();

    // Then generate missing thumbnails
    await generateThumbnailsForNewsletters();

    console.log('\n🎉 Thumbnail generation completed!');
    console.log('\nNext steps:');
    console.log('1. Check Firebase Storage for uploaded thumbnails');
    console.log('2. Verify Firestore documents were updated');
    console.log('3. Test the newsletter archive interface');
    console.log('4. Extract PDF text content for search functionality');
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateThumbnailsForNewsletters, copyExistingThumbnails };
