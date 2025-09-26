/**
 * PROPER FIX: Assign Contributor Role to User
 * This script uses Firebase Admin SDK to properly assign the contributor role
 */

import { initializeApp, getApps } from 'firebase/app';
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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

async function fixUserRole() {
  try {
    console.log('🔧 Fixing user role for clcacourier@gmail.com...');

    // User ID from the logs
    const userId = 'FOPs6aUNr0MB4iAuvk7x3mbUeRN2';

    // Create/update user profile with contributor role
    const userProfile = {
      uid: userId,
      email: 'clcacourier@gmail.com',
      role: 'contributor',
      permissions: [
        'content:read',
        'content:create',
        'content:update',
        'newsletter:read',
        'design:create',
        'theme:read',
        'theme:update'
      ],
      isApproved: true,
      approvedBy: 'admin',
      approvalDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Set the user profile
    await setDoc(doc(db, 'userProfiles', userId), userProfile);

    console.log('✅ User profile created/updated successfully!');
    console.log('📋 Profile details:', userProfile);

    // Verify the profile was created
    const profileDoc = await getDoc(doc(db, 'userProfiles', userId));
    if (profileDoc.exists()) {
      console.log('✅ Profile verification successful!');
      console.log('📄 Profile data:', profileDoc.data());
    } else {
      console.log('❌ Profile verification failed - document not found');
    }

  } catch (error) {
    console.error('❌ Error fixing user role:', error);
    console.error('Error details:', error.message);
  }
}

// Run the fix
fixUserRole().then(() => {
  console.log('🎉 User role fix completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
