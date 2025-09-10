#!/usr/bin/env node

/**
 * SECURE Admin Profile Creator
 * This script should ONLY be run by server administrators
 *
 * SECURITY NOTICE:
 * - This bypasses normal user creation security
 * - Only run this for trusted administrators
 * - Consider using Firebase Admin SDK with service account for production
 *
 * Usage:
 *   node scripts/secure-admin-creator.js UID EMAIL
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

async function createSecureAdminProfile() {
  try {
    // Get UID and email from command line
    const userUID = process.argv[2];
    const userEmail = process.argv[3];

    if (!userUID || !userEmail) {
      console.error('❌ Both UID and email are required!');
      console.error('Usage: node scripts/secure-admin-creator.js UID EMAIL');
      console.error('Example: node scripts/secure-admin-creator.js xyz123 admin@example.com');
      process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    console.log('⚠️  SECURITY WARNING: Creating admin profile with full privileges');
    console.log(`   UID: ${userUID}`);
    console.log(`   Email: ${userEmail}`);
    console.log('   This bypasses normal security restrictions');

    // Confirm action
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Continue? (type "YES" to confirm): ', resolve);
    });
    rl.close();

    if (answer !== 'YES') {
      console.log('Operation cancelled');
      process.exit(0);
    }

    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const adminProfile = {
      uid: userUID,
      email: userEmail,
      displayName: 'System Administrator',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin', 'editor', 'manage_users'],
      isApproved: true,
      approvedBy: 'system',
      approvalDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        preferredCategories: []
      }
    };

    // Create admin profile document - this bypasses Firestore security rules
    await setDoc(doc(db, 'userProfiles', userUID), adminProfile);

    console.log('✅ Secure admin profile created successfully!');
    console.log('🔐 Security Note: This user now has full admin privileges');
    console.log('📧 Notify the user that their account is ready');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin profile:', error);
    process.exit(1);
  }
}

createSecureAdminProfile();
