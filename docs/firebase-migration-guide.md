# Firebase Migration Guide

## Overview

This guide will help you migrate your existing CLCA Courier application from Google Drive storage to Firebase, while maintaining all existing functionality and adding new features.

## Migration Strategy

### Phase 1: Parallel Implementation (Recommended)

- Keep existing Google Drive integration working
- Add Firebase services alongside
- Gradually migrate features
- Full cutover when ready

### Phase 2: Complete Migration

- Replace Google Drive with Firebase
- Remove legacy code
- Optimize for Firebase-only workflow

## Prerequisites

1. **Firebase project set up** (see [Firebase Setup Guide](./firebase-setup-guide.md))
2. **Current Google Drive integration working**
3. **Backup of existing data**

## Migration Steps

### Step 1: Data Migration

#### 1.1 Newsletter PDFs Migration

```bash
# Create a migration script to transfer PDFs from Google Drive to Firebase Storage
npm run migrate:pdfs-to-firebase
```

**Manual process:**

1. Download all PDFs from Google Drive
2. Upload to Firebase Storage using the new upload interface
3. Update metadata in Firestore

#### 1.2 PDF Metadata Migration

```typescript
// Example migration script
async function migratePdfMetadata() {
  const existingManifest = await fetch('/data/pdf-manifest.json');
  const manifest = await existingManifest.json();

  for (const file of manifest.files) {
    const metadata: NewsletterMetadata = {
      filename: file.filename,
      title: extractTitleFromFilename(file.filename),
      publicationDate: extractDateFromFilename(file.filename),
      year: extractYearFromFilename(file.filename),
      fileSize: file.size || 0,
      downloadUrl: file.firebaseUrl, // New Firebase Storage URL
      storageRef: file.firebaseStorageRef,
      tags: extractTagsFromFilename(file.filename),
      featured: false,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'migration-script',
      updatedBy: 'migration-script',
    };

    await firestoreService.saveNewsletterMetadata(metadata);
  }
}
```

### Step 2: User Authentication Migration

#### 2.1 Existing User Data

If you have existing user data, create user profiles in Firestore:

```typescript
async function createUserProfiles() {
  const existingUsers = await getExistingUsers(); // Your existing user source

  for (const user of existingUsers) {
    const profile: UserProfile = {
      uid: user.googleId || generateUID(),
      email: user.email,
      displayName: user.name,
      role: determineUserRole(user), // 'reader', 'contributor', 'editor', 'admin'
      permissions: getPermissionsForRole(role),
      isApproved: true,
      createdAt: user.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        preferredCategories: [],
      },
    };

    await firestoreService.createUserProfile(profile);
  }
}
```

### Step 3: Component Updates

#### 3.1 Archive Page Integration

Update `AdvancedIssueArchivePage.vue` to use Firebase data:

```vue
<script setup lang="ts">
import { useFirebaseNewsletters } from '../composables/useFirebase';

// Replace existing data loading
const { newsletters, loadNewsletters, searchNewsletters } = useFirebaseNewsletters();

// Update search function
const handleSearch = async (searchTerm: string) => {
  const results = await searchNewsletters(searchTerm);
  // Update UI with results
};

// Load data on mount
onMounted(() => {
  loadNewsletters();
});
</script>
```

#### 3.2 PDF Viewer Integration

Update PDF viewer to use Firebase Storage URLs:

```typescript
// In GlobalPdfViewer or similar component
const openPdf = async (newsletter: NewsletterMetadata) => {
  // Firebase Storage URLs are directly accessible
  const pdfUrl = newsletter.downloadUrl;

  // Load in PDFTron WebViewer
  viewer.loadDocument(pdfUrl);
};
```

#### 3.3 Content Submission Forms

Replace existing submission forms with Firebase-powered versions:

```vue
<template>
  <!-- Use the new content submission components -->
  <ContentSubmissionForm @submit="handleContentSubmission" />
</template>

<script setup lang="ts">
import { useFirebaseUserContent } from '../composables/useFirebase';

const { submitContent } = useFirebaseUserContent();

const handleContentSubmission = async (contentData) => {
  await submitContent(contentData);
  // Show success message
};
</script>
```

### Step 4: Update Environment Configuration

#### 4.1 Environment Variables

