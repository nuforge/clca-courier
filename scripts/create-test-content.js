/**
 * Firebase Content Test Script
 * Creates test content directly in the ContentDoc collection to verify the system is working
 */

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase config (using environment variables)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestContent() {
  console.log('Creating test content in ContentDoc collection...');

  const testContent = {
    title: 'Welcome to the New Community Content System',
    description: 'This is the first piece of content created using the new ContentDoc architecture. The system now supports real-time updates, tag-based filtering, and composable features.',
    authorId: 'test-user-id',
    authorName: 'System Administrator',
    tags: ['content-type:news', 'category:announcement', 'priority:high'],
    features: {},
    status: 'published',
    timestamps: {
      created: serverTimestamp(),
      updated: serverTimestamp(),
      published: serverTimestamp()
    }
  };

  try {
    const contentCollection = collection(db, 'content');
    const docRef = await addDoc(contentCollection, testContent);

    console.log('✅ Test content created successfully!');
    console.log('Content ID:', docRef.id);
    console.log('Content will appear on the community page at /community');

    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to create test content:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  createTestContent()
    .then((id) => {
      console.log(`\n🎉 SUCCESS! Test content created with ID: ${id}`);
      console.log('Visit http://localhost:9000/community to see the content');
    })
    .catch((error) => {
      console.error('\n💥 FAILED:', error.message);
      process.exit(1);
    });
}

export { createTestContent };
