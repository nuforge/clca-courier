# CLCA Courier - Development Guide

## 🚨 CRITICAL RULES (USER-ENFORCED)

### ✅ COMPREHENSIVE REFACTORING COMPLETED (September 8, 2025)

**PRODUCTION-READY CODEBASE ACHIEVED - ALL PHASES COMPLETE**

#### Foundation Architecture ✅

- ✅ Type unification: Single UnifiedNewsletter interface across entire codebase
- ✅ Service consolidation: Firebase-first architecture with unified APIs
- ✅ Property standardization: downloadUrl, publicationDate, pageCount patterns
- ✅ Build system: 0 TypeScript compilation errors, production build verified

#### Code Quality & Cleanup ✅

- ✅ Professional logging: Centralized logger utility (src/utils/logger.ts)
- ✅ Debug cleanup: 25+ console statements replaced with categorized logging
- ✅ Service optimization: 3 unused services/composables removed
- ✅ Bundle optimization: Reduced size and improved production code quality

### ABSOLUTE PROHIBITIONS

- **❌ Hash Mode Routing**: Always use history mode (`/archive` not `/#/archive`)
- **❌ Hardcoded Data**: No static arrays, JSON files for content, or fake data
- **❌ Path Assumptions**: Always verify file/directory existence before implementation
- **❌ Theme Violations**: Never hardcode background colors or theme-specific styles
- **❌ Gutter + Columns**: Never use `q-gutter-*` classes with precise column layouts

### MANDATORY PRACTICES

- **✅ Firebase-First**: Use Firebase services for all data, auth, and storage
- **✅ Dynamic Discovery**: Generate content from actual files using manifest system
- **✅ Path Verification**: Check existence before referencing files/directories
- **✅ Theme Awareness**: Use Quasar's theme-aware color classes only
- **✅ Responsive Layouts**: Use padding-based spacing instead of margin-based gutters
- **✅ STRICT TYPESCRIPT**: NEVER use `any` types - use proper TypeScript types like `Record<string, unknown>`, `string | undefined`, etc.
- **✅ CENTRALIZED LOGGING**: ALWAYS use logger utility from `src/utils/logger.ts` - NO console statements
- **✅ UNIFIED TYPES**: Use UnifiedNewsletter interface exclusively - NO other Newsletter types
- **✅ CLEAN ARCHITECTURE**: Remove unused code and services for optimal bundle size
- **✅ Sync Status Logic**: Always compare actual newsletter data for sync detection, not empty IndexedDB metadata

## 🏗️ Architecture

### Framework Stack

- **Frontend**: Vue 3 + Quasar Framework (Vite-based)
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **State Management**: Pinia stores
- **PDF Handling**: PDFTron WebViewer + PDF.js fallback
- **Routing**: History mode only

### Firebase Integration

- **Authentication**: Multi-provider OAuth (Google, Facebook, Twitter, GitHub)
- **Database**: Firestore for newsletters, metadata, user content
- **Storage**: Firebase Storage for PDFs and user uploads
- **Security**: Role-based access (Reader, Contributor, Editor, Admin)

### Storage Strategy

- **Current**: Firebase Storage for all PDF storage needs
- **Cost**: ~$0.85/month for current scale
- **Future-Ready**: Service layer supports additional providers when needed

## 🛠️ Development Commands

```bash
# Development with hot reload
quasar dev

# Production build
quasar build

# Generate PDF manifest (run before build)
node scripts/generate-pdf-manifest.js

# Firebase deployment
firebase deploy
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
├── pages/               # Route components (*Page.vue naming)
├── services/            # Business logic (TypeScript interfaces)
├── stores/              # Pinia state management
├── config/              # Firebase and app configuration
├── boot/                # Quasar boot files
└── layouts/             # Layout components

public/
├── data/                # Build-time generated manifests
├── issues/              # Local PDF storage (legacy)
└── thumbnails/          # Auto-generated PDF thumbnails

scripts/                 # Build and utility scripts
```

## 🔧 Key Components

