/**
 * Setup Sample Canva Templates
 *
 * Script to create sample Canva Brand Templates in Firestore
 * for testing the template selector and autofill functionality.
 *
 * Run with: node scripts/setup-canva-templates.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration (from .env)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample template configurations
const sampleTemplates = [
  {
    id: 'TPL_NEWSLETTER_ARTICLE',
    name: 'Newsletter Article Layout',
    description: 'Professional article layout with header, body text, and footer space for newsletter inclusion',
    contentTypes: ['article', 'announcement'],
    fieldMapping: {
      'articleTitle': 'title',
      'articleContent': 'content',
      'authorName': 'author.displayName',
      'publicationDate': 'submittedAt'
    },
    thumbnailUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'TPL_EVENT_FLYER',
    name: 'Event Flyer Template',
    description: 'Eye-catching event flyer design with date, time, location, and description areas',
    contentTypes: ['event'],
    fieldMapping: {
      'eventTitle': 'title',
      'eventDescription': 'content',
      'eventDate': 'metadata.startDate',
      'eventTime': 'metadata.eventTime',
      'eventLocation': 'metadata.location'
    },
    thumbnailUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'TPL_CLASSIFIED_AD',
    name: 'Classified Advertisement',
    description: 'Clean classified ad layout for items for sale, services, and housing listings',
    contentTypes: ['classified'],
    fieldMapping: {
      'itemTitle': 'title',
      'itemDescription': 'content',
      'itemPrice': 'metadata.price',
      'contactInfo': 'metadata.contactEmail'
    },
    thumbnailUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function setupTemplates() {
  try {
    console.log('Setting up sample Canva templates...');

    // Create the config document with templates
    const configRef = doc(db, 'app/config');
    await setDoc(configRef, {
      canvaTemplates: sampleTemplates,
      updatedAt: new Date(),
      updatedBy: 'setup-script'
    }, { merge: true });

    console.log('✅ Sample templates created successfully!');
    console.log(`📋 Created ${sampleTemplates.length} templates:`);

    sampleTemplates.forEach(template => {
      console.log(`  - ${template.name} (${template.id})`);
      console.log(`    Content Types: ${template.contentTypes.join(', ')}`);
      console.log(`    Field Mappings: ${Object.keys(template.fieldMapping).length} fields`);
      console.log('');
    });

    console.log('🎨 Templates are now available in the content submission form!');

  } catch (error) {
    console.error('❌ Error setting up templates:', error);
    process.exit(1);
  }
}

// Run the setup
setupTemplates().then(() => {
  console.log('Setup complete!');
  process.exit(0);
});
