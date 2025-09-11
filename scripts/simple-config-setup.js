/**
 * Production-Ready Canva Template Setup
 * Creates a comprehensive app/config document with validation,
 * error handling, and environment-specific configuration
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get script directory for relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file if available
function loadEnvVars() {
  try {
    const envPath = join(__dirname, '../.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    // Set environment variables
    Object.entries(envVars).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });

    console.log('✅ Environment variables loaded from .env file');
  } catch (error) {
    console.warn('⚠️ Could not load .env file, using system environment variables only');
  }
}

// Load environment variables
loadEnvVars();

// Firebase configuration with validation
function getFirebaseConfig() {
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    console.error('❌ Missing required Firebase configuration fields:', missingFields);
    console.error('Please ensure these environment variables are set:');
    missingFields.forEach(field => {
      console.error(`  - VITE_FIREBASE_${field.toUpperCase().replace(/([A-Z])/g, '_$1')}`);
    });
    process.exit(1);
  }

  return config;
}

// Sample Canva templates with comprehensive configuration
const productionTemplates = [
  {
    id: 'newsletter-template-01',
    name: 'Community Newsletter - Standard',
    description: 'Standard layout for community newsletters with header, content sections, and footer',
    type: 'newsletter',
    canvaDesignId: null, // Set this to actual Canva template ID when available
    thumbnailUrl: null, // Set this to template thumbnail URL when available
    isActive: true,
    category: 'newsletter',
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
        placeholder: 'Newsletter Title',
        maxLength: 100,
        validation: 'required|string|max:100'
      },
      {
        name: 'subtitle',
        type: 'text',
        required: false,
        placeholder: 'Newsletter Subtitle',
        maxLength: 200,
        validation: 'string|max:200'
      },
      {
        name: 'content',
        type: 'richtext',
        required: true,
        placeholder: 'Main newsletter content',
        maxLength: 5000,
        validation: 'required|string|max:5000'
      },
      {
        name: 'issue_date',
        type: 'date',
        required: true,
        placeholder: 'Issue Date',
        validation: 'required|date'
      },
      {
        name: 'issue_number',
        type: 'text',
        required: false,
        placeholder: 'Issue #',
        maxLength: 20,
        validation: 'string|max:20'
      }
    ],
    metadata: {
      createdBy: 'system',
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }
  },
  {
    id: 'announcement-template-01',
    name: 'Community Announcement - Urgent',
    description: 'Eye-catching template for urgent community announcements',
    type: 'announcement',
    canvaDesignId: null,
    thumbnailUrl: null,
    isActive: true,
    category: 'announcement',
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
        placeholder: 'Announcement Title',
        maxLength: 80,
        validation: 'required|string|max:80'
      },
      {
        name: 'urgency',
        type: 'select',
        required: true,
        placeholder: 'Urgency Level',
        options: ['low', 'medium', 'high', 'urgent'],
        validation: 'required|in:low,medium,high,urgent'
      },
      {
        name: 'message',
        type: 'textarea',
        required: true,
        placeholder: 'Announcement message',
        maxLength: 1000,
        validation: 'required|string|max:1000'
      },
      {
        name: 'contact_info',
        type: 'text',
        required: false,
        placeholder: 'Contact information',
        maxLength: 200,
        validation: 'string|max:200'
      }
    ],
    metadata: {
      createdBy: 'system',
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }
  },
  {
    id: 'event-template-01',
    name: 'Community Event - Standard',
    description: 'Template for community events with date, time, and location fields',
    type: 'event',
    canvaDesignId: null,
    thumbnailUrl: null,
    isActive: true,
    category: 'event',
    fields: [
      {
        name: 'event_title',
        type: 'text',
        required: true,
        placeholder: 'Event Title',
        maxLength: 100,
        validation: 'required|string|max:100'
      },
      {
        name: 'event_date',
        type: 'date',
        required: true,
        placeholder: 'Event Date',
        validation: 'required|date|after:today'
      },
      {
        name: 'event_time',
        type: 'time',
        required: true,
        placeholder: 'Event Time',
        validation: 'required|time'
      },
      {
        name: 'location',
        type: 'text',
        required: true,
        placeholder: 'Event Location',
        maxLength: 200,
        validation: 'required|string|max:200'
      },
      {
        name: 'description',
        type: 'textarea',
        required: true,
        placeholder: 'Event Description',
        maxLength: 2000,
        validation: 'required|string|max:2000'
      },
      {
        name: 'capacity',
        type: 'number',
        required: false,
        placeholder: 'Max Attendees',
        validation: 'integer|min:1|max:10000'
      }
    ],
    metadata: {
      createdBy: 'system',
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }
  }
];

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Main setup function
async function createProductionConfig() {
  try {
    console.log('🚀 Starting production Canva template configuration...');
    console.log(`📍 Firebase Project: ${firebaseConfig.projectId}`);

    const configRef = doc(db, 'app', 'config');

    // Check if configuration already exists
    console.log('🔍 Checking existing configuration...');
    const existingDoc = await getDoc(configRef);

    if (existingDoc.exists()) {
      const existingData = existingDoc.data();
      console.log('⚠️  Configuration document already exists');

      // Ask for confirmation to overwrite (in a real CLI, you'd use readline)
      console.log('📊 Existing templates:', existingData.canvaTemplates?.length || 0);
      console.log('🔄 This will update the configuration with new templates');
    }

    // Prepare configuration document
    const configData = {
      canvaTemplates: productionTemplates,
      templateCategories: ['newsletter', 'announcement', 'event', 'classified'],

      // System metadata
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      lastUpdated: Timestamp.now(),
      createdAt: existingDoc.exists() ? existingDoc.data().createdAt : Timestamp.now(),

      // Feature flags
      features: {
        canvaIntegration: true,
        templateSelection: true,
        autofillEnabled: true,
        exportEnabled: true,
        printWorkflow: true
      },

      // Configuration settings
      settings: {
        maxTemplatesPerCategory: 10,
        templateCacheTimeout: 3600, // 1 hour in seconds
        autofillValidation: true,
        requireTemplateApproval: false
      },

      // Security settings
      security: {
        sanitizeAutofillData: true,
        validateTemplateUrls: true,
        maxFieldLength: 10000,
        allowedDomains: ['canva.com', 'www.canva.com']
      }
    };

    // Write to Firestore
    console.log('💾 Writing configuration to Firestore...');
    await setDoc(configRef, configData, { merge: true });

    console.log('✅ Production configuration created successfully!');
    console.log('📊 Templates configured:', configData.canvaTemplates.length);
    console.log('🎨 Template categories:', configData.templateCategories.join(', '));
    console.log('🔧 Features enabled:', Object.keys(configData.features).filter(key => configData.features[key]).join(', '));

    // Validate the written configuration
    console.log('🔍 Validating written configuration...');
    const validationDoc = await getDoc(configRef);

    if (!validationDoc.exists()) {
      throw new Error('Configuration document was not created successfully');
    }

    const validationData = validationDoc.data();
    if (!validationData.canvaTemplates || !Array.isArray(validationData.canvaTemplates)) {
      throw new Error('Templates array is missing or invalid');
    }

    if (validationData.canvaTemplates.length !== productionTemplates.length) {
      throw new Error(`Template count mismatch: expected ${productionTemplates.length}, got ${validationData.canvaTemplates.length}`);
    }

    console.log('✅ Configuration validation passed');
    console.log('');
    console.log('🎉 Setup complete! Next steps:');
    console.log('1. Update template canvaDesignId fields with actual Canva template IDs');
    console.log('2. Add thumbnail URLs for better user experience');
    console.log('3. Test the integration with the frontend application');
    console.log('4. Configure OAuth credentials for Canva Connect API');

  } catch (error) {
    console.error('❌ Error creating production configuration:', error);

    if (error.code === 'permission-denied') {
      console.error('');
      console.error('🔒 Permission denied. Please ensure:');
      console.error('1. Firebase project is correctly configured');
      console.error('2. Service account has Firestore write permissions');
      console.error('3. Firestore security rules allow admin access');
    } else if (error.code === 'unavailable') {
      console.error('');
      console.error('🌐 Firebase is unavailable. Please check:');
      console.error('1. Internet connection');
      console.error('2. Firebase project status');
      console.error('3. Service availability');
    }

    process.exit(1);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
const forceUpdate = args.includes('--force') || args.includes('-f');
const dryRun = args.includes('--dry-run') || args.includes('-d');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made');
  console.log('📊 Templates to be configured:', productionTemplates.length);
  productionTemplates.forEach((template, index) => {
    console.log(`  ${index + 1}. ${template.name} (${template.type})`);
  });
  console.log('');
  console.log('Run without --dry-run to apply changes');
  process.exit(0);
}

// Run the setup
createProductionConfig().then(() => {
  console.log('🎉 Production setup complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Setup failed:', error.message);
  process.exit(1);
});
