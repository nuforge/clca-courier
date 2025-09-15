/**
 * Create Sample Newsletter Content
 *
 * This script creates sample content that can be used to test the newsletter workflow.
 * It creates published content with the newsletter:ready tag.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration (you'll need to update this with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample content data
const sampleContent = [
  {
    title: "Community Garden Update - Fall 2025",
    description: "Exciting news about our community garden expansion and upcoming fall planting schedule.",
    authorId: "admin-user-id", // You'll need to replace this with an actual user ID
    authorName: "Community Admin",
    tags: [
      "content-type:news",
      "newsletter:ready",
      "featured:true",
      "category:community"
    ],
    features: {},
    status: "published",
    timestamps: {
      created: serverTimestamp(),
      updated: serverTimestamp(),
      published: serverTimestamp()
    }
  },
  {
    title: "Annual Community Meeting - October 15th",
    description: "Join us for our annual community meeting where we'll discuss upcoming projects and community initiatives.",
    authorId: "admin-user-id",
    authorName: "Community Admin",
    tags: [
      "content-type:event",
      "newsletter:ready",
      "feat:date",
      "category:events"
    ],
    features: {
      "feat:date": {
        start: new Date("2025-10-15T19:00:00"),
        end: new Date("2025-10-15T21:00:00"),
        isAllDay: false
      }
    },
    status: "published",
    timestamps: {
      created: serverTimestamp(),
      updated: serverTimestamp(),
      published: serverTimestamp()
    }
  },
  {
    title: "New Walking Trail Opens",
    description: "The new walking trail around the lake is now open for community use. Perfect for morning walks and evening strolls.",
    authorId: "admin-user-id",
    authorName: "Community Admin",
    tags: [
      "content-type:announcement",
      "newsletter:ready",
      "feat:location",
      "category:facilities"
    ],
    features: {
      "feat:location": {
        address: "Conashaugh Lakes Community",
        coordinates: {
          lat: 41.8781,
          lng: -87.6298
        }
      }
    },
    status: "published",
    timestamps: {
      created: serverTimestamp(),
      updated: serverTimestamp(),
      published: serverTimestamp()
    }
  },
  {
    title: "Community Garage Sale - September 28th",
    description: "Annual community garage sale featuring items from over 50 households. Great deals and community bonding!",
    authorId: "admin-user-id",
    authorName: "Community Admin",
    tags: [
      "content-type:event",
      "newsletter:ready",
      "feat:date",
      "category:events"
    ],
    features: {
      "feat:date": {
        start: new Date("2025-09-28T08:00:00"),
        end: new Date("2025-09-28T14:00:00"),
        isAllDay: false
      }
    },
    status: "published",
    timestamps: {
      created: serverTimestamp(),
      updated: serverTimestamp(),
      published: serverTimestamp()
    }
  },
  {
    title: "Swimming Pool Maintenance Schedule",
    description: "Important information about upcoming pool maintenance and temporary closures.",
    authorId: "admin-user-id",
    authorName: "Community Admin",
    tags: [
      "content-type:announcement",
      "newsletter:ready",
      "category:facilities"
    ],
    features: {},
    status: "published",
    timestamps: {
      created: serverTimestamp(),
      updated: serverTimestamp(),
      published: serverTimestamp()
    }
  }
];

async function createSampleContent() {
  try {
    console.log('Creating sample newsletter content...');

    const contentCollection = collection(db, 'content');
    const createdContent = [];

    for (const contentData of sampleContent) {
      const docRef = await addDoc(contentCollection, contentData);
      createdContent.push({
        id: docRef.id,
        title: contentData.title
      });
      console.log(`Created content: ${contentData.title} (ID: ${docRef.id})`);
    }

    console.log(`\n✅ Successfully created ${createdContent.length} sample content items:`);
    createdContent.forEach(content => {
      console.log(`  - ${content.title} (${content.id})`);
    });

    console.log('\n📰 These content items are now available for newsletter inclusion!');
    console.log('   Go to the Newsletter Management page to create a newsletter issue and add this content.');

  } catch (error) {
    console.error('❌ Error creating sample content:', error);
  }
}

// Run the script
createSampleContent();
