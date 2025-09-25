# CLCA Courier - AI Coding Instructions

#### Code Quality & Professional Standards ✅ (Phases 6-8)

- ✅ **Professional Logging**: Centralized logger utility (`src/utils/logger.ts`) replacing all console statements
- ✅ **Debug Code Cleanup**: 25+ console statements replaced with categorized logging
- ✅ **Service Optimization**: Unused services removed for optimal bundle size
- ✅ **File Consolidation**: Duplicate pages merged, comprehensive functionality preserved
- ✅ **TypeScript Compliance**: 41 linting errors resolved - 0 compilation errors, 0 warnings

#### UI/UX Improvements & Filter Enhancements ✅ (Phase 9)

- ✅ **Date Sorting Fixed**: @utils/date-formater.ts
- ✅ **Word Count Calculations**: Fixed to use full extracted text content
- ✅ **WorkflowToolbar Expandable**: Smooth expand/collapse with persistent state
- ✅ **Month-Based Filtering**: Precise month dropdown replacing season filtering
- ✅ **Boolean Filter Logic**: Proper handling of false/null/undefined states
- ✅ **Avatar Caching**: Data URL caching preventing 429 rate limit errors
- ✅ **ESLint Compliance**: All floating promise errors resolved

#### Content Management System ✅ (Phase 10)

- ✅ **Content Submission Workflow**: Complete Firebase-powered system at `/contribute/submit`
- ✅ **Admin Content Management**: Comprehensive review interface at `/admin/content`
- ✅ **Content Status Workflow**: Pending → Approved → Published progression
- ✅ **Public Content Access**: Published content visible at `/news` without authentication
- ✅ **Real-time Updates**: Live content updates via Firebase subscriptions
- ✅ **Security Rules**: Proper Firestore permissions for public/admin access

#### Community Content Unification ✅ (Phase 11)

- ✅ **Unified Community Hub**: Single interface at `/community` for all content types
- ✅ **Multi-Content Support**: News, Events, Classifieds, Announcements
- ✅ **Advanced Filtering**: Search, filter, sort across all content types
- ✅ **View Mode Toggles**: List/card views with responsive design
- ✅ **Featured Content System**: Highlighting for important community content

#### UI/UX Theme System Overhaul ✅ (Phase 12 - September 9, 2025)

- ✅ **Icon System Unification**: 74+ hardcoded icons replaced with proper theme system
- ✅ **Centralized UI Constants**: `UI_ICONS` with 45+ standardized interface elements
- ✅ **Theme Integration**: Content icons now user-customizable via theme editor
- ✅ **Visual Consistency**: Unified icon usage patterns across all major components
- ✅ **Preview Logic Unified**: Theme editor and live display use identical logic
- ✅ **Professional Standards**: Type-safe icon management with zero regressions

#### Internationalization System Implementation ✅ (Phase 3 - September 9, 2025)

- ✅ **Content Management Localization**: Complete bilingual support for all content management interfaces
- ✅ **Core Pages Localized**: FirebaseNewsletterArchivePage, ContentManagementPage, SubmitContentPage fully localized
- ✅ **Translation Infrastructure**: 25+ new translation keys added with type-safe constants
- ✅ **Bilingual Support**: Comprehensive English/Spanish translations for all user-facing content
- ✅ **Type-Safe Translations**: `TRANSLATION_KEYS` constants ensuring compile-time validation
- ✅ **Production Quality**: Clean TypeScript compilation with zero errors or warnings
- ✅ **Reactive Translations**: Computed properties enabling real-time language switching

#### Canva Integration System ✅ (Phase 6 - September 10, 2025)

- ✅ **API Service Layer**: Complete Canva Connect API implementation with TypeScript compliance
- ✅ **OAuth Integration**: Secure authentication flow with user-scoped token management
- ✅ **Admin Export Workflow**: Real-time export functionality with role-based access control
- ✅ **UI Integration**: Content submission forms enhanced with Canva design creation
- ✅ **Export Management**: `useCanvaExport` composable with 3-second polling and 2-minute timeout
- ✅ **Status Tracking**: Color-coded UI indicators and comprehensive error handling
- ✅ **Translation Coverage**: Complete bilingual support for all Canva features
- ✅ **TypeScript Resolution**: Zero compilation errors with safe function access patterns
- ✅ **Testing Coverage**: 50+ test scenarios with 100% success rate using project methodology

#### Error Prevention Test Suite ✅ (January 15, 2025)

