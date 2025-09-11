/**
 * Direct Firebase Config Creation
 * Creates the missing app/config document with minimal template configuration
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration (using environment or default)
const firebaseConfig = {
  apiKey: "AIzaSyDDZNOmZhCgRWjxMvYPNNhqQaTKF5xfKkg",
  authDomain: "clca-courier-27aed.firebaseapp.com",
  projectId: "clca-courier-27aed",
  storageBucket: "clca-courier-27aed.firebasestorage.app",
  messagingSenderId: "905883547621",
  appId: "1:905883547621:web:e4b1ac47583c5a21dd32b6",
  measurementId: "G-0TEFQHPMQB"
};

// Sample Canva templates (minimal set)
const sampleTemplates = [
  {
    id: 'sample-newsletter-template',
    name: 'Community Newsletter',
    description: 'Standard newsletter template for community content',
    type: 'newsletter',
    canvaDesignId: null,
    thumbnailUrl: null,
    isActive: true,
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
        placeholder: 'Newsletter Title'
      },
      {
        name: 'content',
        type: 'text',
        required: true,
        placeholder: 'Main content'
      }
    ]
  },
  {
    id: 'sample-announcement-template',
    name: 'Community Announcement',
    description: 'Template for community announcements and notices',
    type: 'announcement',
    canvaDesignId: null,
    thumbnailUrl: null,
    isActive: true,
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
        placeholder: 'Announcement Title'
      },
      {
        name: 'message',
        type: 'text',
        required: true,
        placeholder: 'Announcement message'
      }
    ]
  }
];

async function createAppConfig() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('📄 Creating app/config document...');
    const configRef = doc(db, 'app', 'config');

    const configData = {
      canvaTemplates: sampleTemplates,
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString()
    };

    await setDoc(configRef, configData);

    console.log('✅ Successfully created app/config document');
    console.log(`📊 Added ${sampleTemplates.length} sample templates`);
    console.log('🎯 Templates:', sampleTemplates.map(t => t.name).join(', '));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating app config:', error);
    process.exit(1);
  }
}

createAppConfig();
