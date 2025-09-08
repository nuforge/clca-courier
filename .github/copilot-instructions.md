# CLCA Courier - AI Coding Instructions

## 🚨 CRITICAL DEVELOPMENT STATUS

### ❌ CURRENT KNOWN ISSUES (September 7, 2025)

**RESOLVED - NEW FIREBASE-FIRST APPROACH IMPLEMENTED**

- ✅ **Simplified Firebase-First Architecture**: New `/admin/simplified` interface implemented
- ✅ **Single Source of Truth**: Firebase Firestore for all metadata
- ✅ **No Sync Complexity**: Direct Firebase operations only
- ✅ **MVP Ready**: Process local PDFs → Firebase immediately
- 🔄 **Next**: Archive interface updates for Firebase-first approach

### ABSOLUTE PROHIBITIONS - IMMEDIATE REJECTION

**AI MUST REFUSE TO PROCEED IF ANY OF THESE ARE VIOLATED:**

- **❌ Hash Mode Routing**: Always use history mode (`/archive` not `/#/archive`) - configured in `quasar.config.ts`
- **❌ Hardcoded Data Lists**: No static arrays, JSON files for content, or fake data - use dynamic discovery only
- **❌ Path Assumptions**: Always verify file/directory existence using tools like `list_dir`, `file_search`, `grep_search` before implementation
- **❌ Mass PDF Processing**: Avoid calling `lightweightNewsletterService.getNewsletters()` during sync operations
- **❌ Multiple Terminals**: NEVER create new terminals with `run_in_terminal` when one exists - check existing terminals first
- **❌ Background Processes**: NEVER use `isBackground=true` unless explicitly requested by user for servers
- **❌ ANY TYPES**: FORBIDDEN in ALL contexts - use `Record<string, unknown>`, `string | undefined`, proper interfaces

### MANDATORY PRACTICES

- **✅ Dynamic Content Discovery**: Generate content from actual files using manifest system (`public/data/pdf-manifest.json`)
- **✅ Path Verification**: Check existence before referencing any files or directories
- **✅ Manifest-Based PDF Discovery**: Use `scripts/generate-pdf-manifest.js` for build-time PDF enumeration
- **✅ Firebase-First Development**: Use Firebase services for all data, authentication, and storage operations
- **✅ STRICT TYPESCRIPT**: NEVER use `any` types - use proper TypeScript types like `Record<string, unknown>`, `string | undefined`, etc.
- **✅ Filename-Based Data Matching**: Always match Firebase data to local PDFs by filename, NOT by ID
- **✅ Terminal Management**: Use existing terminals, check `get_terminal_output` first, use `isBackground=false` for most commands

### TYPESCRIPT ENFORCEMENT - NON-NEGOTIABLE

**REJECT ALL CODE CONTAINING:**

- **❌ FORBIDDEN**: `any` types in function parameters, return types, or variables
- **❌ FORBIDDEN**: `as any` casting in any context
- **❌ FORBIDDEN**: Implicit any through missing type annotations

**✅ REQUIRED PATTERNS**:

- `Record<string, unknown>` for objects
- `string | undefined` for optional strings
- `number | null` for optional numbers
- Interface definitions for complex objects
- Proper type casting: `as unknown as TargetType` if absolutely necessary

## 🏗️ Architecture Overview

### Framework Stack

- **Frontend**: Vue 3 + Quasar Framework (Vite-based)
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **State Management**: Pinia stores (`src/stores/`)
- **PDF Handling**: PDFTron WebViewer + PDF.js for dual viewer support
- **Storage Strategy**: Firebase Storage (simple, future-ready architecture)

### Key Components

- **`MainLayout.vue`**: Base layout with global PDF viewer and search
- **`GlobalPdfViewer.vue`**: Application-wide PDF viewer dialog component
- **`firebase-newsletter.service.ts`**: PDF management with Firebase Storage integration
- **`FirebaseNewsletterArchivePage.vue`**: Main archive with Firebase-first architecture

### Critical Services

- **Firebase Services**: Authentication, Firestore database, Storage, Functions
- **Newsletter Service**: Firebase Storage-based PDF management with flexible architecture
- **PDF Management**: Simple Firebase Storage with future multi-tier capability

## 🔧 Development Workflows

### Building & Running

```bash
# Development with hot reload
quasar dev

# Production build
quasar build
# High-memory production build (if needed)
npm run build:prod

# Generate PDF manifest (run before build)
node scripts/generate-pdf-manifest.js
```

### Project Structure Patterns

- **Pages**: Route components in `src/pages/` following `*Page.vue` naming
- **Components**: Reusable UI in `src/components/` with descriptive names
- **Services**: Business logic in `src/services/` with TypeScript interfaces
- **Stores**: Pinia state management in `src/stores/` with composition API