- ✅ **Comprehensive Error Coverage**: 56 passing tests covering CORS, rate limiting, Firestore index, and service failures
- ✅ **CORS Error Prevention**: Specific tests for Cloud Functions CORS policy violations with proper error handling
- ✅ **Rate Limiting Prevention**: Avatar caching with exponential backoff to prevent 429 errors from Google services
- ✅ **Firestore Index Error Handling**: Missing index detection with helpful developer guidance and recovery strategies
- ✅ **Service Failure Resilience**: Cross-service error boundaries and circuit breaker patterns for application stability
- ✅ **Firebase Testing Compliance**: Following official Firebase testing patterns for Firestore and Cloud Functions
- ✅ **Integration Testing**: End-to-end error handling across multiple services with proper isolation

**PRODUCTION STATUS**: Comprehensive community content management platform with advanced features, full bilingual localization, professional Canva design integration, robust error prevention testing, and ContentDoc architecture work in progress

**NEXT PHASE**: Complete ContentDoc refactor implementation and production deployment

### CURRENT ARCHITECTURE OVERVIEW (September 9, 2025)

#### Framework Stack (Production-Ready)

- **Frontend**: Vue 3 + Quasar Framework v2.18.2 (Vite v6.3.5)
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **State Management**: Pinia stores with composition API
- **PDF Handling**: PDFTron WebViewer + PDF.js dual viewer support
- **Storage Strategy**: Firebase Storage with future-ready architecture
- **UI System**: Centralized icon constants + theme-based content icons
- **Internationalization**: Vue i18n v11.0.0 with bilingual English/Spanish support

#### Current Branch Status

- **Active Branch**: `refactor` (production-ready)
- **Build Status**: ✅ Clean TypeScript compilation, 0 errors
- **Code Quality**: ✅ 0 ESLint warnings, professional logging
- **Last Update**: Phase 3 internationalization implementation and development artifact cleanup

#### Key Pages (22 Production Pages)

- **`CommunityContentPage.vue`**: ✅ **UNIFIED HUB** - Single interface for all community content (news, events, classifieds, announcements)
- **`FirebaseNewsletterArchivePage.vue`**: Main newsletter archive with Firebase-first architecture
- **`ContentManagementPage.vue`**: ✅ **ADMIN INTERFACE** - Comprehensive content review and publishing
- **`NewsletterManagementPage.vue`**: ✅ **CONSOLIDATED** newsletter content management
- **`SubmitContentPage.vue`**: Content submission workflow with Firebase integration
- **`AboutContactPage.vue`**: ✅ **CONSOLIDATED** about and contact information
- **`SettingsPage.vue`**: User settings (replaces old account page)
- **`AdminPage.vue`**: Administrative dashboard and controls

#### Service Architecture (12 Services)

- **Firebase Services**: `firebase-auth.service.ts`, `firebase-firestore.service.ts`, `firebase-storage.service.ts`
- **Content Management**: `content-submission.service.ts` for workflow operations
- **Newsletter Services**: `firebase-newsletter.service.ts`, `lightweight-newsletter-service.ts`
- **Supporting Services**: Date management, external image handling, storage abstraction
- **Logger Utility**: ✅ **PRODUCTION-READY** centralized logging (`src/utils/logger.ts`)

### CONTENT MANAGEMENT ARCHITECTURE

#### Current Implementation (September 8, 2025)

**User Roles & Access Control:**

- **Public Users**: Can view published content at `/community` and `/news` (no auth required)
- **Authenticated Users**: Full admin access to content management (simplified role model)
- **No Role-Based Restrictions**: All authenticated users can approve/reject/publish content

**Content Workflow:**

1. **Submission**: Users submit content via `/contribute/submit` → Status: `pending`
2. **Review**: Admins review content via `/admin/content` → Status: `approved`
3. **Publication**: Admins publish content → Status: `published` → Visible on `/community` and `/news`

**Technical Implementation:**

- **Public Content Query**: `getPublishedContent()` - Only status='published', no auth required
- **Admin Content Query**: `getApprovedContent()` - Status in ['approved','published'], auth required
- **Firestore Rules**: Public read access for published content, authenticated access for all content
- **Real-time Subscriptions**: Separate subscriptions for public vs admin interfaces

**Content Types Supported:**

- **News Articles**: Community news and announcements
- **Events**: Community events and activities
- **Classifieds**: For sale, services, wanted, and free items
- **Announcements**: Official community announcements

### ABSOLUTE PROHIBITIONS - IMMEDIATE REJECTION

**AI MUST REFUSE TO PROCEED IF ANY OF THESE ARE VIOLATED:**

