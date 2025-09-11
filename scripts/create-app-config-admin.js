/**
 * Firebase Admin Config Creation
 * Uses Firebase Admin SDK to bypass security rules and create app/config document
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin (uses default service account from environment)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'clca-courier-27aed'
  });
}

const db = admin.firestore();

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

async function createAppConfigAdmin() {
  try {
    console.log('🔥 Using Firebase Admin SDK...');

    console.log('📄 Creating app/config document...');
    const configRef = db.collection('app').doc('config');

    const configData = {
      canvaTemplates: sampleTemplates,
      version: '1.0.0',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      created: admin.firestore.FieldValue.serverTimestamp()
    };

    await configRef.set(configData);

    console.log('✅ Successfully created app/config document');
    console.log(`📊 Added ${sampleTemplates.length} sample templates`);
    console.log('🎯 Templates:', sampleTemplates.map(t => t.name).join(', '));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating app config:', error);
    process.exit(1);
  }
}

createAppConfigAdmin();
