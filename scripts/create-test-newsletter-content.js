/**
 * Create Test Newsletter Content
 *
 * This script creates some test content submissions that can be used
 * to test the newsletter generation system.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

const testContent = [
  {
    title: "Welcome to the CLCA Courier Newsletter System!",
    description: "We're excited to announce our new newsletter generation system. This system allows community members to submit content and administrators to create beautiful, professional newsletters with just a few clicks.",
    contentType: "news",
    tags: ["content-type:news", "status:approved", "newsletter:ready"],
    authorId: "system",
    authorName: "CLCA Admin",
    features: {}
  },
  {
    title: "Community BBQ Event - Save the Date!",
    description: "Join us for our annual community BBQ on Saturday, September 20th at the Lake Pavilion. We'll have food, games, and activities for the whole family. Bring your appetite and your friends!",
    contentType: "event",
    tags: ["content-type:event", "status:approved", "newsletter:ready"],
    authorId: "system",
    authorName: "Event Coordinator",
    features: {
      "feat:date": {
        start: new Date("2025-09-20T17:00:00Z"),
        end: new Date("2025-09-20T20:00:00Z"),
        isAllDay: false
      },
      "feat:location": {
        name: "Lake Pavilion",
        address: "123 Lake Dr, Community, TX 75001"
      }
    }
  },
  {
    title: "New Playground Equipment Installed",
    description: "We're thrilled to announce that new playground equipment has been installed at the community park. The new equipment includes a climbing wall, updated swings, and a new slide. Come check it out!",
    contentType: "news",
    tags: ["content-type:news", "status:approved", "newsletter:ready"],
    authorId: "system",
    authorName: "Parks & Recreation",
    features: {}
  },
  {
    title: "Book Club Meeting - This Month's Selection",
    description: "Our book club will be meeting on Thursday, September 25th at 7 PM in the community center. This month we're reading 'The Great Gatsby' by F. Scott Fitzgerald. All are welcome to join the discussion!",
    contentType: "event",
    tags: ["content-type:event", "status:approved", "newsletter:ready"],
    authorId: "system",
    authorName: "Book Club Leader",
    features: {
      "feat:date": {
        start: new Date("2025-09-25T19:00:00Z"),
        end: new Date("2025-09-25T21:00:00Z"),
        isAllDay: false
      },
      "feat:location": {
        name: "Community Center",
        address: "456 Community Way, Community, TX 75001"
      }
    }
  }
];

async function createTestContent() {
  try {
    console.log('🔐 Signing in...');

    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    console.log('✅ Signed in as:', user.uid);

    console.log('📝 Creating test content...');

    for (const content of testContent) {
      const docRef = await addDoc(collection(db, 'content'), {
        ...content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Created content:', content.title, 'ID:', docRef.id);
    }

    console.log('🎉 Test content creation complete!');
    console.log('You can now test the newsletter generation system with this content.');

  } catch (error) {
    console.error('❌ Content creation failed:', error);
  }
}

// Run the content creation
createTestContent();




