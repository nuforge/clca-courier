# ROLE & RULES:
You are a senior software engineer and testing expert for a Vue 3, Quasar, and Firebase project. Your principles are: .github\copilot-instructions.md

# TASK STATUS: ✅ CANVA INTEGRATION COMPLETE - All Phases 1-8 Complete (Print Workflow)
**Revised AI Implementation Prompts for CLCA Courier Canva Integration**

**PROMPTS:** DEEPSEEK_CANVA_API_PROMPTS_FINAL.md
**CHECKLIST:** CANVA_INTEGRATION_CHECKLIST.md
**LATEST:** CANVA_INTEGRATION_PHASE8_PRINT_COMPLETE.md

## 🎉 PROJECT COMPLETION: Full Canva Connect API Integration + Print Workflow

### **Phase 8 Complete** - Print Workflow Integration ✅

#### **Enhanced SubmitContentPage.vue Implementation** ✅
- ✅ **Canva Template Integration Banner** - Dynamic display based on available templates
- ✅ **Professional Template Showcase Dialog** - Complete with preview grid and feature explanations
- ✅ **Template Loading & Management** - Fetches templates from Firestore with error handling
- ✅ **Reactive Template Availability** - Shows integration banner only when templates exist

#### **Translation System Extensions** ✅
- ✅ **New Translation Keys Added**:
  - `CANVA.DESIGN_WITH_TEMPLATES`: 'Professional Design Templates Available'
  - `CANVA.TEMPLATES_AVAILABLE_MESSAGE`: 'Create professional designs automatically using our Canva brand templates'
  - `CANVA.LEARN_MORE`: 'Learn More'
- ✅ **Complete Bilingual Support** - English and Spanish translations for all new features

#### **Technical Implementation Quality** ✅
- ✅ **TypeScript Compliance** - Zero compilation errors, strict type safety
- ✅ **ESLint Compliance** - Zero warnings, professional code standards
- ✅ **Architectural Compliance** - Follows all established project patterns
- ✅ **Build Success** - Production build completed successfully

### **ALL CANVA INTEGRATION PHASES COMPLETE** ✅

**Comprehensive Feature Set Delivered:**

#### **Core Functionality** ✅ (Phases 1-6)
- ✅ **Canva API Service** - Complete service layer with design creation and export
- ✅ **OAuth Integration** - Secure authentication flow with existing Firebase auth
- ✅ **Admin Export Workflow** - Real-time polling and download management
- ✅ **Firebase Integration** - Seamless storage and metadata management

#### **Template & Autofill System** ✅ (Phases 7-9)
- ✅ **Brand Templates Support** - Template configuration and storage in Firestore
- ✅ **Autofill API Implementation** - Complete field mapping and data population
- ✅ **Template Selection UI** - Professional component with preview and filtering
- ✅ **Content Form Integration** - Template-based workflow in submission forms

#### **Page-Level Integration** ✅ (Phase 10)
- ✅ **SubmitContentPage Enhancement** - Template showcase and user guidance
- ✅ **Dynamic Feature Display** - Smart UI that adapts to available templates
- ✅ **User Education** - Comprehensive information about template-based design
- ✅ **Professional UX** - Seamless integration with existing page design

**PRODUCTION STATUS**: 🚀 **READY FOR DEPLOYMENT** 

The CLCA Courier platform now features complete Canva Connect API integration enabling community members to create professional designs automatically using brand templates with their content submissions.

---

## IMPLEMENTATION SUMMARY

**Architecture Components:**
- **Service Layer**: `src/services/canva-api.service.ts` (400+ lines)
- **Authentication**: `src/composables/useCanvaAuth.ts` (372 lines)
- **Export Management**: `src/composables/useCanvaExport.ts` (400+ lines)
- **Template Selection**: `src/components/canva/CanvaTemplateSelector.vue` (336 lines)
- **Page Integration**: Enhanced `src/pages/SubmitContentPage.vue`
- **Form Integration**: Enhanced `src/components/contribution/ContentSubmissionForm.vue`

**Technical Excellence:**
- **Zero TypeScript Errors** - Strict compliance with project standards
- **Comprehensive Testing** - 50+ test scenarios across all components
- **Full Internationalization** - Complete English/Spanish support
- **Firebase Integration** - Seamless storage and configuration management
- **Professional UX** - Intuitive workflows and error handling

## ✅ COMPLETED: Phase 9 - UI Integration with Template Selection and Autofill

### **Template Selection Component Implementation** ✅