### Services

- **firebase-newsletter.service.ts**: Newsletter management with Firebase + date enhancement
- **firebase-firestore.service.ts**: Direct Firestore operations + deleteField support
- **firebase-auth.service.ts**: Authentication handling
- **firebase-storage.service.ts**: File upload and storage
- **date-management.service.ts**: Centralized date parsing and enhancement logic

### Composables

- **useContentManagement.ts**: Enhanced newsletter management with sync status detection
- **useContentExtraction.ts**: PDF text extraction and metadata processing
- **useFirebase.ts**: Firebase integration utilities
- **useThumbnailManagement.ts**: Thumbnail generation and management

### Admin Components

- **CombinedNewsletterManagementPage.vue**: Comprehensive admin interface with batch operations
- **NewsletterManagementTable.vue**: Enhanced table with sync status and data source visualization
- **LocalStorageManager.vue**: Storage statistics and cleanup tools
- **StatisticsCards.vue**: Newsletter collection statistics display

### Core Components

- **MainLayout.vue**: Base layout with global PDF viewer
- **GlobalPdfViewer.vue**: Application-wide PDF viewer dialog
- **FirebaseNewsletterCard.vue**: Newsletter display with admin controls
- **FirebaseNewsletterArchivePage.vue**: Main archive interface

### Stores

- **newsletter-archive.store.ts**: Newsletter state management
- **auth.store.ts**: Authentication state
- **ui.store.ts**: UI state (theme, modals)

## 🔧 Enhanced Admin Features

### Sync Status Detection

The admin interface implements real-time sync status detection between local enhanced metadata and Firebase data:

```typescript
// ✅ CORRECT: Compare actual newsletter data
function getNewsletterSyncStatus(newsletter: ContentManagementNewsletter): SyncStatus {
  const firebaseMeta = firebaseMetadataMap.value.get(newsletter.filename);
  const hasFirebaseData = !!firebaseMeta;
  const hasEnhancedData = !!(newsletter.displayDate || newsletter.month || newsletter.wordCount);

  if (!hasEnhancedData && !hasFirebaseData) return 'unknown';
  if (!hasEnhancedData && hasFirebaseData) return 'firebase';
  if (hasEnhancedData && !hasFirebaseData) return 'local';

  // Compare key enhanced fields for actual sync status
  if (hasFirebaseData && hasEnhancedData && firebaseMeta) {
    const fieldsMatch =
      newsletter.displayDate === firebaseMeta.displayDate &&
      newsletter.month === firebaseMeta.month &&
      newsletter.season === firebaseMeta.season &&
      newsletter.wordCount === firebaseMeta.wordCount;

    return fieldsMatch ? 'synced' : 'local';
  }

  return 'unknown';
}

// ❌ WRONG: Comparing empty IndexedDB metadata with actual data
const syncStatus = getSyncStatus(emptyIndexedDBMeta, actualFirebaseData);
```

### Date Management Patterns

Enhanced date parsing supports both monthly and seasonal newsletter formats:

```typescript
// ✅ CORRECT: Enhanced date parsing with proper typing
interface ParsedNewsletterDate {
  year: number;
  month?: number; // 1-12 for monthly newsletters
  season?: 'spring' | 'summer' | 'fall' | 'winter'; // For seasonal newsletters
  displayDate: string; // Human-readable format
  sortValue: number; // YYYYMM numeric for sorting
}

// Monthly newsletter: "2024.08-conashaugh-courier.pdf" → "August 2024"
// Seasonal newsletter: "2024.summer-conashaugh-courier.pdf" → "Summer 2024"

// ❌ WRONG: Hardcoded date formats or assumptions
const hardcodedDate = 'Summer 2024'; // No dynamic parsing
```

### TypeScript Patterns

Strict TypeScript enforcement with proper type safety:

