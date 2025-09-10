/**
 * Update Firebase Firestore Word Counts
 *
 * This script reads the word count data from the PDF text extraction file
 * and updates the Firebase Firestore newsletter documents with the actual word counts.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, updateDoc, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration - use environment variables
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
const db = getFirestore(app);

// File paths
const extractionDataPath = path.join(__dirname, '../docs/pdf-text-extraction-2025-09-04.json');

console.log('📊 Starting Firebase word count update process...');

try {
  // Read the extraction data (contains actual word counts)
  console.log('📖 Reading PDF text extraction data...');
  const extractionData = JSON.parse(fs.readFileSync(extractionDataPath, 'utf8'));

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

  // Get all newsletters from Firestore
  console.log('📡 Fetching newsletters from Firebase Firestore...');
  const newslettersRef = collection(db, 'newsletters');
  const snapshot = await getDocs(newslettersRef);

  console.log(`📄 Found ${snapshot.size} documents in Firestore`);

  // Update each document with word count
  let updatedCount = 0;
  for (const docSnapshot of snapshot.docs) {
    const newsletter = docSnapshot.data();
    const filename = newsletter.filename;

    if (!filename) {
      console.log(`⚠️  Skipping document ${docSnapshot.id} - no filename`);
      continue;
    }

    const wordCount = wordCountMap.get(filename);
    if (wordCount) {
      try {
        await updateDoc(doc(db, 'newsletters', docSnapshot.id), {
          wordCount: wordCount,
        });
        updatedCount++;
        console.log(`📝 Updated ${filename}: ${wordCount.toLocaleString()} words`);
      } catch (error) {
        console.error(`❌ Failed to update ${filename}:`, error);
      }
    } else {
      // Set to 0 if no word count found
      try {
        await updateDoc(doc(db, 'newsletters', docSnapshot.id), {
          wordCount: 0,
        });
        console.log(`⚠️  No word count found for ${filename}, setting to 0`);
      } catch (error) {
        console.error(`❌ Failed to update ${filename} to 0:`, error);
      }
    }
  }

  console.log(`✅ Successfully updated word counts for ${updatedCount} newsletters in Firebase!`);
  console.log(`📊 Total newsletters processed: ${snapshot.size}`);

  // Show some statistics
  const totalWords = Array.from(wordCountMap.values()).reduce((sum, count) => sum + count, 0);
  const avgWords = Math.round(totalWords / wordCountMap.size);

  console.log('\n📈 Statistics:');
  console.log(`   Total words across all newsletters: ${totalWords.toLocaleString()}`);
  console.log(`   Average words per newsletter: ${avgWords.toLocaleString()}`);
  console.log(`   Newsletters with word counts: ${updatedCount}/${snapshot.size}`);
} catch (error) {
  console.error('❌ Error updating Firebase word counts:', error);
  process.exit(1);
}
