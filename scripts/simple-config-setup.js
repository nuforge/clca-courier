/**
 * Simple Canva Template Setup
 * Creates a minimal app/config document for testing
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration (from environment variables)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyACwH9AJZlSYVPdA4dNNb8G3iwIiFto9oY',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'clca-courier-27aed.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'clca-courier-27aed',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'clca-courier-27aed.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1008202516083',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:1008202516083:web:8b846c50c0a00c3e198c06',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createSimpleConfig() {
  try {
    console.log('Creating simple app/config document...');

    // Create a minimal config first
    const configRef = doc(db, 'app', 'config');
    await setDoc(configRef, {
      canvaTemplates: [],
      setupComplete: true,
      createdAt: Timestamp.now()
    });

    console.log('✅ Simple config document created successfully!');
    console.log('The canvaTemplates array is empty but accessible.');

  } catch (error) {
    console.error('❌ Error creating config:', error);
    process.exit(1);
  }
}

// Run the setup
createSimpleConfig().then(() => {
  console.log('Simple setup complete!');
  process.exit(0);
});
