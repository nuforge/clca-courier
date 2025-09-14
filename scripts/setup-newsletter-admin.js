/**
 * Setup Newsletter Admin Role
 *
 * This script helps set up the proper user role for newsletter management.
 * Run this script to ensure your user has the 'editor' role needed for newsletter operations.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase config (you'll need to update this with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "clca-courier-27aed",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setupNewsletterAdmin() {
  try {
    console.log('🔐 Setting up newsletter admin role...');

    // Sign in anonymously (you can change this to your preferred auth method)
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    console.log('✅ Signed in as:', user.uid);

    // Check if user profile exists
    const userProfileRef = doc(db, 'userProfiles', user.uid);
    const userProfileDoc = await getDoc(userProfileRef);

    if (userProfileDoc.exists()) {
      console.log('📋 User profile exists:', userProfileDoc.data());

      // Update role to editor if not already
      const currentRole = userProfileDoc.data().role;
      if (currentRole !== 'editor' && currentRole !== 'admin') {
        await setDoc(userProfileRef, {
          role: 'editor',
          updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log('✅ Updated user role to "editor"');
      } else {
        console.log('✅ User already has sufficient role:', currentRole);
      }
    } else {
      // Create new user profile with editor role
      await setDoc(userProfileRef, {
        role: 'editor',
        email: user.email || 'anonymous@example.com',
        displayName: 'Newsletter Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Created new user profile with "editor" role');
    }

    console.log('🎉 Newsletter admin setup complete!');
    console.log('You can now access the newsletter management system.');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupNewsletterAdmin();




