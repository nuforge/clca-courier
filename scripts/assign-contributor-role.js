/**
 * IMMEDIATE FIX: Assign Contributor Role
 * This will fix the access issue right now
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q",
  authDomain: "clca-courier-27aed.firebaseapp.com",
  projectId: "clca-courier-27aed",
  storageBucket: "clca-courier-27aed.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function assignContributorRole() {
  try {
    console.log('🔧 Assigning contributor role to clcacourier@gmail.com...');

    // User ID from the logs
    const userId = 'FOPs6aUNr0MB4iAuvk7x3mbUeRN2';

    // Create/update user profile with contributor role
    await setDoc(doc(db, 'userProfiles', userId), {
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

    console.log('✅ SUCCESS! User now has contributor role and can access Content Management page!');
    console.log('🔄 Please refresh the page to see the changes.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

assignContributorRole();
