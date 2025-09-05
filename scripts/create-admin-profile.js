#!/usr/bin/env node

/**
 * Create an admin/editor user profile in Firestore
 * Run this after successfully signing in to give yourself permissions
 *
 * Usage:
 *   node scripts/create-admin-profile.js YOUR_UID_HERE
 *
 * Or set environment variables:
 *   ADMIN_UID=your_uid_here node scripts/create-admin-profile.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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

// Validate Firebase config
const missingVars = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Make sure your .env file is properly configured.');
  process.exit(1);
}

async function createAdminProfile() {
  try {
    // Get UID from command line argument or environment variable
    const userUID = process.argv[2] || process.env.ADMIN_UID;
    const userEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

    if (!userUID) {
      console.error('❌ User UID is required!');
      console.error('Usage: node scripts/create-admin-profile.js YOUR_UID_HERE');
      console.error('Or set ADMIN_UID environment variable');
      process.exit(1);
    }

    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log(`Creating admin user profile for UID: ${userUID}`);

    const userProfile = {
      uid: userUID,
      email: userEmail,
      displayName: 'Admin User',
      role: 'admin', // This gives you full permissions
      permissions: ['read', 'write', 'delete', 'admin', 'editor'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    // Create user profile document
    await setDoc(doc(db, 'userProfiles', userUID), userProfile);

    console.log('✅ Admin user profile created successfully!');
    console.log('User Profile:', userProfile);
    console.log('You now have admin permissions to access all features.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin profile:', error);
    process.exit(1);
  }
}

createAdminProfile();