#### **9.1 CanvaTemplateSelector Component Created** ✅
- ✅ **Visual Template Grid** with cards, thumbnails, and descriptions
- ✅ **Content Type Filtering** - Shows only relevant templates for selected content type
- ✅ **Real-time Template Loading** from Firestore `app/config` document
- ✅ **Field Mapping Preview** with color-coded field relationship display

#### **9.2 Content Submission Form Integration** ✅
- ✅ **Template Selector Integration** in `ContentSubmissionForm.vue` before design creation
- ✅ **Dynamic Button Logic** - Changes based on template selection state
- ✅ **Conditional Workflow** - Template-based autofill vs standard design creation

### **Autofill Implementation with Field Mapping** ✅

#### **9.3 Autofill Method Implementation** ✅
- ✅ **Created `createCanvaDesignWithAutofill()` Method** - Full integration with Canva API
- ✅ **Dynamic Field Mapping** in `prepareAutofillData()` function
  - ✅ Supports nested field paths (e.g., `metadata.eventDate`)
  - ✅ Filters empty/null values for clean autofill data

#### **9.4 Form Integration with Template Logic** ✅
- ✅ **Template Selection State Management** - `selectedTemplate` and `selectedTemplateId` refs
- ✅ **Form Data Mapping to Templates** - Content submission data mapped to template placeholders
- ✅ **User Experience Flow** - Template selection → field mapping → autofill creation

### **Translation System Extensions** ✅

#### **9.5 Internationalization Support** ✅
- ✅ **Added 12 New Translation Keys** for template selection interface
- ✅ **English Translations** - Complete template selection UI language support
- ✅ **Spanish Translations** - Full bilingual implementation

### **Infrastructure and Quality** ✅

#### **9.6 Firebase Integration** ✅
- ✅ **Added `getDocument()` Method** to `FirebaseFirestoreService` for template retrieval
- ✅ **Template Storage Strategy** - Uses `app/config` document with `canvaTemplates` array
- ✅ **Sample Data Setup Script** - `scripts/setup-canva-templates.js` for testing

#### **9.7 TypeScript Compliance and Error Handling** ✅
- ✅ **Zero Compilation Errors** - All new code passes strict TypeScript validation
- ✅ **Professional Error Handling** - Comprehensive user feedback and logging
- ✅ **Type-Safe Implementation** - Proper interfaces and null/undefined handling

**Production Status**: Template selection and autofill UI integration complete with comprehensive testing infrastructure and full bilingual support

---

## ✅ COMPLETED: Phase 8 - Autofill API Service Integration

### **Extended Canva API Service with Autofill Support** ✅ COMPLETE

#### **8.1 New Autofill Method Implementation** ✅
- ✅ **Created `createDesignWithAutofill` Method** in `src/services/canva-api.service.ts`
  - ✅ Strict TypeScript typing with `Record<string, unknown>` for autofill data
  - ✅ Implements Canva Autofill API endpoint: `POST /v1/designs?autofill=true`
  - ✅ Request body structured per Canva API docs with `design_type`, `template_id`, `autofill`
  - ✅ Comprehensive parameter validation for template ID and autofill data
  - ✅ Returns simplified interface: `{ designId: string; editUrl: string }`

#### **8.2 API Response Type System** ✅
- ✅ **Added `CanvaAutofillDesignResponse` Interface** in `src/services/canva/types.ts`
  - ✅ Mirrors structure of existing `CanvaCreateDesignResponse`
  - ✅ Includes design ID and edit URL fields for consistency
  - ✅ Properly imported in service file with other types
  - ✅ Follows project naming conventions and patterns

#### **8.3 Comprehensive Testing Implementation** ✅
- ✅ **Created 20 Test Scenarios** in `tests/unit/services/canva-api.service.test.ts`
  - ✅ Successful autofill creation with various data types
  - ✅ Parameter validation tests (template ID, autofill data)
  - ✅ Empty and complex nested autofill data handling
  - ✅ Invalid API response structure handling
  - ✅ Canva API error responses with detailed logging verification
  - ✅ HTTP error responses with status code handling
  - ✅ Unexpected error handling with proper logging patterns
  - ✅ Security validation: logs keys but not sensitive values
  - ✅ Request structure verification with correct endpoint and payload

#### **8.4 Error Handling & Logging** ✅
- ✅ **Established Error Patterns Implementation**
  - ✅ Uses existing logger utility from `src/utils/logger.ts`
  - ✅ Categorized logging: info for operations, error for failures
  - ✅ Security-conscious logging (logs autofill keys, not values)
  - ✅ Graceful error handling following project patterns
  - ✅ Detailed error context for debugging and monitoring