```typescript
// ✅ CORRECT: Proper TypeScript typing
function processMetadata(data: Record<string, unknown>): NewsletterMetadata {
  return {
    displayDate: typeof data.displayDate === 'string' ? data.displayDate : undefined,
    month: typeof data.month === 'number' ? data.month : undefined,
    wordCount: typeof data.wordCount === 'number' ? data.wordCount : 0,
  };
}

// ❌ FORBIDDEN: Using 'any' types
function processMetadata(data: any): any {
  return data.whatever; // Breaks type safety
}
```

### Firebase Integration Patterns

Enhanced Firebase operations with proper error handling:

```typescript
// ✅ CORRECT: Enhanced Firebase operations with deleteField
import { deleteField } from './firebase-firestore.service';

const updateFields: Record<string, unknown> = {};
if (enhancedData.month !== undefined) {
  updateFields.month = enhancedData.month;
  updateFields.season = deleteField(); // Clear conflicting field
}

await firestoreService.updateNewsletterMetadata(id, updateFields);

// ❌ WRONG: Not handling field conflicts or using proper types
await firestoreService.updateNewsletterMetadata(id, data as any);
```

## 📝 Code Patterns

### Firebase-First Pattern

```typescript
// ✅ CORRECT: Firebase-based storage
const newsletterService = new FirebaseNewsletterService();
await newsletterService.initialize();
const downloadUrl = newsletter.downloadUrl;

// ❌ WRONG: Hardcoded arrays
const pdfs = ['2024.01-newsletter.pdf', '2024.02-newsletter.pdf'];
```

### Theme-Aware Styling

```vue
<!-- ✅ CORRECT: Theme-aware classes -->
<div class="bg-primary text-white"></div>
```

### Responsive Layout

```vue
<!-- ✅ CORRECT: Padding-based spacing -->
<div class="row"></div>
```

## 🚀 Development Workflows

### Adding New Features

1. Check Firebase configuration and permissions
2. Verify path existence using tools
3. Follow Firebase-first data patterns
4. Use theme-aware styling
5. Test responsive layouts

### PDF Management

1. Upload to Firebase Storage via admin interface
2. Metadata automatically extracted and stored in Firestore
3. Thumbnails generated and cached
4. Access controlled by security rules

### Authentication Flow

1. User signs in via OAuth providers
2. Profile created/updated in Firestore
3. Role-based permissions applied
4. Real-time state management with Pinia

## 🔍 Debugging

### Common Issues

- **Route not found**: Check history mode configuration in `quasar.config.ts`
- **Firebase errors**: Verify configuration in `firebase.config.ts`
- **PDF not loading**: Check Firebase Storage security rules
- **Theme conflicts**: Remove hardcoded colors, use Quasar classes
- **Layout overflow**: Replace gutters with padding in responsive layouts

### Tools

- Browser DevTools for Firebase debugging
- Quasar DevTools for component inspection
- Firebase Console for data management
- Network tab for API call debugging

## 📚 Key Files

### Configuration

- `quasar.config.ts`: App configuration, history mode routing
- `src/config/firebase.config.ts`: Firebase initialization
- `firebase.json`: Firebase project configuration
- `firestore.rules`: Database security rules
- `storage.rules`: Storage security rules

### Documentation

- `DEVELOPMENT_GUIDE.md`: This file - comprehensive development guide
- `README.md`: Project overview and quick start
- `CHANGELOG.md`: Version history and changes

## 🎯 Best Practices

### Security

- Never expose Firebase config secrets
- Use security rules for data access control
- Validate user permissions on both client and server
- Sanitize user input before storage

### Performance

- Use lazy loading for routes
- Implement pagination for large datasets
- Cache frequently accessed data
- Optimize images and PDFs

### Maintenance

- Keep dependencies updated
- Monitor Firebase usage and costs
- Regular security rule audits
- Document all major changes

## 🔄 Deployment

### Development

```bash
quasar dev               # Local development server
```

### Production

```bash
quasar build           # Build for production
firebase deploy        # Deploy to Firebase Hosting
```

### Environment Variables

- Firebase configuration in `firebase.config.ts`
- API keys in environment variables (production)
- Development vs production Firebase projects
