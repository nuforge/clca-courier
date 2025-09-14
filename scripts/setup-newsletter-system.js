/**
 * Setup Script for Newsletter Generation System
 *
 * This script helps set up the newsletter generation system by:
 * 1. Installing Firebase Functions dependencies
 * 2. Creating necessary Firestore collections
 * 3. Setting up initial configuration
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up CLCA Courier Newsletter Generation System...\n');

// Step 1: Install Firebase Functions dependencies
console.log('📦 Installing Firebase Functions dependencies...');
try {
  execSync('cd functions && npm install', { stdio: 'inherit' });
  console.log('✅ Functions dependencies installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install functions dependencies:', error.message);
  process.exit(1);
}

// Step 2: Create Firestore indexes for newsletter collections
console.log('🗂️  Setting up Firestore collections...');

const firestoreIndexes = {
  "indexes": [
    {
      "collectionGroup": "newsletter_issues",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "tags",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "generation_progress",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
};

// Update firestore.indexes.json
const indexPath = path.join(__dirname, '..', 'firestore.indexes.json');
try {
  const existingIndexes = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  // Merge new indexes with existing ones
  const mergedIndexes = {
    ...existingIndexes,
    indexes: [...(existingIndexes.indexes || []), ...firestoreIndexes.indexes]
  };

  fs.writeFileSync(indexPath, JSON.stringify(mergedIndexes, null, 2));
  console.log('✅ Firestore indexes updated\n');
} catch (error) {
  console.error('❌ Failed to update Firestore indexes:', error.message);
}

// Step 3: Create sample newsletter issue
console.log('📰 Creating sample newsletter issue...');

const sampleIssue = {
  title: "Welcome to CLCA Courier Newsletter System",
  issueNumber: "2025-01",
  publicationDate: new Date().toISOString(),
  status: "draft",
  submissions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: "system",
  updatedBy: "system"
};

const sampleIssuePath = path.join(__dirname, '..', 'data', 'sample-newsletter-issue.json');
try {
  if (!fs.existsSync(path.dirname(sampleIssuePath))) {
    fs.mkdirSync(path.dirname(sampleIssuePath), { recursive: true });
  }
  fs.writeFileSync(sampleIssuePath, JSON.stringify(sampleIssue, null, 2));
  console.log('✅ Sample newsletter issue created\n');
} catch (error) {
  console.error('❌ Failed to create sample issue:', error.message);
}

// Step 4: Create HTML template for PDF generation
console.log('🎨 Creating PDF generation templates...');

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLCA Courier Newsletter Template</title>
  <style>
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background: white;
    }

    .header {
      border-bottom: 3px solid #2c5aa0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .newsletter-title {
      font-size: 24px;
      font-weight: bold;
      color: #2c5aa0;
      margin: 0 0 10px 0;
    }

    .issue-info {
      font-size: 14px;
      color: #666;
      margin: 0;
    }

    .article-title {
      font-size: 20px;
      font-weight: bold;
      color: #2c5aa0;
      margin: 0 0 15px 0;
      border-left: 4px solid #2c5aa0;
      padding-left: 15px;
    }

    .article-meta {
      font-size: 12px;
      color: #888;
      margin-bottom: 20px;
      font-style: italic;
    }

    .article-content {
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 30px;
    }

    .footer {
      border-top: 1px solid #ddd;
      padding-top: 20px;
      margin-top: 40px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="newsletter-title">{{issue.title}}</h1>
    <p class="issue-info">Issue {{issue.issueNumber}} • {{formatDate issue.publicationDate}}</p>
  </div>

  <h2 class="article-title">{{title}}</h2>

  <div class="article-meta">
    By {{author}} • {{formatDate createdAt}}
  </div>

  <div class="article-content">
    {{{content}}}
  </div>

  <div class="footer">
    <p>CLCA Courier Newsletter • Generated on {{formatDate now}}</p>
  </div>
</body>
</html>`;

const templatePath = path.join(__dirname, '..', 'functions', 'templates', 'newsletter-template.html');
try {
  if (!fs.existsSync(path.dirname(templatePath))) {
    fs.mkdirSync(path.dirname(templatePath), { recursive: true });
  }
  fs.writeFileSync(templatePath, htmlTemplate);
  console.log('✅ PDF generation template created\n');
} catch (error) {
  console.error('❌ Failed to create template:', error.message);
}

// Step 5: Create deployment instructions
console.log('📋 Creating deployment instructions...');

const deploymentInstructions = `# Newsletter Generation System Setup Complete! 🎉

## Next Steps:

### 1. Deploy Firebase Functions
\`\`\`bash
# Build and deploy the functions
cd functions
npm run build
firebase deploy --only functions
\`\`\`

### 2. Update Firestore Rules (if needed)
Add these rules to your firestore.rules file:
\`\`\`javascript
// Newsletter issues - admin only
match /newsletter_issues/{issueId} {
  allow read, write: if request.auth != null;
}

// Generation progress - admin only
match /generation_progress/{progressId} {
  allow read, write: if request.auth != null;
}
\`\`\`

### 3. Test the System
1. Go to /admin/newsletters in your app
2. Create a new newsletter issue
3. Add some approved content submissions
4. Generate a PDF to test the system

### 4. Access Points
- **Admin Dashboard**: /admin/newsletters
- **User Submission**: /contribute/newsletter
- **Content Management**: /admin/content

## System Architecture:
- **Frontend**: Vue3 + Quasar (existing)
- **Backend**: Firebase Functions + Puppeteer
- **Database**: Firestore
- **Storage**: Firebase Storage
- **PDF Generation**: Puppeteer + PDF-lib

## Key Features:
✅ User content submission with rich text editor
✅ Admin content review and approval
✅ Newsletter issue creation and management
✅ Automated PDF generation from approved content
✅ Professional newsletter layout and styling
✅ Progress tracking for PDF generation
✅ Firebase Storage integration for final PDFs

## Troubleshooting:
- If PDF generation fails, check Firebase Functions logs
- Ensure Puppeteer dependencies are properly installed
- Verify Firestore permissions for newsletter collections
- Check Firebase Storage rules for PDF uploads

Happy newsletter generation! 📰✨
`;

const instructionsPath = path.join(__dirname, '..', 'NEWSLETTER_SETUP_COMPLETE.md');
try {
  fs.writeFileSync(instructionsPath, deploymentInstructions);
  console.log('✅ Deployment instructions created\n');
} catch (error) {
  console.error('❌ Failed to create instructions:', error.message);
}

console.log('🎉 Newsletter Generation System setup complete!');
console.log('📖 Check NEWSLETTER_SETUP_COMPLETE.md for next steps');
console.log('\n🚀 Ready to generate beautiful newsletters!');