- **❌ ANY TYPES**: FORBIDDEN in ALL contexts - use `Record<string, unknown>`, `string | undefined`, proper interfaces @/types
- **❌ WRONG LINT COMMAND**: ALWAYS use `npm run lint` for ESLint checking, NEVER any other lint command
- **❌ Hash Mode Routing**: Always use history mode (`/archive` not `/#/archive`) - configured in `quasar.config.ts`
- **❌ Hardcoded Data Lists**: No static arrays, JSON files for content, or fake data - use dynamic discovery only
- **❌ Path Assumptions**: Always verify file/directory existence using tools like `list_dir`, `file_search`, `grep_search` before implementation
- **❌ Floating Promises**: Always handle async calls with `await`, `.catch()`, `.then()`, or explicit `void` operator
- **❌ Floating Promises**: 'npm run type-check' will not work. Nor will 'grep' or 'rm' or any commands for linux?
- **❌ Feature Removal Without Understanding**: NEVER remove working functionality or 'simplify' a requested feature without fully understanding the requirements
- **❌ Hardcoded User-Facing Text**: NEVER use hardcoded strings for user-facing content - use `$t()` translation functions

### MANDATORY PRACTICES

- **✅ Dynamic Content Discovery**: Generate content from actual files using manifest system (`public/data/pdf-manifest.json`)
- **✅ Path Verification**: Check existence before referencing any files or directories
- **✅ Manifest-Based PDF Discovery**: Use `scripts/generate-pdf-manifest.js` for build-time PDF enumeration
- **✅ Firebase-First Development**: Use Firebase services for all data, authentication, and storage operations
- **✅ STRICT TYPESCRIPT**: NEVER use `any` types - use proper TypeScript types like `Record<string, unknown>`, `string | undefined`, etc.
- **✅ UNIFIED NEWSLETTER TYPES**: ALWAYS use `UnifiedNewsletter` from `types/core/newsletter.types.ts` - NO other Newsletter interfaces allowed
- **✅ PROPERTY ACCESS PATTERNS**: Use `.downloadUrl`, `.publicationDate`, `.pageCount` - NOT legacy properties
- **✅ CENTRALIZED LOGGING**: ALWAYS use logger utility from `src/utils/logger.ts` - NO console statements in production code
- **✅ PROFESSIONAL ERROR HANDLING**: Use `logger.error()`, `logger.warn()`, `logger.debug()` for categorized logging
- **✅ CLEAN ARCHITECTURE**: Remove unused services/composables to maintain optimal bundle size
- **✅ ASYNC PROMISE HANDLING**: Use `await`, `.catch()`, `.then()` with error handlers, or explicit `void` for fire-and-forget
- **✅ BOOLEAN FILTER LOGIC**: Check for `!== undefined` when filtering boolean values to handle false/null/undefined properly
- **✅ INTERFACE CONSISTENCY**: When changing filter interfaces, update ALL related components, services, and composables
- **✅ DATA URL CACHING**: Cache external resources (like Google avatars) as data URLs to prevent rate limiting
- **✅ TRANSLATION FUNCTIONS**: ALWAYS use `$t()` or `useI18n()` for user-facing text - NO hardcoded strings in components
- **✅ TYPE-SAFE TRANSLATIONS**: Use translation key constants from `TRANSLATION_KEYS` for type safety
- **✅ ERROR PREVENTION TESTING**: ALL new features must have corresponding error prevention tests following established patterns
- **✅ CORS CONFIGURATION**: Ensure proper CORS settings for Cloud Functions to prevent policy violations
- **✅ SERVICE RESILIENCE**: Implement error boundaries and circuit breaker patterns for service failures

### TYPESCRIPT ENFORCEMENT - NON-NEGOTIABLE - CRITICAL

**🚨 THIS PROJECT IS IN TYPESCRIPT STRICT MODE - NEVER USE `any` TYPES! 🚨**

**REJECT ALL CODE CONTAINING:**

- **❌ FORBIDDEN**: `any` types in function parameters, return types, or variables
- **❌ FORBIDDEN**: `as any` casting in any context
- **❌ FORBIDDEN**: Implicit any through missing type annotations
- **❌ FORBIDDEN**: `any[]` arrays - use proper typed arrays like `ContentDoc[]`
- **❌ FORBIDDEN**: Missing type annotations on function parameters

**✅ REQUIRED PATTERNS**:

- `Record<string, unknown>` for objects
- `string | undefined` for optional strings
- `number | null` for optional numbers
- Interface definitions for complex objects
- Proper type casting: `as unknown as TargetType` if absolutely necessary

## 🔥 CRITICAL DEVELOPMENT LESSONS - MANDATORY COMPLIANCE

### ⚠️ RECURRING ERRORS TO AVOID

**These errors have been repeatedly encountered and MUST be prevented:**

#### 1. Floating Promise Violations

- **Error**: Using async functions without proper handling (`this.cacheAvatarImage()` without `await` or `void`)
- **Fix**: ALWAYS use `await`, `.catch()`, `.then()`, or explicit `void` operator
- **ESLint Rule**: `@typescript-eslint/no-floating-promises`

