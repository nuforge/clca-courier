/**
 * Newsletter Archive Test Script
 * Tests the Firebase newsletter archive functionality
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

// Firebase configuration (using environment variables)
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
const db = getFirestore(app);

/**
 * Test newsletter collection access
 */
async function testNewsletterCollection() {
  console.log('🔍 Testing newsletter collection access...');

  try {
    const querySnapshot = await getDocs(collection(db, 'newsletters'));
    console.log(`✅ Found ${querySnapshot.size} newsletter documents`);

    if (querySnapshot.size > 0) {
      console.log('\n📋 Sample newsletters:');
      let count = 0;
      querySnapshot.forEach((doc) => {
        if (count < 3) {
          // Show first 3 documents
          const data = doc.data();
          console.log(`   📄 ${doc.id}: ${data.title} (${data.year} ${data.season})`);
          console.log(
            `      File: ${data.filename} (${(data.fileSize / 1024 / 1024).toFixed(1)} MB)`,
          );
          console.log(`      URL: ${data.downloadUrl ? 'Available' : 'Missing'}`);
          console.log(`      Thumbnail: ${data.thumbnailUrl ? 'Available' : 'Missing'}`);
        }
        count++;
      });

      if (querySnapshot.size > 3) {
        console.log(`   ... and ${querySnapshot.size - 3} more`);
      }
    }

    return querySnapshot.size;
  } catch (error) {
    console.error('❌ Error accessing newsletter collection:', error);
    throw error;
  }
}

/**
 * Test individual newsletter document access
 */
async function testNewsletterDocument(newsletterId) {
  console.log(`\n🔍 Testing individual document access: ${newsletterId}`);

  try {
    const docRef = doc(db, 'newsletters', newsletterId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Document found:');
      console.log(`   Title: ${data.title}`);
      console.log(`   Filename: ${data.filename}`);
      console.log(`   Year: ${data.year}, Season: ${data.season}`);
      console.log(`   File Size: ${(data.fileSize / 1024 / 1024).toFixed(1)} MB`);
      console.log(`   Download URL: ${data.downloadUrl ? 'Available' : 'Missing'}`);
      console.log(`   Thumbnail: ${data.thumbnailUrl ? 'Available' : 'Missing'}`);
      console.log(`   Tags: ${data.tags?.join(', ')}`);
      console.log(
        `   Actions: View=${data.actions?.canView}, Download=${data.actions?.canDownload}`,
      );
      return data;
    } else {
      console.log('❌ Document not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error accessing document:', error);
    throw error;
  }
}

/**
 * Test newsletter data structure
 */
async function testDataStructure() {
  console.log('\n🔍 Testing newsletter data structure...');

  try {
    const querySnapshot = await getDocs(collection(db, 'newsletters'));

    if (querySnapshot.size === 0) {
      console.log('⚠️  No newsletters found for structure validation');
      return;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    console.log('✅ Validating data structure:');

    // Required fields
    const requiredFields = ['id', 'filename', 'title', 'year', 'downloadUrl', 'storageRef'];
    const missingRequired = requiredFields.filter((field) => !data[field]);

    if (missingRequired.length === 0) {
      console.log('   ✅ All required fields present');
    } else {
      console.log(`   ❌ Missing required fields: ${missingRequired.join(', ')}`);
    }

    // Optional fields
    const optionalFields = ['season', 'description', 'thumbnailUrl', 'pageCount', 'searchableText'];
    const presentOptional = optionalFields.filter((field) => data[field]);
    console.log(`   📋 Optional fields present: ${presentOptional.join(', ')}`);

    // Actions object
    if (data.actions) {
      console.log('   ✅ Actions object present');
      console.log(`      Can view: ${data.actions.canView}`);
      console.log(`      Can download: ${data.actions.canDownload}`);
      console.log(`      Has thumbnail: ${data.actions.hasThumbnail}`);
    } else {
      console.log('   ⚠️  Actions object missing');
    }

    // Storage configuration (future-ready)
    if (data.storage) {
      console.log('   ✅ Storage configuration present');
      console.log(`      Primary provider: ${data.storage.primary?.provider}`);
    } else {
      console.log('   📋 Storage configuration not present (using legacy fields)');
    }
  } catch (error) {
    console.error('❌ Error validating data structure:', error);
    throw error;
  }
}

/**
 * Test newsletter filtering and querying
 */
async function testNewsletterQueries() {
  console.log('\n🔍 Testing newsletter queries...');

  try {
    // Test year filtering
    const currentYear = new Date().getFullYear();
    const querySnapshot = await getDocs(
      query(
        collection(db, 'newsletters'),
        where('year', '>=', currentYear - 5),
        orderBy('year', 'desc'),
        limit(5),
      ),
    );

    console.log(`✅ Recent newsletters query: found ${querySnapshot.size} documents`);

    // Test published filtering
    const publishedQuery = await getDocs(
      query(collection(db, 'newsletters'), where('isPublished', '==', true), limit(3)),
    );

    console.log(`✅ Published newsletters query: found ${publishedQuery.size} documents`);
  } catch (error) {
    console.error('❌ Error testing queries:', error);
    throw error;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🧪 Newsletter Archive Test Suite');
  console.log('================================\n');

  try {
    // Test collection access
    const totalNewsletters = await testNewsletterCollection();

    if (totalNewsletters > 0) {
      // Test individual document access (use first document)
      const querySnapshot = await getDocs(collection(db, 'newsletters'));
      const firstDoc = querySnapshot.docs[0];
      if (firstDoc) {
        await testNewsletterDocument(firstDoc.id);
      }

      // Test data structure
      await testDataStructure();

      // Test queries
      await testNewsletterQueries();
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Access the archive at http://localhost:9000/archive');
    console.log('2. Verify newsletters display correctly');
    console.log('3. Test search and filtering functionality');
    console.log('4. Generate thumbnails if needed');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testNewsletterCollection, testNewsletterDocument, testDataStructure };
