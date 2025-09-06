#!/usr/bin/env node

/**
 * Create test newsletter documents in Firestore
 * This populates the newsletters collection so the admin interface can load data
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables
config();

// Get Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

async function createTestNewsletters() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const newsletters = [
      {
        title: 'Summer 2024 Conashaugh Courier',
        filename: '2024.summer-conashaugh-courier.pdf',
        year: 2024,
        season: 'summer',
        issueNumber: 'Summer 2024',
        downloadUrl: '/issues/2024.summer-conashaugh-courier.pdf',
        isPublished: true,
        tags: ['community', 'summer', 'events'],
        category: 'newsletter',
        description: 'Summer edition featuring community events and updates',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        title: 'Winter 2023 Conashaugh Courier',
        filename: '2023.winter-conashaugh-courier.pdf',
        year: 2023,
        season: 'winter',
        issueNumber: 'Winter 2023',
        downloadUrl: '/issues/2023.winter-conashaugh-courier.pdf',
        isPublished: true,
        tags: ['community', 'winter', 'holidays'],
        category: 'newsletter',
        description: 'Winter edition with holiday greetings and year-end updates',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    ];

    console.log('Creating test newsletter documents...');

    for (const newsletter of newsletters) {
      const docRef = await addDoc(collection(db, 'newsletters'), newsletter);
      console.log(`✅ Created newsletter: ${newsletter.title} (ID: ${docRef.id})`);
    }

    console.log('🎉 Test newsletters created successfully!');
    console.log('You can now access the admin interface and see the newsletter data.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test newsletters:', error);
    process.exit(1);
  }
}

createTestNewsletters();