#### **8.5 Code Quality Validation** ✅
- ✅ **TypeScript & ESLint Compliance**
  - ✅ Zero compilation errors with new autofill method
  - ✅ ESLint compliance: `npm run lint` passes with zero warnings
  - ✅ All 20 test scenarios pass with 100% success rate
  - ✅ Proper import structure and dependency management
  - ✅ Followed established architectural patterns

**Production Status**: Autofill API service integration complete with comprehensive testing and full TypeScript compliance

---

## ✅ COMPLETED: Phase 7 - Brand Templates & Autofill Interface Extensions

### **Extended Core Type System for Template Support** ✅ COMPLETE

#### **7.1 ContentSubmissionData Interface Extension** ✅
- ✅ **Extended `src/types/core/content.types.ts`** - Added Brand Template support
  - ✅ Added `canvaTemplateId?: string` field for template tracking
  - ✅ Added `autoFillData?: Record<string, unknown>` field for autofill data
  - ✅ Maintained strict TypeScript compliance with zero `any` types
  - ✅ Ensured backward compatibility with existing content submission workflow

#### **7.2 Template Configuration Type System** ✅
- ✅ **Created `CanvaTemplateConfig` interface** in `src/services/canva/types.ts`
  - ✅ Template metadata system (id, name, description)
  - ✅ Content type linking with existing `ContentType` enum
  - ✅ Field mapping system for autofill (`Record<string, string>`)
  - ✅ Firebase Timestamp integration for consistency
  - ✅ Thumbnail URL and active status management

#### **7.3 Architectural Compliance** ✅
- ✅ **Storage Strategy Implementation**
  - ✅ Planned storage in existing admin collection (`app/config/canvaTemplates`)
  - ✅ Avoided creating new top-level Firestore collections
  - ✅ Maintained Firebase-first architectural patterns
  - ✅ Proper TypeScript import paths and dependencies

#### **7.4 Code Quality Validation** ✅
- ✅ **TypeScript & ESLint Compliance**
  - ✅ Zero compilation errors with new interface extensions
  - ✅ ESLint compliance: `npm run lint` passes with zero warnings
  - ✅ Proper import structure and type safety maintained
  - ✅ Followed established naming conventions and patterns

**Production Status**: Brand Templates and Autofill interface extensions complete with full TypeScript compliance

---

## ✅ COMPLETED: Phase 6 - Admin Export Integration with Real-time Polling

### **Extended Admin Review Interface (`ContentManagementPage.vue`)** ✅ COMPLETE

#### **6.1 Canva Export Composable** ✅
- ✅ **Created `useCanvaExport.ts`** - Complete export management with 400+ lines of production code
  - ✅ Real-time polling system (3-second intervals, 2-minute timeout)
  - ✅ Status tracking and progress indicators
  - ✅ Comprehensive error handling with user notifications

#### **6.2 Admin Interface Enhancement** ✅  
- ✅ Enhanced `ContentManagementPage.vue` with Canva export handlers
- ✅ Extended `ContentTable.vue` with role-based export buttons
- ✅ Status-conditional UI elements with color-coded actions
- ✅ Permission checking integration with existing auth system

#### **6.3 Export Workflow Implementation** ✅
- ✅ `exportDesignForPrint()` - Complete export initiation with role validation
- ✅ Real-time polling with automatic status updates
- ✅ Download management with secure file handling
- ✅ Translation integration for all user-facing messages

#### **6.4 TypeScript Compliance & Testing** ✅
- ✅ Created comprehensive test suite (`useCanvaExport.test.ts`) with 50+ test scenarios
- ✅ Fixed all TypeScript compilation errors (safe function access patterns)
- ✅ Zero ESLint warnings maintained
- ✅ Production-ready code quality standards achieved

**Production Status**: Admin export integration complete with zero compilation errors and full functionality

---

## ✅ COMPLETED: Phase 5 - UI Integration in Content Submission Forms

### **Enhanced Content Submission Interface** ✅ COMPLETE

#### **5.1 UI Integration** ✅
- ✅ Modified `ContentSubmissionForm.vue` with comprehensive Canva section
- ✅ Responsive card-based design with mobile-first approach
- ✅ OAuth authentication integration with loading states

#### **5.2 Design Status Management** ✅  
- ✅ Color-coded status chips: orange (draft), blue (pending), green (exported), red (failed)
- ✅ Context-sensitive action buttons based on design state
- ✅ Real-time UI updates reflecting design lifecycle

---

## ✅ COMPLETED: Phase 4 - OAuth Integration with Existing Auth System

### **OAuth Composable Implementation** ✅ COMPLETE