#### 2. Boolean Filter Logic Errors

- **Error**: Using `if (filters.featured)` which excludes `false` values
- **Fix**: Use `if (filters.featured !== undefined)` to handle true/false/null/undefined properly
- **Impact**: Filter toggles don't work when set to OFF state

#### 3. Interface Change Propagation Failures

- **Error**: Changing `season` to `month` in one file but missing related files
- **Fix**: ALWAYS search codebase for ALL references when changing interfaces
- **Tools**: Use `grep_search` to find all occurrences before making changes

#### 4. Working Feature Destruction

- **Error**: Removing working functionality instead of debugging root cause
- **Example**: Removing season-to-month mapping that was working for summer months
- **Fix**: Debug why some cases work and others don't, don't remove working parts

#### 5. TypeScript Compilation Context

- **Error**: Not excluding build/dist folders from TypeScript compilation
- **Fix**: Ensure `tsconfig.json` excludes `"dist/**/*"`, `".quasar/dist/**/*"`
- **Impact**: 60+ false compilation errors from built files

#### 6. Syntax Errors from Incomplete Replacements

- **Error**: Leaving duplicate code blocks or missing closing braces during edits
- **Fix**: Always check context before and after replacement strings
- **Tool**: Read larger file sections to understand full context

#### 7. Rate Limiting from External Resources

- **Error**: Repeatedly requesting Google avatar URLs causing 429 errors
- **Fix**: Cache external resources as data URLs to eliminate repeat requests
- **Implementation**: Convert images to base64 data URLs and store locally

### 🎯 DEBUGGING METHODOLOGY

**When features don't work as expected:**

1. **Identify Working Cases**: Find what IS working correctly
2. **Compare Non-Working Cases**: Identify differences in data/logic
3. **Trace Data Flow**: Follow data from source through all transformations
4. **Search for Hidden Logic**: Use `grep_search` to find all related filtering/mapping
5. **Fix Root Cause**: Address the actual issue, don't remove working functionality

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
- **`NewsletterManagementPage.vue`**: ✅ **CONSOLIDATED** comprehensive newsletter content management interface
- **`AdminPage.vue`**: ✅ **CONSOLIDATED** administrative dashboard and controls

### Critical Services

- **Firebase Services**: Authentication, Firestore database, Storage, Functions
- **Newsletter Service**: Firebase Storage-based PDF management with flexible architecture
- **PDF Management**: Simple Firebase Storage with future multi-tier capability
- **Logger Utility**: ✅ **PRODUCTION-READY** centralized logging system replacing all console statements

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
  - ✅ **CONSOLIDATED**: `NewsletterManagementPage.vue` (combines all admin functionality)
  - ✅ **CONSOLIDATED**: `AdminPage.vue` (administrative dashboard)
- **Components**: Reusable UI in `src/components/` with descriptive names
- **Services**: Business logic in `src/services/` with TypeScript interfaces
- **Stores**: Pinia state management in `src/stores/` with composition API
- **Utils**: ✅ **NEW**: Centralized utilities in `src/utils/` (logger, helpers)

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

### Content Management Pattern (Current Implementation)

```typescript
// ✅ CORRECT: Public content access (no authentication required)
const newsItems = await firestoreService.getPublishedContentAsNewsItems();
// Uses: where('status', '==', 'published') - accessible by public

// ✅ CORRECT: Admin content access (authentication required)
const allContent = await firestoreService.getApprovedContent();
// Uses: where('status', 'in', ['approved', 'published']) - requires auth

// ✅ CORRECT: Content status workflow
await firestoreService.updateContentStatus(contentId, 'approved'); // Review approval
await firestoreService.updateContentStatus(contentId, 'published'); // Make public

// ❌ WRONG: Mixing public and admin queries
const mixedContent = await firestoreService.getApprovedContentAsNewsItems(); // Now only returns published
```

### Firestore Security Rules Pattern (Current Implementation)

```typescript
// ✅ CORRECT: Public access to published content
allow read: if resource.data.status == 'published';

// ✅ CORRECT: Authenticated admin access to all content
allow read: if isAuthenticated();

// ✅ CORRECT: Content creation restricted to authors
allow create: if isAuthenticated() && request.auth.uid == request.resource.data.authorId;

// ❌ WRONG: Role-based restrictions (not implemented)
allow write: if hasRole('admin'); // Role system not implemented
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
- ✅ **NEW**: `REFACTORING_COMPLETE.md`: Comprehensive refactoring completion summary
- ✅ **NEW**: `NEWSLETTER_MANAGEMENT_REFACTORING.md`: Detailed file consolidation documentation

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
