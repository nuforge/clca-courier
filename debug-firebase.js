/**
 * Debug script to test Firebase submission
 */

import { firestore } from './src/config/firebase.config.js';
import { firebaseAuthService } from './src/services/firebase-auth.service.js';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

async function debugSubmission() {
  console.log('🔍 Starting Firebase debug session...');

  // Check authentication
  const currentUser = firebaseAuthService.getCurrentUser();
  console.log(
    '👤 Current user:',
    currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
        }
      : 'Not authenticated',
  );

  if (!currentUser) {
    console.log('❌ User not authenticated. Please log in first.');
    return;
  }

  try {
    // Check existing content
    console.log('📊 Checking existing content...');
    const q = query(
      collection(firestore, 'userContent'),
      where('author.uid', '==', currentUser.uid),
    );

    const querySnapshot = await getDocs(q);
    console.log(`📝 Found ${querySnapshot.size} existing submissions`);

    querySnapshot.forEach((doc) => {
      console.log('📄 Document:', doc.id, doc.data());
    });

    // Test submission
    console.log('🧪 Testing new submission...');
    const testData = {
      type: 'article',
      title: 'Debug Test Article - ' + new Date().toISOString(),
      author: {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous',
        email: currentUser.email || '',
      },
      content: 'This is a test article created for debugging purposes.',
      status: 'submitted',
      metadata: {
        subtitle: 'Debug Test',
        readTime: 1,
        tags: ['debug', 'test'],
      },
      attachments: [],
      reviewHistory: [
        {
          id: `initial_${Date.now()}`,
          reviewerId: currentUser.uid,
          reviewerName: currentUser.displayName || 'Author',
          timestamp: Date.now(),
          status: 'submitted',
          feedback: 'Initial submission',
        },
      ],
      submittedAt: Date.now(),
      priority: 'medium',
      category: 'debug',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const docRef = await addDoc(collection(firestore, 'userContent'), {
      ...testData,
      submittedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Test submission successful! Document ID:', docRef.id);
    console.log('📍 Check Firebase Console: Firestore Database > userContent collection');
  } catch (error) {
    console.error('❌ Debug session failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Run the debug session
debugSubmission();