#### **4.1 Core OAuth Functions** ✅
- ✅ `initiateOAuth()` - Firebase user verification and Canva authorization
- ✅ `handleOAuthRedirect()` - Callback processing with secure token storage
- ✅ `signOut()` - Complete token cleanup and state management

#### **4.2 Security & Translation Integration** ✅  
- ✅ Cryptographically secure state generation for CSRF protection
- ✅ User-scoped token storage preventing cross-user access
- ✅ Complete bilingual support (English/Spanish) with 23 translation keys

---

## ✅ COMPLETED: Phase 3 - Canva API Service Implementation

### **Core API Service** ✅ COMPLETE

#### **3.1 Service Layer** ✅
- ✅ Created `canva-api.service.ts` with comprehensive TypeScript implementation
- ✅ Environment variable validation and configuration management
- ✅ Axios integration with interceptors and error handling

#### **3.2 API Methods** ✅  
- ✅ `createDesignFromTemplate()` - Template-based design creation
- ✅ `exportDesign()` - Design export with status polling
- ✅ `getDesign()` - Design retrieval with validation
- ✅ 100% test success rate (10/10 tests passing)

---

## ✅ COMPLETED: Phase 2 - Firebase & Service Layer Extension

### **Service Integration** ✅ COMPLETE

#### **2.1 Firestore Integration** ✅
- ✅ Extended Firestore rules for Canva design data
- ✅ Enhanced `content-submission.service.ts` with `attachCanvaDesign()`
- ✅ Secure data storage patterns with user authentication

---

## ✅ COMPLETED: Phase 1 - Foundational Corrections & Type-Safe Environment

### **Prompt 1: Project-Aligned TypeScript Foundation** ✅ COMPLETE

#### **1.1 TypeScript Type Definitions** ✅
- ✅ **Created Canva Types File** - `src/services/canva/types.ts`
  - ✅ Defined `CanvaDesign` interface with status literals ('draft' | 'pending_export' | 'exported' | 'failed')
  - ✅ Defined `CanvaComment` interface with Firestore @documentId pattern
  - ✅ Used Firebase `Timestamp` for dates (project standard pattern)
  - ✅ Zero `any` types - strict TypeScript compliance
  - ✅ Added comprehensive API response interfaces and type guards

#### **1.2 Extended Core Content Types** ✅  
- ✅ Modified `ContentSubmissionData` in `src/types/core/content.types.ts`
- ✅ Added optional `canvaDesign?: CanvaDesign` field
- ✅ Proper import path using relative imports
- ✅ Verified zero TypeScript compilation errors

#### **1.3 Environment Variables Setup** ✅
- ✅ Updated `.env.example` with required Canva Connect API variables:
  - `VITE_CANVA_API_BASE_URL`
  - `VITE_CANVA_APP_ID` 
  - `VITE_CANVA_API_REDIRECT_URI`
- ✅ Maintained existing Canva legacy variables for backward compatibility

#### **1.4 Internationalization Foundation** ✅
- ✅ Added `CANVA` namespace to `TRANSLATION_KEYS` in `src/i18n/utils/translation-keys.ts`
- ✅ Included core keys: `DESIGN_CREATED`, `EXPORT_PENDING`, `EXPORT_COMPLETE`, `OPEN_DESIGN`, `CREATE_DESIGN`
- ✅ Added error handling keys: `AUTH_FAILED`, `EXPORT_FAILED`, `CONNECTION_ERROR`
- ✅ Added user action keys: `CREATE_WITH_CANVA`, `EDIT_IN_CANVA`, `DOWNLOAD_DESIGN`

## ✅ COMPLETED: Phase 2 - Firestore Rules & Service Layer Extension

### **Prompt 2: Firebase Integration** ✅ COMPLETE

#### **2.1 Firestore Security Rules** ✅
- ✅ **Updated `firestore.rules`** for `userContent` collection
  - ✅ Added rules allowing authenticated users to update `canvaDesign` field on their own submissions when status is 'pending'
  - ✅ Added rules allowing admin/editor roles to update `canvaDesign.status` to 'exported'
  - ✅ Maintained existing security patterns for content management workflow
  - ✅ Proper nested field access control for Canva design properties

#### **2.2 Service Layer Extension** ✅
- ✅ **Extended `firebase-firestore.service.ts`**
  - ✅ Added `canvaDesign?: CanvaDesign` field to `UserContent` interface
  - ✅ Added `updateUserContent(contentId: string, updates: Partial<UserContent>): Promise<void>` method
  - ✅ Proper type imports for `CanvaDesign` interface
  - ✅ Followed existing error handling patterns with centralized logger

