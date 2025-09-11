### **Initiation Prompt: Setting the New Standard**

"Claude, we are performing a major refactor of our data architecture. We are wiping the existing `content` collection and moving to a composable, tag-driven model. Ignore all legacy data and interfaces. Our new principle is: **'A content object is a base entity that has features, not is a type.'**

**Our Tech Stack:** Vue 3, Quasar, TypeScript strict, Firebase Firestore.
**Our Rule:** No `any` types. Use existing logging (`src/utils/logger`), translation (`$t()`), and UI patterns.

**First Task: Define the Foundational Types and Utilities**
1.  Create the file `/src/types/core/content.types.ts`.
2.  Define the following **strict TypeScript interfaces**:
    ```typescript
    import { Timestamp, GeoPoint } from 'firebase/firestore';

    // The single, canonical interface for all content
    export interface ContentDoc {
      id: string;
      title: string;
      description: string;
      authorId: string;
      authorName: string;
      tags: string[]; // For filterable [namespace:value] pairs
      features: ContentFeatures; // For structured feature blocks
      status: 'draft' | 'published' | 'archived';
      timestamps: {
        created: Timestamp;
        updated: Timestamp;
        published?: Timestamp;
      };
    }

    // The heart of the system: a map of possible features
    export interface ContentFeatures {
      'feat:date'?: {
        start: Timestamp;
        end?: Timestamp;
        isAllDay: boolean;
      };
      'feat:task'?: {
        category: string;
        qty: number;
        unit: string;
        status: 'unclaimed' | 'claimed' | 'completed';
        claimedBy?: string; // UID of the user who claimed it
      };
      'feat:location'?: {
        name?: string;
        address: string;
        geo?: GeoPoint; // Firestore GeoPoint for map queries
      };
      'integ:canva'?: {
        designId: string;
        editUrl: string;
        exportUrl?: string;
      };
      // [Intentional space for future features]
    }
    ```
3.  In the same file, create a `contentUtils` object with these **mechanical utility functions**:
    ```typescript
    export const contentUtils = {
      // Type-safe feature checker
      hasFeature: <K extends keyof ContentFeatures>(
        doc: ContentDoc,
        feature: K
      ): doc is ContentDoc & { features: { [P in K]: NonNullable<ContentFeatures[P]> } } => {
        return doc.features[feature] !== undefined;
      },

      // Safe feature getter
      getFeature: <K extends keyof ContentFeatures>(doc: ContentDoc, feature: K) => {
        return doc.features[feature];
      },

      // Extract content type from tags
      getContentType: (doc: ContentDoc): string | undefined => {
        const typeTag = doc.tags.find(tag => tag.startsWith('content-type:'));
        return typeTag?.split(':')[1];
      }
    };
    ```
4.  **Acceptance Criteria:**
    *   File is created at the correct path.
    *   ZERO TypeScript compilation errors.
    *   No use of `any` type.
    *   JSDoc comments are added for all interfaces and functions.
    *   Write a basic Vitest suite for the `contentUtils` functions, mocking a `ContentDoc` object.

Please provide the complete code for this file when done. We will proceed with the service layer next."

---

### **Follow-up Prompt 1: The Service Layer**

"Excellent. Now, refactor our service layer to use the new model.

**Task: Overhaul the Content Submission Service**
1.  Locate and open our primary service file (e.g., `src/services/content-submission.service.ts`).
2.  **Delete all logic** related to the old content creation methods.
3.  Create a new, standalone method called `createContent`. It should:
    *   Accept parameters: `title`, `description`, `contentType` (string), optional `features` (Partial<ContentFeatures>), and optional `additionalTags` (string[]).
    *   Use our Firebase auth to get the current user's `uid` and `displayName`.
    *   Construct a new `ContentDoc` object (omit the `id`). Use `serverTimestamp()` for Firestore timestamps.
    *   The `tags` array must always start with `content-type:${contentType}`.
    *   Write this object directly to the **main `content` collection** in Firestore.
    *   Use our project's standard `logger` to log the event.
    *   Return the new document's ID.
4.  **Error Handling:** Ensure it includes our project's standard try/catch and error logging patterns.
5.  **Testing:** Update any existing tests for this service to use the new model.

Please show me the refactored service code. We will next destroy and rebuild the UI components."

---

### **Follow-up Prompt 2: The Nuclear UI Option**

"Perfect. The service layer is now modernized. Now, we refactor the UI to be purely mechanical.

**Task: Refactor the Primary Content Display Component**
1.  Identify our main content rendering component (e.g., `ContentCard.vue`).
2.  **Create a new version.** You may create a new component or refactor the existing one in place.
3.  Its script should:
    *   Use the new `ContentDoc` interface as its prop type.
    *   Import and use the `contentUtils` functions.
    *   Use `computed` properties to derive state (e.g., `const canClaimTask = computed(() => contentUtils.hasFeature(props.content, 'feat:task') && props.content.features['feat:task']?.status === 'unclaimed')`).
4.  Its template should be **mechanically driven** by the presence of features:
    *   Use `v-if="contentUtils.hasFeature(content, 'feat:date')"` to conditionally render a new ` <EventDateWidget>` component, passing it the feature data.
    *   Do the same for `feat:task`, `feat:location`, and `integ:canva`.
    *   Buttons like "Claim Task" should only appear if the corresponding feature exists *and* is in the correct state.
5.  **Accessibility:** Ensure all new interactive elements have proper ARIA labels and keyboard navigation, following Quasar's a11y standards.
6.  **DO NOT** write the specific widget components (e.g., `EventDateWidget`) yet. Just leave them as empty components for now. Our goal is to get the main card working.

Please provide the complete Vue `<template>` and `<script>` code for this refactored component."

---

### **Follow-up Prompt 3: Validation and Documentation**

"Great progress. We now have a working mechanical UI. Let's prove the system and document it.

**Task: Build a Test Page and Update Documentation**
1.  Create a new page component: `/src/pages/TestContentV2Page.vue`.
2.  This page should:
    *   Use the new `createContent` service method.
    *   Have buttons to create sample content objects:
        *   **'Create Event'**: Creates content with `feat:date` and `feat:location`.
        *   **'Create Task'**: Creates content with `feat:task` (category: `printing`, status: `unclaimed`).
        *   **'Create Hybrid'**: Creates an event that also has a `feat:task` for snacks.
    *   Display a list of all content in the database using the new mechanical `ContentCard` component.
3.  **Documentation:** Update the project's `README.md` or relevant internal docs. Add a section titled "Content Data Architecture" that explains:
    *   The philosophy of the composable `features` model.
    *   A list of currently defined features and their data structure.
    *   How to add a new feature (e.g., `'feat:rsvp'`).
    *   How to use the `contentUtils` functions.

This page will be our sandbox to validate the entire architecture. Please provide the code for the test page and the documentation updates."