## 📝 Code Patterns & Conventions

### Firebase-First PDF Management Pattern

```typescript
// ✅ CORRECT: Firebase-based newsletter storage with future flexibility
const newsletterService = new FirebaseNewsletterService();
await newsletterService.initialize();

// Simple Firebase Storage access
const downloadUrl = newsletter.downloadUrl;

// Future-ready optional storage configuration
const storage = newsletter.storage?.primary || {
  provider: 'firebase',
  downloadUrl: newsletter.downloadUrl,
};

// ❌ WRONG: Hardcoded arrays or manifest-based discovery
const pdfs = ['2024.01-newsletter.pdf', '2024.02-newsletter.pdf'];
```

### Future-Ready Storage Pattern

```typescript
// ✅ CORRECT: Simple Firebase Storage with future flexibility
interface NewsletterStorage {
  downloadUrl: string;          // Current: Firebase Storage URL
  storageRef: string;           // Current: Firebase Storage path

  // Optional future-ready configuration
  storage?: {
    primary: {
      provider: 'firebase';     // Current: Firebase only
      downloadUrl: string;      // Firebase CDN URL
      storageRef: string;       // Firebase path
    };
    // Reserved for future multi-tier when needed
    archive?: {
      provider: 'b2' | 'r2';    // Future: External storage
      downloadUrl: string;      // Future: Archive URL
    };
  };
}

// ❌ WRONG: Premature multi-tier complexity
const complexStorage = new MultiTierStorageService(); // Not needed yet
    downloadUrl: string; // CDN-delivered URL
    optimized: boolean; // Web-optimized flag
  };
  highQualityVersion: {
    // External storage (cost-effective)
    provider: 'b2' | 'r2'; // Backblaze B2 or Cloudflare R2
    downloadUrl: string; // Direct download URL
    archival: boolean; // Archive quality flag
  };
}

// ❌ WRONG: Single-tier expensive storage
const singleTierUrl = firebaseStorage.getDownloadUrl(highQualityPdf);
```

### Router Configuration

- **History mode only**: Configured in `quasar.config.ts` as `vueRouterMode: 'history'`
- **Route patterns**: `/archive/:id` for Firebase document IDs, `/archive/:id(\\d+)` for legacy routes
- **Lazy loading**: All routes use dynamic imports for code splitting

## 🎯 Key Integration Points

### PDF Viewer Integration

- **Primary**: PDFTron WebViewer for advanced features
- **Fallback**: PDF.js for basic viewing
- **Global access**: Via `GlobalPdfViewer` component in main layout

### Firebase Integration

- **Authentication**: Multi-provider OAuth with role-based access control
- **Storage**: PDF and media file management with organized folder structure
- **Database**: Real-time newsletter metadata and user content management

### Build-Time Content Generation

- **PDF Manifest**: Generated by `scripts/generate-pdf-manifest.js` during build
- **Thumbnails**: Auto-generated and stored in `public/thumbnails/`
- **Metadata**: Extracted and cached for performance

## 🛠️ Common Development Tasks

### Adding New PDF Features

1. Verify PDF exists in `public/issues/` or Firebase Storage
2. Update manifest generation if needed
3. Use `newsletter-service.ts` for PDF operations
4. Test with both local and Firebase Storage PDFs

### Creating New Pages

1. Add component to `src/pages/` with `*Page.vue` naming
2. Register route in `src/router/routes.ts` with lazy loading
3. Use `MainLayout.vue` wrapper for consistent navigation

### Working with Firebase

1. Check Firebase configuration in `firebase.config.ts`
2. Use Firebase services for authentication, storage, and database operations
3. Follow security rules patterns for data access control

## 📚 Essential Documentation

- `FIREBASE_FIRST_ARCHITECTURE.md`: NEW simplified Firebase-first approach for MVP
- `CRITICAL_DEVELOPMENT_RULES.md`: User-enforced development constraints
- `FIREBASE_IMPLEMENTATION_SUMMARY.md`: Firebase integration overview
- `DEVELOPMENT_MEMORY.md`: Progress tracking and failed attempts
- `PDF_VIEWER_DOCS.md`: PDF integration patterns and troubleshooting

## 🚀 NEW FIREBASE-FIRST MVP APPROACH

### Access Points

- **Admin Interface**: `/admin/simplified` - NEW Firebase-first admin interface
- **Services**: `pdf-processing.service.ts` and `useSimplifiedAdmin.ts`
- **Architecture**: Single source of truth in Firebase

### Key Features

- Process local PDFs directly to Firebase
- No sync complexity or local storage
- Real-time publication management
- Batch processing with progress tracking
- Direct Firebase CRUD operations
