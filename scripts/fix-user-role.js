/**
 * Quick Fix: Assign Contributor Role to User
 * This script assigns the contributor role to a specific user so they can access the Content Management page
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q",
  authDomain: "clca-courier-27aed.firebaseapp.com",
  projectId: "clca-courier-27aed",
  storageBucket: "clca-courier-27aed.firebasestorage.app",
  appId: "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function fixUserRole() {
  try {
    console.log('🔧 Fixing user role for clcacourier@gmail.com...');

    // Sign in as admin (you'll need to replace with actual admin credentials)
    // For now, we'll work with the user ID directly
    const userId = 'FOPs6aUNr0MB4iAuvk7x3mbUeRN2'; // This is the UID from the logs

    // Check if user profile exists
    const userProfileRef = doc(db, 'userProfiles', userId);
    const userProfileDoc = await getDoc(userProfileRef);

    if (userProfileDoc.exists()) {
      console.log('✅ User profile exists, updating role...');

      // Update the user profile with contributor role
      await setDoc(userProfileRef, {
        role: 'contributor',
        permissions: ['content:read', 'content:create', 'content:update', 'newsletter:read', 'design:create', 'theme:read', 'theme:update'],
        isApproved: true,
        approvedBy: 'system',
        approvalDate: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }, { merge: true });

      console.log('✅ User role updated to contributor successfully!');
    } else {
      console.log('❌ User profile not found. Creating new profile...');

      // Create new user profile with contributor role
      await setDoc(userProfileRef, {
        uid: userId,
        email: 'clcacourier@gmail.com',
        displayName: 'CLCA Courier Admin',
        role: 'contributor',
        permissions: ['content:read', 'content:create', 'content:update', 'newsletter:read', 'design:create', 'theme:read', 'theme:update'],
        isApproved: true,
        approvedBy: 'system',
        approvalDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        tags: [],
        availability: 'regular',
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          preferredCategories: [],
          taskAssignments: true
        }
      });

      console.log('✅ User profile created with contributor role!');
    }

    console.log('🎉 User role fix completed! The user should now be able to access the Content Management page.');

  } catch (error) {
    console.error('❌ Error fixing user role:', error);
  }
}

// Run the fix
fixUserRole();