- ✅ **Extended `content-submission.service.ts`**
  - ✅ Added `attachCanvaDesign(contentId: string, canvaDesign: CanvaDesign): Promise<void>` method
  - ✅ Used centralized `logger.info('Canva design attached', { contentId })` instead of console statements
  - ✅ Proper error handling following existing service patterns
  - ✅ Type-safe implementation with proper imports

#### **2.3 Testing Implementation** ✅
- ✅ **Created comprehensive Vitest test suite** for `attachCanvaDesign` method
  - ✅ Test successful Canva design attachment to content
  - ✅ Test error handling for Firestore update failures
  - ✅ Test handling of exported designs with export URLs
  - ✅ All tests passing (22/22) with Firebase emulator patterns
  - ✅ Proper mocking of Firebase services and logger utility

## ✅ COMPLETED: Phase 3 - Canva API Service Layer

### **Prompt 3: Core API Service Implementation** ✅ COMPLETE

#### **3.1 Core API Service Creation** ✅
- ✅ **Created Canva API Service** - `src/services/canva-api.service.ts`
  - ✅ Full TypeScript implementation with zero `any` types
  - ✅ Comprehensive error handling following project patterns
  - ✅ Axios instance configuration with proper interceptors
  - ✅ Environment variable validation and configuration management

#### **3.2 Core Methods Implementation** ✅
- ✅ **`createDesignFromTemplate(templateId: string): Promise<CanvaDesign>`**
  - ✅ Template ID validation with proper error messages
  - ✅ Canva API error structure handling
  - ✅ HTTP error handling with status code management
  - ✅ Network error handling for offline scenarios
  - ✅ Response validation and transformation to `CanvaDesign` interface

- ✅ **`exportDesign(designId: string): Promise<{ exportUrl: string }>`**
  - ✅ Design ID validation
  - ✅ Export job status handling (in_progress, success, failed)
  - ✅ Proper error messaging for each export state

- ✅ **`getDesign(designId: string): Promise<CanvaDesign>`**
  - ✅ Design retrieval with comprehensive error handling
  - ✅ 404 handling for non-existent designs
  - ✅ Response structure validation

- ✅ **`getConfig(): CanvaConfig`**
  - ✅ Configuration access with deep copy protection
  - ✅ Type-safe configuration structure

#### **3.3 Testing Implementation - 100% Success Rate** ✅
- ✅ **Created comprehensive Vitest test suite** using proven CLCA Courier methodology
  - ✅ **10/10 tests passing (100% success rate)** following PROJECT_STATUS_COMPLETE.md patterns
  - ✅ Used `vi.hoisted()` patterns successfully for dependency mocking
  - ✅ Proper mock structure for logger, Firebase Timestamp, and Axios
  - ✅ Service initialization testing with configuration validation
  - ✅ All core method testing with success and error scenarios
  - ✅ Parameter validation testing for all public methods

#### **3.4 Architecture Compliance** ✅
- ✅ **Centralized Logger Integration** - Uses `src/utils/logger.ts` for all logging
- ✅ **Firebase Timestamp Patterns** - Follows established project timestamp usage
- ✅ **Environment Variable Patterns** - Consistent with project `.env` structure
- ✅ **Error Handling Standards** - Matches project error handling conventions
- ✅ **TypeScript Compliance** - Zero compilation errors, strict type safety

## ✅ QUALITY VERIFICATION - Phase 3
- ✅ **TypeScript Compilation**: Zero errors (`npx tsc --noEmit`)
- ✅ **Test Coverage**: 100% success rate (10/10 tests) using proven methodology
- ✅ **Architecture Compliance**: Follows all established CLCA Courier patterns
- ✅ **Environment Integration**: Works with existing `.env` configuration
- ✅ **Service Layer**: Ready for OAuth integration and UI implementation

---

## 🎯 NEXT PHASE: Phase 4 - OAuth Integration & UI Components

### **Ready for Implementation:**
- OAuth composable (`src/composables/useCanvaAuth.ts`)
- UI integration with existing content submission workflow
- Content attachment functionality integration

### **Current Branch Status:**
- **Active Branch**: `canva` (ready for Phase 4)
- **Build Status**: ✅ Clean compilation, 0 errors
- **Test Status**: ✅ 100% success rate with proven methodology
- ✅ **Architectural Compliance**: Follows all established patterns from copilot-instructions.md
- ✅ **Type Safety**: No `any` types, proper interface definitions with consistent imports
- ✅ **Security Rules**: Tested access patterns for user/admin role separation

## 🎯 NEXT PHASE: Phase 3 - Canva API Service Layer
**Ready to proceed with Prompt 3 from DEEPSEEK_CANVA_API_PROMPTS.md**
