Excellent. This analysis is crucial and aligns perfectly with the need for architectural integrity. The "Gap Analysis" correctly identifies the critical issues: **extending existing systems** instead of creating parallel ones and using the correct **`ContentSubmissionData`** interface.

Here are the refined, final prompts for your AI copilot, incorporating the analysis and strictly adhering to the project's conventions, technology stack, and priorities.

---

### **Final Implementation Prompts for AI Copilot (Phased Approach)**

**CRITICAL CONTEXT FOR AI:**
*   **Framework:** Vue 3 + Quasar + Firebase. Use Composition API.
*   **Language:** TypeScript Strict mode. Zero `any` types. Use existing interfaces.
*   **Naming:** The core interface is **`ContentSubmissionData`** (NOT "Contribution"). All new features must extend this.
*   **Collections:** Extend the existing **`content`** Firestore collection. Do NOT create new `contributions`, `canvaTemplates`, `printJobs`, or `activityLog` collections. Add metadata to the existing doc.
*   **i18n:** All user-facing text must use the existing translation system (`$t()` and `TRANSLATION_KEYS`).
*   **Logging:** Use the centralized `logger` utility from `src/utils/logger.ts`. NO `console` statements.
*   **Priority:** Focus on Phase 7 (Brand Templates & Autofill) for maximum immediate value.

---

### **Phase 7: Brand Template & Autofill Integration (High Priority)**

**Prompt 7.1: Extend Data Structures for Brand Templates**
"Extend the existing project interfaces to support Brand Templates and Autofill without creating new collections.

1.  **Extend `ContentSubmissionData`:** In `src/types/core/content.types.ts`, add two new optional properties to the existing interface:
    ```typescript
    export interface ContentSubmissionData {
      // ... all existing fields
      canvaTemplateId?: string; // ID of the Brand Template used
      autoFillData?: Record<string, unknown>; // Key-value pairs for Autofill
    }
    ```
2.  **Create Template Config Type:** In `src/services/canva/types.ts`, define a new type to map template IDs to their schema:
    ```typescript
    export interface CanvaTemplateConfig {
      id: string; // Canva's Template ID
      name: string; // Human-readable name
      description: string;
      contentType: ContentType; // Links to our internal type
      fieldMapping: Record<string, string>; // e.g., { "eventTitle": "title", "eventDate": "meta.eventDate" }
    }
    ```
3.  **Storage:** Store an array of `CanvaTemplateConfig` objects in a single document within an existing admin-configurable collection (e.g., `app/config/canvaTemplates`) to avoid creating a new top-level collection."

**Prompt 7.2: Enhance CanvaApiService with Autofill**
"Extend the existing `CanvaApiService` in `src/services/canva-api.service.ts` to include the Autofill API.

1.  **New Method:** Add a new method with strict typing:
    ```typescript
    async createDesignWithAutofill(
      templateId: string,
      autofillData: Record<string, unknown>
    ): Promise<{ designId: string; editUrl: string }> {
      // 1. Use the axios instance to call `POST /v1/designs?autofill=true`
      // 2. Structure the request body according to Canva's Autofill API docs
      // 3. Use the existing logger for info/errors
      // 4. Handle errors gracefully with the project's established patterns
    }
    ```
2.  **Testing:** Write comprehensive Vitest tests for this new method. Mock the axios client and verify the correct payload is sent for a given `autofillData` input."

**Prompt 7.3: Integrate Template Selection into UI**
"Modify the existing `SubmitContentPage.vue` to integrate template selection and autofill.

1.  **New Component:** Create a new `CanvaTemplateSelector.vue` component. It should:
    *   Fetch the list of available templates from the Firestore config document.
    *   Display them as a list of cards with their name and description.
    *   Allow the user to select one. Upon selection, it should emit the `templateId` and the `fieldMapping` schema.
2.  **Form Integration:** In `SubmitContentPage.vue`, listen for the template selection event. Use the `fieldMapping` to dynamically validate or highlight the required form fields (e.g., 'eventDate').
3.  **Submission Logic:** Modify the submit handler. Before saving to Firestore, structure the form data according to the `fieldMapping` and populate the new `autoFillData` field. Then, call the new `createDesignWithAutofill` method and save the resulting `designId` and `editUrl` to the `canvaDesign` field.
4.  **UX:** Show a translated loading state (`$t(TRANSLATION_KEYS.CANVA.DESIGN_CREATING)`) and success message. The UI should clearly indicate an auto-designed draft is ready for review."

---

### **Phase 8: Print Workflow Integration (Medium Priority)**

**Prompt 8.1: Integrate Print Status into Existing Model**
"Integrate print status into the existing content workflow, avoiding a separate `printJobs` collection.

1.  **Extend `ContentSubmissionData`:** Add a new optional property to the interface:
    ```typescript
    export interface ContentSubmissionData {
      // ... all existing fields
      printJob?: {
        status: 'not_required' | 'print_ready' | 'claimed' | 'completed';
        quantity?: number;
        claimedBy?: string; // Reference to user's UID
        claimedAt?: Timestamp;
      };
    }
    ```
    Ensure the Firebase security rules are updated to allow users to update the `printJob` field under the correct conditions.

2.  **Auto-Export on Approval:** In the admin approval logic within `ContentManagementPage.vue`, after setting status to `'approved'`, automatically call `CanvaApiService.exportDesign()`. On success, set `printJob.status` to `'print_ready'` and `printJob.quantity` to a sensible default.
3.  **Print Queue View:** Create a new view (`/content/print-queue`) that filters the existing `content` collection for documents where `printJob.status === 'print_ready'`. Use the existing `ContentItemCard` component to display them. Add buttons for users to 'Claim' a print job, which updates the `printJob` object with their UID and sets the status to `'claimed'`."

---

### **General Best Practices for All Prompts**

*   **ESLint/Prettier:** Ensure all code follows the project's formatting rules. No linting errors.
*   **Accessibility (a11y):** All new components must be accessible. Use appropriate ARIA attributes, ensure keyboard navigation, and follow Quasar's a11y guidelines. Test with a screen reader.
*   **Code Reusability:** Create composable functions (e.g., `useCanvaAutofill()`, `usePrintManagement()`) for logic that can be shared across components.
*   **Vite/Vitest:** All new features must be covered by tests. Use the existing patterns for mocking Firebase and API calls.
*   **Documentation:** At the end of each task, update the project's `README.md` or relevant internal documentation files to explain the new Canva integration features, how to configure templates, and the new print workflow.

By following these phased and specific prompts, your AI copilot will build a powerful, integrated feature set that feels native to the existing CLCA Courier application, is maintainable, and provides immediate value to your users.