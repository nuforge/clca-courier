# ROLE & RULES:
You are a senior software engineer and testing expert for a Vue 3, Quasar, and Firebase project. Your principles are: .github\copilot-instructions.md

# TASK STATUS: Phase 1 Complete ✅
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

## ✅ QUALITY VERIFICATION
- ✅ **TypeScript Compilation**: Zero errors (`npx tsc --noEmit`)
- ✅ **ESLint Validation**: Zero warnings (`npm run lint`)
- ✅ **Architectural Compliance**: Follows all established patterns from copilot-instructions.md
- ✅ **Type Safety**: No `any` types, proper interface definitions
- ✅ **Import Strategy**: Correct relative imports, no path resolution issues

## 🎯 NEXT PHASE: Phase 2 - Firestore Rules & Service Layer Extension
**Ready to proceed with Prompt 2 from DEEPSEEK_CANVA_API_PROMPTS.md**
