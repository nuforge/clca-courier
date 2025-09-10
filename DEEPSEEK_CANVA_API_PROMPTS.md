### **Revised AI Implementation Prompts for CLCA Courier Canva Integration**

**Phase 1: Foundational Corrections & Type-Safe Environment** ✅ **COMPLETE**

**Prompt 1: Project-Aligned TypeScript Foundation** ✅ **COMPLETE**

**Phase 2: Firebase & Service Layer Extension** ✅ **COMPLETE**

**Prompt 2: Firestore Rules & Service Layer Extension** ✅ **COMPLETE**

**Phase 3: Canva API Service Implementation** ✅ **COMPLETE**

**Prompt 3: Project-Pattern Canva API Service** ✅ **COMPLETE**
✅ Created `/src/services/canva-api.service.ts` following strict project conventions
✅ Used centralized `logger` from `src/utils/logger.ts` (zero console statements)
✅ Implemented comprehensive Axios configuration with interceptors
✅ All core methods implemented with full type safety:
  - `createDesignFromTemplate()`, `exportDesign()`, `getDesign()`, `getConfig()`
✅ **100% test success rate (10/10 tests)** using proven CLCA Courier methodology
✅ Environment variable validation and error handling

---

**Phase 4: OAuth Integration with Existing Auth System** 🎯 **NEXT**

**Prompt 4: OAuth Integration with Existing Auth System**
"Analyze the existing CLCA Courier codebase. First, locate the `ContentSubmissionData` interface in `src/types/core/content.types.ts`. Create a new file `/src/services/canva/types.ts` and define the following strictly typed interfaces and enums that will extend the existing structure:

1.  **`CanvaDesign` Interface:** Include `id: string`, `editUrl: string`, `exportUrl: string | null`, and a `status` field using the literal union type `'draft' | 'pending_export' | 'exported' | 'failed'`. Adopt the project's pattern for timestamps: `createdAt: Timestamp`, `updatedAt: Timestamp`.
2.  **`CanvaComment` Interface:** Define `id: string` (to be used with Firestore's `@documentId`), `authorId: string`, `authorDisplayName?: string` (for performance, denormalized from the `users` collection), `text: string`, and `createdAt: Timestamp`.
3.  **Extend the Core Interface:** Modify the existing `ContentSubmissionData` interface in `src/types/core/content.types.ts` to include an optional `canvaDesign?: CanvaDesign` field. Do not create a new 'Contribution' interface.
4.  **Environment Setup:** Add the required environment variables to the existing `.env.example` file: `VITE_CANVA_API_BASE_URL`, `VITE_CANVA_APP_ID`, `VITE_CANVA_API_REDIRECT_URI`.
5.  **Internationalization:** Add the necessary translation key constants to the existing `TRANSLATION_KEYS` object in `src/i18n/utils/translation-keys.ts` under a `CANVA` namespace, including keys for `DESIGN_CREATED`, `EXPORT_PENDING`, `EXPORT_COMPLETE`, `OPEN_DESIGN`, and `CREATE_DESIGN`.

Ensure zero TypeScript compilation errors after these changes."

**Prompt 2: Firestore Rules & Service Layer Extension**
"Extend the existing CLCA Courier Firebase architecture to support Canva features:

1.  **Firestore Rules:** Modify the existing `firestore.rules` file for the `content` collection. Add rules that allow authenticated users to update the `canvaDesign` field on their own submissions only when the status is `'pending'`. Ensure only users with an 'admin' or 'editor' role can update the `canvaDesign.status` to `'exported'`.
2.  **Service Extension:** Locate the existing `content-submission.service.ts` service file. Add a new method `attachCanvaDesign(contentId: string, canvaDesign: CanvaDesign): Promise<void>`. This method must:
    -   Perform a Firestore update on the specific `content` document.
    -   Use the project's centralized `logger.info('Canva design attached', { contentId })` instead of `console.log`.
    -   Follow the existing error handling patterns of the service.
3.  **Testing:** Write a Vitest suite for the new service method, using the established Firebase emulator patterns to verify the Firestore update works correctly and respects security rules."

**Phase 2: Canva API Service & Authentication Integration**

**Prompt 3: Project-Pattern Canva API Service**
"Create the Canva API service layer following strict CLCA Courier conventions.

1.  **File & Structure:** Create the service at `/src/services/canva-api.service.ts` (matching the project's naming convention). Export a class `CanvaApiService`.
2.  **Implementation:** The service must:
    -   Import and use the centralized `logger` from `@/utils/logger` for all information and errors. No `console` statements.
    -   Use the existing Axios instance configured in `boot/axios.ts`.
    -   Read environment variables via the project's established config pattern.
    -   Implement three core, type-safe methods:
        ```typescript
        async createDesignFromTemplate(templateId: string): Promise<CanvaDesign>
        async exportDesign(designId: string): Promise<{ exportUrl: string }>
        async getDesign(designId: string): Promise<CanvaDesign>
        ```
    -   Include comprehensive error handling that follows project standards.
3.  **Testing:** Write Vitest unit tests for this service, mocking the Axios client and the logger to verify correct API calls and logging."

**Prompt 4: OAuth Integration with Existing Auth System**
"Implement the Canva OAuth flow by extending the existing authentication system.

1.  **Composable:** Create `src/composables/useCanvaAuth.ts`.
2.  **Integration:** The composable must:
    -   Import and use the existing `useFirebase()` composable and the Pinia auth store to check for a valid user session.
    -   Use the `useI18n()` composable for all user-facing messages, leveraging the `TRANSLATION_KEYS.CANVA` constants you defined earlier.
    -   Implement functions `initiateOAuth()` and `handleOAuthRedirect()`.
    -   Store the received OAuth tokens securely, following the project's existing patterns for secure storage.
3.  **UI Feedback:** All user notifications (success, errors, loading states) must use Quasar's `$q.notify()` and follow the established UI patterns of the application."

**Phase 3: UI Integration into Existing Pages & Workflows**

**Prompt 5: Integrate into SubmitContentPage.vue**
"Modify the existing `SubmitContentPage.vue` to offer Canva design creation as an option.

1.  **Button Addition:** Add a 'Create with Canva' button to the existing submission form UI. Use an icon from the established `UI_ICONS` constants.
2.  **Functionality:** The button should call the `useCanvaAuth` composable to ensure authentication, then use the `CanvaApiService` to create a design from a predefined template ID.
3.  **State Management:** Upon successful creation, call the `attachCanvaDesign` service method to link the new `CanvaDesign` object to the current `ContentSubmissionData` object in Firestore.
4.  **User Guidance:** Provide a clear success notification (translated) and a link to `openDesign(editUrl)` in a new tab. Ensure the UI reflects that a design has been attached."

**Prompt 6: Enhance ContentManagementPage.vue for Admins**
"Extend the existing admin review interface (`ContentManagementPage.vue`) to handle Canva exports.

1.  **Conditional UI:** For content items that have a `canvaDesign` field, add an 'Export for Print' button visible only to users with 'admin' or 'editor' roles.
2.  **Export Workflow:** The button click handler should:
    -   Call the `CanvaApiService.exportDesign()` method with the relevant `designId`.
    -   Immediately update the local Firestore document to set `canvaDesign.status` to `'pending_export'`.
    -   Use the existing real-time subscription pattern to listen for the update and poll the Canva API until the status can be set to `'exported'` and the `exportUrl` is populated.
3.  **Status Feedback:** The UI must show a loading state (using existing patterns) while exporting and a download link when complete. All messages must be translated."

**Phase 4: Advanced Features & Polish**

**Prompt 7: Comment System Integration**
"Integrate the option to attach Google Drive files via comments using the existing comment system.

1.  **Component:** Locate the existing comment components in `components/content-management/`. Add a 'Attach from Google Drive' button to the comment UI.
2.  **Google Picker:** Implement the Google Picker API within this component. On file selection, the component should automatically create a new comment with the text: `"Attached file from Google Drive: [file name] - [link to file]"`.
3.  **Performance:** Ensure this follows the project's existing patterns for avatar caching and real-time subscriptions to prevent performance regressions."

**Prompt 8: Comprehensive User Guidance & Error Handling**
"Conduct a final review and polish pass focused on user experience and robustness.

1.  **Onboarding:** Create a simple `GuideModal.vue` component (reusable) that can be triggered from a help icon. It should display a translated, step-by-step guide on using the Canva integration.
2.  **Error Handling:** Ensure every possible error path in the new Canva workflow is caught and handled gracefully. Errors must be logged with the central `logger` and users must be informed with translated, friendly messages via `$q.notify()`.
3.  **Code Review:** Perform a full review to ensure there are no violations of the project's TypeScript strict rules, all naming conventions are followed, and no unused code or `any` types are present. All new functionality must be covered by tests following the existing Vitest patterns."

This revised plan ensures a seamless, maintainable, and robust integration that feels native to the existing CLCA Courier application, respecting all its conventions and architectural decisions.