Add Firebase configuration to your `.env` file:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Keep Google Drive settings for gradual migration
VITE_GOOGLE_DRIVE_API_KEY=your_google_api_key
VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
```

#### 4.2 Feature Flags

Use feature flags to gradually roll out Firebase features:

```typescript
// src/config/features.ts
export const FEATURE_FLAGS = {
  USE_FIREBASE_AUTH: import.meta.env.VITE_USE_FIREBASE_AUTH === 'true',
  USE_FIREBASE_STORAGE: import.meta.env.VITE_USE_FIREBASE_STORAGE === 'true',
  USE_FIREBASE_DATABASE: import.meta.env.VITE_USE_FIREBASE_DATABASE === 'true',
  MIGRATION_MODE: import.meta.env.VITE_MIGRATION_MODE === 'true',
};
```

### Step 5: Content Approval Workflow

#### 5.1 Admin Dashboard

Create an admin dashboard for content approval:

```vue
<template>
  <AdminDashboard>
    <PendingContentReview @approve="approveContent" @reject="rejectContent" />
    <NewsletterManagement @publish="publishNewsletter" />
    <UserManagement @updateRole="updateUserRole" />
  </AdminDashboard>
</template>
```

#### 5.2 Email Notifications

Set up email notifications for content submissions:

```typescript
// This would typically be in a Cloud Function
export const sendNotificationEmail = functions.firestore
  .document('userContent/{contentId}')
  .onCreate(async (snap, context) => {
    const content = snap.data();

    // Send email to editors
    await sendEmail({
      to: 'editors@clcacourier.com',
      subject: 'New Content Submission',
      body: `New ${content.type} submitted: "${content.title}"`,
    });
  });
```

### Step 6: Testing Migration

#### 6.1 Parallel Testing

1. Run both systems in parallel
2. Compare data consistency
3. Test all user workflows
4. Verify performance

#### 6.2 User Acceptance Testing

1. Train editors on new interface
2. Test content submission workflow
3. Verify PDF upload and management
4. Test search functionality

### Step 7: Legacy Code Cleanup

#### 7.1 Remove Google Drive Dependencies (After Full Migration)

```bash
# Remove legacy Google Drive packages
npm uninstall googleapis google-auth-library

# Remove legacy service files
rm src/services/google-drive-*.ts
rm src/composables/useGoogleDrive*.ts
```

#### 7.2 Update Scripts

```json
{
  "scripts": {
    "migrate:pdfs": "node scripts/migrate-pdfs-to-firebase.js",
    "migrate:users": "node scripts/migrate-users-to-firebase.js",
    "cleanup:legacy": "node scripts/cleanup-legacy-files.js"
  }
}
```

## Rollback Plan

### If Issues Arise

1. **Feature flags**: Disable Firebase features
2. **Fallback**: Revert to Google Drive integration
3. **Data integrity**: Ensure no data loss during rollback

### Emergency Rollback

```bash
# Disable Firebase features
export VITE_USE_FIREBASE_AUTH=false
export VITE_USE_FIREBASE_STORAGE=false
export VITE_USE_FIREBASE_DATABASE=false

# Restart application
npm run dev
```

## Post-Migration Optimizations

### 1. Performance Monitoring

- Set up Firebase Performance Monitoring
- Monitor page load times
- Track user engagement

### 2. Cost Optimization

- Review Firebase usage metrics
- Optimize Firestore queries
- Implement caching strategies

### 3. Security Hardening

- Review and update security rules
- Implement proper user role validation
- Set up monitoring for unusual activity

### 4. Backup Strategy

- Set up automated Firestore backups
- Implement Firebase Storage backups
- Create disaster recovery procedures

## Support and Troubleshooting

### Common Migration Issues

1. **Authentication Conflicts**
   - Ensure Google OAuth scopes are compatible
   - Map existing user IDs to Firebase UIDs

2. **File Access Issues**
   - Update CORS settings in Firebase Storage
   - Verify security rules allow proper access

3. **Data Consistency**
   - Implement data validation
   - Set up monitoring for data drift

### Getting Help

1. Check Firebase Console logs
2. Review migration logs
3. Contact Firebase support if needed
4. Use existing Google Drive as backup

## Timeline Recommendations

### Week 1-2: Setup and Planning

- Set up Firebase project
- Configure services
- Plan migration strategy

### Week 3-4: Data Migration

- Migrate PDF files
- Transfer metadata
- Set up user profiles

### Week 5-6: Feature Integration

- Update components
- Test workflows
- Train users

### Week 7-8: Testing and Optimization

- Parallel testing
- Performance optimization
- Bug fixes

### Week 9-10: Full Cutover

- Disable Google Drive
- Monitor for issues
- Cleanup legacy code

This migration approach ensures a smooth transition while maintaining system reliability and user experience.
