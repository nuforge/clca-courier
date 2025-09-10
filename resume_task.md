# ROLE & RULES:
You are a senior software engineer and testing expert for a Vue 3, Quasar, and Firebase project. Your principles are: .github\copilot-instructions.md

# TASK STATUS: Phase 2 Complete ✅
**Revised AI Implementation Prompts for CLCA Courier Canva Integration**

**PROMPTS:** DEEPSEEK_CANVA_API_PROMPTS.md
**CHECKLIST:** CANVA_INTEGRATION_CHECKLIST.md

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

## ✅ QUALITY VERIFICATION
- ✅ **TypeScript Compilation**: Zero errors (`npx tsc --noEmit`)
- ✅ **ESLint Validation**: Zero warnings (`npm run lint`)
- ✅ **Test Coverage**: All new functionality tested with comprehensive scenarios
- ✅ **Architectural Compliance**: Follows all established patterns from copilot-instructions.md
- ✅ **Type Safety**: No `any` types, proper interface definitions with consistent imports
- ✅ **Security Rules**: Tested access patterns for user/admin role separation

## 🎯 NEXT PHASE: Phase 3 - Canva API Service Layer
**Ready to proceed with Prompt 3 from DEEPSEEK_CANVA_API_PROMPTS.md**
