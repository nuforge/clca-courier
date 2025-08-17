# Complete Google Drive Integration Guide

## Overview

This guide provides a comprehensive implementation for using Google Drive as your primary file storage and content management system for the CLCA Courier newsletter application.

## Architecture

### Content Flow

```
Google Docs/Sheets (Source of Truth)
    ↓
Your App (Dynamic Cache & Display)
    ↓
Website Display & Canva Integration
```

### Benefits

- **Single Source of Truth**: All content managed in Google Drive
- **Dynamic Caching**: Fast local access with smart cache invalidation
- **Canva Integration**: Direct content pull for design workflows
- **Offline Support**: Cached content works without internet
- **Collaborative Editing**: Multiple people can edit content simultaneously

## Implementation Steps

### 1. Google Drive Setup

**Create Folder Structure:**

```
CLCA Courier/
├── Content/
│   ├── Articles/           (Google Docs for articles)
│   ├── Events/            (Google Docs for events)
│   ├── Classifieds/       (Google Sheets for classified ads)
│   └── Community-Stats/   (Google Sheets for statistics)
├── Issues/
│   ├── PDFs/             (Newsletter PDF files)
│   └── Thumbnails/       (Auto-generated thumbnails)
├── Images/
│   ├── Hero/             (Hero/banner images)
│   ├── Articles/         (Article images)
│   └── Events/           (Event photos)
└── Templates/            (Canva templates and assets)
```

**Get Folder IDs:**

1. Create each folder in Google Drive
2. Open each folder and copy the ID from the URL
3. Example: `https://drive.google.com/drive/folders/1ABC123DEF456GHI789` → ID is `1ABC123DEF456GHI789`

### 2. Google Cloud Console Setup

**Enable APIs:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable these APIs:
   - Google Drive API
   - Google Docs API
   - Google Sheets API

**Create Credentials:**

1. **API Key** (for public access):
   - Go to Credentials → Create Credentials → API Key
   - Restrict to your domain for security

2. **OAuth2 Client ID** (for authenticated access):
   - Go to Credentials → Create Credentials → OAuth client ID
   - Add your domain to authorized origins

### 3. Environment Configuration

Update your `.env` file:

```bash
# Google Drive API
VITE_GOOGLE_API_KEY=your_api_key_here
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

# Folder IDs (get from Google Drive URLs)
VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID=your_content_folder_id
VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID=your_issues_folder_id
VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID=your_images_folder_id
VITE_GOOGLE_DRIVE_TEMPLATES_FOLDER_ID=your_templates_folder_id

# Sync settings
VITE_GOOGLE_DRIVE_SYNC_INTERVAL_MINUTES=30
VITE_GOOGLE_DRIVE_CACHE_MAX_AGE_DAYS=7
```

### 4. Application Integration

**Basic Usage:**

```typescript
import { useGoogleDriveContent } from 'src/composables/useGoogleDriveContent';

const { initialize, articles, events, issues, syncContent } = useGoogleDriveContent();

// Initialize with your folder configuration
await initialize({
  contentFolderId: 'your_content_folder_id',
  issuesFolderId: 'your_issues_folder_id',
  imagesFolderId: 'your_images_folder_id',
  templatesFolderId: 'your_templates_folder_id',
});
```

### 5. Content Management Workflow

**For Articles/Events (Google Docs):**

1. Create new Google Doc in appropriate folder
2. Use consistent naming: `YYYY-MM-DD - Article Title`
3. Add metadata in document:
   ```
   Status: published
   Category: community-news
   Author: John Doe
   Featured-Image: image_file_id_from_drive
   ```

**For Classifieds (Google Sheets):**

1. Create Google Sheet with columns:
   - Title
   - Category
   - Description
   - Contact
   - Price
   - Date
   - Status

**For Issues (PDFs):**

1. Upload PDF to Issues/PDFs/ folder
2. Use consistent naming: `YYYY.MM - Issue Title.pdf`
3. App automatically generates thumbnails and metadata

### 6. Caching Strategy

**How it works:**

- Content is cached locally for fast access
- ETags track changes in Google Drive
- Background sync updates cache automatically
- Fallbacks ensure content always displays

**Cache locations:**

- `localStorage`: Persistent across sessions
- Memory cache: Fast access during session
- Thumbnails: Separately cached with cleanup

### 7. Canva Integration

**Setup:**

1. Create Canva templates for your newsletter
2. Link template IDs to issues in your data
3. Use Google Drive as content source in Canva

**Workflow:**

1. Update content in Google Docs/Sheets
2. App syncs content automatically
3. Canva pulls updated content via Google APIs
4. Design team works with latest content

### 8. Offline Support

**Features:**

- Cached content works offline
- Graceful degradation when online
- Background sync when connection returns
- User notifications for sync status

### 9. Performance Optimization

**Techniques:**

- Smart caching with ETags
- Background synchronization
- Compressed thumbnails
- Lazy loading of images
- Differential sync (only changed content)

### 10. Error Handling

**Strategies:**

- Graceful fallbacks to cached content
- User-friendly error messages
- Automatic retry mechanisms
- Detailed logging for debugging

## Advanced Features

### Custom Content Types

Extend the system for new content types:

```typescript
// Add new content type
interface NewsletterSection {
  id: string;
  title: string;
  content: string;
  type: 'editorial' | 'spotlight' | 'calendar';
  status: 'draft' | 'published';
}

// Register with content service
const newsletterSections = computed(() =>
  docsContent.value.filter((doc) => doc.type === 'newsletter-section'),
);
```

### Automated Workflows

Set up automated processes:

1. **Scheduled Sync**: Use cron jobs or GitHub Actions
2. **Content Validation**: Check required fields
3. **Publishing Pipeline**: Automated content promotion
4. **Backup System**: Regular content backups

### Analytics Integration

Track content performance:

```typescript
// Track content views
const trackContentView = (contentId: string, type: string) => {
  // Send to analytics service
  analytics.track('content_viewed', {
    content_id: contentId,
    content_type: type,
    timestamp: Date.now(),
  });
};
```

## Security Considerations

1. **API Key Restrictions**: Limit to your domain
2. **OAuth Scopes**: Request minimal permissions
3. **Content Validation**: Sanitize user inputs
4. **Access Control**: Use Google Drive permissions
5. **Rate Limiting**: Respect API quotas

## Monitoring & Maintenance

**Health Checks:**

- Sync status monitoring
- Cache hit rates
- Error rate tracking
- Performance metrics

**Maintenance Tasks:**

- Cache cleanup (automated)
- Thumbnail regeneration
- Content archival
- Permission audits

## Troubleshooting

**Common Issues:**

1. **Sync Failures**: Check API quotas and permissions
2. **Missing Content**: Verify folder IDs and sharing settings
3. **Slow Performance**: Review cache configuration
4. **Thumbnail Errors**: Check PDF accessibility and format

**Debug Tools:**

- Browser console for client-side logs
- Network tab for API call inspection
- Google Cloud Console for quota monitoring

## Migration Guide

**From Local Files:**

1. Upload existing PDFs to Google Drive
2. Update file references in data
3. Test thumbnail generation
4. Update deployment process

**Data Format Migration:**

```typescript
// Convert existing issue data
const migrateIssueData = (localIssue: LocalIssue): IssueWithGoogleDrive => ({
  ...localIssue,
  status: 'local',
  syncStatus: 'synced',
  // Add Google Drive fields as they become available
});
```

This comprehensive integration provides a robust, scalable solution for managing your newsletter content with Google Drive as the single source of truth.
