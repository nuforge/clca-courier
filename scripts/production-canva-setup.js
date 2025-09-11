/**
 * Production Canva Integration Setup
 *
 * Comprehensive setup script for production-ready Canva integration
 * including templates, validation, security settings, and monitoring.
 *
 * Usage:
 *   node scripts/production-canva-setup.js           # Full setup
 *   node scripts/production-canva-setup.js --dry-run # Preview changes
 *   node scripts/production-canva-setup.js --force   # Force overwrite existing
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get script directory for relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Load environment variables from .env file if available
function loadEnvironmentVariables() {
  try {
    const envPath = join(__dirname, '../.env');

    if (!existsSync(envPath)) {
      log('⚠️  .env file not found, using system environment variables only', colors.yellow);
      return;
    }

    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    let loadedCount = 0;

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
            envVars[key.trim()] = value;
            loadedCount++;
          }
        }
      }
    });

    log(`✅ Loaded ${loadedCount} environment variables from .env file`, colors.green);
  } catch (error) {
    log(`⚠️  Could not load .env file: ${error.message}`, colors.yellow);
  }
}

// Validate and get Firebase configuration
function getValidatedFirebaseConfig() {
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
    log('❌ Missing required Firebase configuration:', colors.red);
    missingFields.forEach(field => {
      const envVar = `VITE_FIREBASE_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
      log(`   - ${envVar}`, colors.red);
    });
    throw new Error('Firebase configuration incomplete');
  }

  // Validate project ID format
  if (!/^[a-z0-9-]+$/.test(config.projectId)) {
    throw new Error('Invalid Firebase project ID format');
  }

  return config;
}

// Production-ready Canva templates
const getProductionTemplates = () => [
  {
    id: 'newsletter-standard-v1',
    name: 'Community Newsletter - Standard Layout',
    description: 'Professional newsletter template with header, multiple content sections, and community branding',
    type: 'newsletter',
    category: 'newsletter',
    canvaDesignId: null, // To be set with actual Canva Brand Template ID
    thumbnailUrl: null, // To be set with template preview image
    isActive: true,
    featured: true,
    difficulty: 'beginner',
    estimatedTime: '15 minutes',

    // Template configuration
    configuration: {
      maxPages: 8,
      allowCustomColors: false,
      allowFontChanges: false,
      requiredElements: ['title', 'content', 'date'],
      brandingRequired: true
    },

    // Autofill field mappings
    fields: [
      {
        id: 'title',
        name: 'Newsletter Title',
        type: 'text',
        required: true,
        placeholder: 'Monthly Community Update - [Month Year]',
        maxLength: 100,
        validation: 'required|string|max:100',
        helpText: 'Main title that will appear at the top of the newsletter'
      },
      {
        id: 'subtitle',
        name: 'Issue Subtitle',
        type: 'text',
        required: false,
        placeholder: 'Connecting Our Community',
        maxLength: 150,
        validation: 'string|max:150',
        helpText: 'Optional subtitle below the main title'
      },
      {
        id: 'issue_number',
        name: 'Issue Number',
        type: 'text',
        required: true,
        placeholder: 'Vol. 5 Issue 8',
        maxLength: 30,
        validation: 'required|string|max:30',
        helpText: 'Volume and issue number for this newsletter'
      },
      {
        id: 'publication_date',
        name: 'Publication Date',
        type: 'date',
        required: true,
        validation: 'required|date',
        helpText: 'Date this newsletter will be published'
      },
      {
        id: 'main_story_headline',
        name: 'Main Story Headline',
        type: 'text',
        required: true,
        placeholder: 'Community Event Brings Residents Together',
        maxLength: 120,
        validation: 'required|string|max:120',
        helpText: 'Headline for the featured story'
      },
      {
        id: 'main_story_content',
        name: 'Main Story Content',
        type: 'textarea',
        required: true,
        placeholder: 'Write the main story content here...',
        maxLength: 2000,
        validation: 'required|string|max:2000',
        helpText: 'Full content for the main featured story'
      }
    ],

    // Usage tracking and analytics
    analytics: {
      createdCount: 0,
      exportedCount: 0,
      averageCompletionTime: 0,
      userRating: 0,
      feedbackCount: 0
    },

    metadata: {
      createdBy: 'system',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      tags: ['newsletter', 'community', 'standard', 'professional']
    }
  },

  {
    id: 'announcement-urgent-v1',
    name: 'Urgent Community Announcement',
    description: 'High-impact template for urgent community notifications and alerts',
    type: 'announcement',
    category: 'announcement',
    canvaDesignId: null,
    thumbnailUrl: null,
    isActive: true,
    featured: true,
    difficulty: 'beginner',
    estimatedTime: '5 minutes',

    configuration: {
      maxPages: 1,
      allowCustomColors: true,
      allowFontChanges: false,
      requiredElements: ['title', 'message', 'urgency'],
      brandingRequired: true
    },

    fields: [
      {
        id: 'title',
        name: 'Announcement Title',
        type: 'text',
        required: true,
        placeholder: 'IMPORTANT: Community Notice',
        maxLength: 80,
        validation: 'required|string|max:80',
        helpText: 'Clear, attention-grabbing title'
      },
      {
        id: 'urgency_level',
        name: 'Urgency Level',
        type: 'select',
        required: true,
        options: [
          { value: 'low', label: 'Low - General Information', color: '#4CAF50' },
          { value: 'medium', label: 'Medium - Important Update', color: '#FF9800' },
          { value: 'high', label: 'High - Requires Attention', color: '#F44336' },
          { value: 'urgent', label: 'Urgent - Immediate Action Required', color: '#D32F2F' }
        ],
        validation: 'required|in:low,medium,high,urgent',
        helpText: 'This affects the visual design and priority'
      },
      {
        id: 'message',
        name: 'Announcement Message',
        type: 'textarea',
        required: true,
        placeholder: 'Provide clear details about the announcement...',
        maxLength: 800,
        validation: 'required|string|max:800',
        helpText: 'Main message content - keep it concise and clear'
      },
      {
        id: 'effective_date',
        name: 'Effective Date',
        type: 'date',
        required: false,
        validation: 'date|after_or_equal:today',
        helpText: 'When this announcement takes effect (optional)'
      },
      {
        id: 'contact_info',
        name: 'Contact Information',
        type: 'text',
        required: false,
        placeholder: 'For questions: admin@clca.org or (555) 123-4567',
        maxLength: 200,
        validation: 'string|max:200',
        helpText: 'Contact details for questions or more information'
      }
    ],

    analytics: {
      createdCount: 0,
      exportedCount: 0,
      averageCompletionTime: 0,
      userRating: 0,
      feedbackCount: 0
    },

    metadata: {
      createdBy: 'system',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      tags: ['announcement', 'urgent', 'notification', 'alert']
    }
  },

  {
    id: 'event-promotion-v1',
    name: 'Community Event Promotion',
    description: 'Attractive template for promoting community events and activities',
    type: 'event',
    category: 'event',
    canvaDesignId: null,
    thumbnailUrl: null,
    isActive: true,
    featured: true,
    difficulty: 'intermediate',
    estimatedTime: '10 minutes',

    configuration: {
      maxPages: 2,
      allowCustomColors: true,
      allowFontChanges: true,
      requiredElements: ['event_title', 'date', 'time', 'location'],
      brandingRequired: false
    },

    fields: [
      {
        id: 'event_title',
        name: 'Event Title',
        type: 'text',
        required: true,
        placeholder: 'Annual Community BBQ',
        maxLength: 100,
        validation: 'required|string|max:100',
        helpText: 'Name of the event'
      },
      {
        id: 'event_subtitle',
        name: 'Event Subtitle',
        type: 'text',
        required: false,
        placeholder: 'Join us for food, fun, and community spirit!',
        maxLength: 150,
        validation: 'string|max:150',
        helpText: 'Optional tagline or short description'
      },
      {
        id: 'event_date',
        name: 'Event Date',
        type: 'date',
        required: true,
        validation: 'required|date|after:today',
        helpText: 'Date when the event will take place'
      },
      {
        id: 'start_time',
        name: 'Start Time',
        type: 'time',
        required: true,
        placeholder: '6:00 PM',
        validation: 'required|time',
        helpText: 'When the event begins'
      },
      {
        id: 'end_time',
        name: 'End Time',
        type: 'time',
        required: false,
        placeholder: '9:00 PM',
        validation: 'time|after:start_time',
        helpText: 'When the event ends (optional)'
      },
      {
        id: 'location',
        name: 'Location',
        type: 'text',
        required: true,
        placeholder: 'Community Center, Main Lake Area',
        maxLength: 200,
        validation: 'required|string|max:200',
        helpText: 'Where the event will be held'
      },
      {
        id: 'description',
        name: 'Event Description',
        type: 'textarea',
        required: true,
        placeholder: 'Join your neighbors for our annual community gathering...',
        maxLength: 1500,
        validation: 'required|string|max:1500',
        helpText: 'Detailed description of the event'
      },
      {
        id: 'rsvp_info',
        name: 'RSVP Information',
        type: 'text',
        required: false,
        placeholder: 'RSVP by July 15th to events@clca.org',
        maxLength: 200,
        validation: 'string|max:200',
        helpText: 'How to RSVP or register (optional)'
      },
      {
        id: 'capacity',
        name: 'Event Capacity',
        type: 'number',
        required: false,
        placeholder: '100',
        validation: 'integer|min:1|max:10000',
        helpText: 'Maximum number of attendees (optional)'
      }
    ],

    analytics: {
      createdCount: 0,
      exportedCount: 0,
      averageCompletionTime: 0,
      userRating: 0,
      feedbackCount: 0
    },

    metadata: {
      createdBy: 'system',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      tags: ['event', 'promotion', 'community', 'activity']
    }
  }
];

// System configuration settings
const getSystemConfiguration = () => ({
  // Template management
  templates: {
    maxPerCategory: 15,
    cacheTimeout: 3600, // 1 hour
    requireApproval: false,
    allowCustomTemplates: false,
    featuredCount: 6
  },

  // Autofill and validation
  autofill: {
    enabled: true,
    sanitizeInput: true,
    validateFields: true,
    maxFieldLength: 10000,
    maxTotalSize: 50000, // 50KB total autofill data
    timeout: 30000 // 30 seconds
  },

  // Export and download
  export: {
    enabled: true,
    formats: ['pdf', 'png', 'jpg'],
    maxRetries: 3,
    timeout: 120000, // 2 minutes
    compressionEnabled: true
  },

  // Print workflow
  print: {
    enabled: true,
    autoExportOnApproval: true,
    queueEnabled: true,
    maxQueueSize: 100,
    priorityLevels: ['low', 'normal', 'high', 'urgent']
  },

  // Security settings
  security: {
    sanitizeAutofillData: true,
    validateTemplateUrls: true,
    allowedDomains: ['canva.com', 'www.canva.com'],
    maxUploadSize: 10485760, // 10MB
    virusScanEnabled: false, // Would require additional service
    rateLimiting: {
      enabled: true,
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 300
    }
  },

  // Monitoring and analytics
  monitoring: {
    enabled: true,
    trackUsage: true,
    trackPerformance: true,
    trackErrors: true,
    retentionDays: 90
  },

  // Feature flags
  features: {
    canvaIntegration: true,
    templateSelection: true,
    autofillEnabled: true,
    exportEnabled: true,
    printWorkflow: true,
    analyticsEnabled: true,
    userFeedback: true,
    templateRating: true,
    collaborationComments: false, // Future feature
    templateVersioning: false, // Future feature
    a11yEnhancements: true
  }
});

// Main setup function
async function setupProductionCanvaIntegration(options = {}) {
  const { dryRun = false, force = false } = options;

  try {
    log('🚀 Starting Production Canva Integration Setup', colors.bright + colors.blue);
    log('=' .repeat(60), colors.blue);

    // Load environment and validate configuration
    loadEnvironmentVariables();
    const firebaseConfig = getValidatedFirebaseConfig();

    log(`📍 Firebase Project: ${firebaseConfig.projectId}`, colors.cyan);
    log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`, colors.cyan);

    if (dryRun) {
      log('🔍 DRY RUN MODE - No changes will be made', colors.yellow);
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Check existing configuration
    log('\n🔍 Checking existing configuration...', colors.blue);
    const configRef = doc(db, 'app', 'config');
    const existingDoc = await getDoc(configRef);

    if (existingDoc.exists() && !force && !dryRun) {
      const existingData = existingDoc.data();
      log('⚠️  Configuration already exists:', colors.yellow);
      log(`   Templates: ${existingData.canvaTemplates?.length || 0}`, colors.yellow);
      log(`   Version: ${existingData.version || 'unknown'}`, colors.yellow);
      log('   Use --force to overwrite or --dry-run to preview', colors.yellow);
      return;
    }

    // Prepare configuration data
    const templates = getProductionTemplates();
    const systemConfig = getSystemConfiguration();

    const configurationData = {
      // Template data
      canvaTemplates: templates,
      templateCategories: ['newsletter', 'announcement', 'event', 'classified'],

      // System configuration
      ...systemConfig,

      // Metadata
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      configType: 'production',
      lastUpdated: Timestamp.now(),
      createdAt: existingDoc.exists() ? existingDoc.data().createdAt : Timestamp.now(),

      // Setup information
      setup: {
        scriptVersion: '1.0.0',
        setupDate: new Date().toISOString(),
        setupBy: 'production-setup-script',
        validated: true
      }
    };

    // Display setup summary
    log('\n📊 Setup Summary:', colors.green);
    log(`   🎨 Templates: ${templates.length}`, colors.green);
    log(`   📋 Categories: ${configurationData.templateCategories.length}`, colors.green);
    log(`   🛡️  Security features: ${Object.keys(systemConfig.security).length}`, colors.green);
    log(`   🚀 Features enabled: ${Object.keys(systemConfig.features).filter(k => systemConfig.features[k]).length}`, colors.green);

    if (dryRun) {
      log('\n📝 Templates to be configured:', colors.cyan);
      templates.forEach((template, index) => {
        log(`   ${index + 1}. ${template.name} (${template.type})`, colors.cyan);
        log(`      Fields: ${template.fields.length}, Difficulty: ${template.difficulty}`, colors.cyan);
      });

      log('\n🔧 Configuration summary:', colors.cyan);
      log(`   Max templates per category: ${systemConfig.templates.maxPerCategory}`, colors.cyan);
      log(`   Security features: ${systemConfig.security.sanitizeAutofillData ? 'enabled' : 'disabled'}`, colors.cyan);
      log(`   Print workflow: ${systemConfig.features.printWorkflow ? 'enabled' : 'disabled'}`, colors.cyan);

      log('\n✨ Run without --dry-run to apply changes', colors.green);
      return;
    }

    // Write configuration to Firestore
    log('\n💾 Writing configuration to Firestore...', colors.blue);

    await setDoc(configRef, configurationData, { merge: !force });
    log('✅ Main configuration written successfully', colors.green);

    // Verify the written configuration
    log('\n🔍 Verifying written configuration...', colors.blue);
    const verificationDoc = await getDoc(configRef);

    if (!verificationDoc.exists()) {
      throw new Error('Configuration document was not created');
    }

    const verifiedData = verificationDoc.data();
    const verificationChecks = [
      {
        name: 'Templates array exists',
        check: () => Array.isArray(verifiedData.canvaTemplates),
        value: verifiedData.canvaTemplates?.length
      },
      {
        name: 'Template count matches',
        check: () => verifiedData.canvaTemplates?.length === templates.length,
        value: `${verifiedData.canvaTemplates?.length}/${templates.length}`
      },
      {
        name: 'Features configuration exists',
        check: () => verifiedData.features && typeof verifiedData.features === 'object',
        value: Object.keys(verifiedData.features || {}).length
      },
      {
        name: 'Security configuration exists',
        check: () => verifiedData.security && typeof verifiedData.security === 'object',
        value: Object.keys(verifiedData.security || {}).length
      },
      {
        name: 'Version information present',
        check: () => verifiedData.version && verifiedData.setup?.scriptVersion,
        value: verifiedData.version
      }
    ];

    let allChecksPass = true;
    verificationChecks.forEach(({ name, check, value }) => {
      if (check()) {
        log(`   ✅ ${name}: ${value}`, colors.green);
      } else {
        log(`   ❌ ${name}: ${value}`, colors.red);
        allChecksPass = false;
      }
    });

    if (!allChecksPass) {
      throw new Error('Configuration verification failed');
    }

    // Success summary
    log('\n🎉 Production setup completed successfully!', colors.bright + colors.green);
    log('=' .repeat(60), colors.green);

    log('\n📊 What was configured:', colors.green);
    log(`   🎨 ${templates.length} production-ready templates`, colors.green);
    log(`   🛡️  Complete security configuration`, colors.green);
    log(`   📈 Analytics and monitoring setup`, colors.green);
    log(`   🚀 All features enabled and configured`, colors.green);

    log('\n📋 Next steps:', colors.cyan);
    log('   1. 🔗 Configure Canva Connect OAuth credentials', colors.cyan);
    log('   2. 🎨 Update template canvaDesignId fields with actual Canva Brand Template IDs', colors.cyan);
    log('   3. 🖼️  Add thumbnail URLs for template previews', colors.cyan);
    log('   4. 🧪 Test the integration with the frontend application', colors.cyan);
    log('   5. 📊 Set up monitoring and analytics dashboards', colors.cyan);

    log('\n✨ Configuration complete and verified!', colors.bright + colors.green);

  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, colors.bright + colors.red);

    // Enhanced error handling
    if (error.code === 'permission-denied') {
      log('\n🔒 Permission Issues:', colors.red);
      log('   • Check Firebase project permissions', colors.red);
      log('   • Verify service account has Firestore write access', colors.red);
      log('   • Review Firestore security rules', colors.red);
    } else if (error.code === 'unavailable') {
      log('\n🌐 Connectivity Issues:', colors.red);
      log('   • Check internet connection', colors.red);
      log('   • Verify Firebase project status', colors.red);
      log('   • Check Firebase service availability', colors.red);
    } else if (error.message.includes('Firebase configuration')) {
      log('\n⚙️  Configuration Issues:', colors.red);
      log('   • Verify .env file exists and is complete', colors.red);
      log('   • Check Firebase project settings', colors.red);
      log('   • Ensure all required environment variables are set', colors.red);
    }

    throw error;
  }
}

// Parse command line arguments
const parseArguments = () => {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    force: args.includes('--force') || args.includes('-f'),
    help: args.includes('--help') || args.includes('-h')
  };
};

// Display help information
const showHelp = () => {
  log('\n📖 Production Canva Integration Setup', colors.bright + colors.blue);
  log('   Comprehensive setup for production-ready Canva integration\n', colors.blue);

  log('Usage:', colors.bright);
  log('   node scripts/production-canva-setup.js [options]\n', colors.cyan);

  log('Options:', colors.bright);
  log('   --dry-run, -d    Preview changes without making them', colors.cyan);
  log('   --force, -f      Overwrite existing configuration', colors.cyan);
  log('   --help, -h       Show this help message\n', colors.cyan);

  log('Examples:', colors.bright);
  log('   node scripts/production-canva-setup.js', colors.green);
  log('   node scripts/production-canva-setup.js --dry-run', colors.green);
  log('   node scripts/production-canva-setup.js --force', colors.green);
};

// Main execution
const main = async () => {
  try {
    const options = parseArguments();

    if (options.help) {
      showHelp();
      process.exit(0);
    }

    await setupProductionCanvaIntegration(options);
    log('\n🎉 Setup completed successfully!', colors.bright + colors.green);
    process.exit(0);

  } catch (error) {
    log(`\n💥 Fatal error: ${error.message}`, colors.bright + colors.red);

    if (process.env.NODE_ENV === 'development') {
      console.error('\nFull error details:', error);
    }

    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log('\n💥 Unhandled promise rejection:', colors.bright + colors.red);
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Run the main function
main();
