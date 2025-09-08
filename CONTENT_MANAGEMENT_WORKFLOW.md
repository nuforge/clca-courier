# Content Management Workflow - Current Implementation

## Overview

This document describes the **actual implemented workflow** for content submission, review, and publication in the CLCA Courier application as of September 8, 2025.

## User Roles & Permissions (As Implemented)

### 1. **Public Users (Unauthenticated)**

- ✅ **Can view**: Published content on the news page (`/news`)
- ❌ **Cannot**: Submit content, access admin areas, or view unpublished content

### 2. **Authenticated Users (Any logged-in user)**

- ✅ **Can view**: ALL content (pending, approved, rejected, published) via admin interface
- ✅ **Can submit**: Content through submission form (`/contribute/submit`)
- ✅ **Can manage**: Newsletter administration (`/admin`)
- ✅ **Can access**: Content management interface (`/admin/content`)
- ✅ **Can perform**: All content approval/rejection/publishing actions

**Note**: The current implementation treats ALL authenticated users as administrators. There is no role-based access control enforced in the UI or Firestore rules.

## Content Submission Workflow

### Step 1: Content Submission (`/contribute/submit`)

1. **User Access**: Any authenticated user can submit content
2. **Content Types Supported**:
   - Articles
   - Announcements
   - Events
   - Classifieds
   - Photos
3. **Submission Process**:
   - User fills out form with title, content, category, etc.
   - Content is saved to Firestore `userContent` collection
   - Initial status: `'pending'`
   - Metadata includes: submission date, author info, user agent, etc.

### Step 2: Content Review (`/admin/content`)

1. **Access**: Any authenticated user can access the content management page
2. **Review Interface**:
   - Tabbed view showing: Pending, Approved, Published, Rejected content
   - Statistics dashboard showing content counts
   - Bulk operations available
3. **Available Actions**:
   - **Approve**: Changes status from `'pending'` to `'approved'`
   - **Reject**: Changes status to `'rejected'` (with optional reason)
   - **Publish**: Changes status from `'approved'` to `'published'`
   - **Unpublish**: Changes status from `'published'` to `'approved'`
   - **Reset**: Changes status back to `'pending'`

### Step 3: Content Publication

1. **Manual Publishing**: Reviewers manually change status to `'published'`
2. **Public Visibility**: Only `'published'` content appears on public news page
3. **Real-time Updates**: Published content appears immediately via Firebase subscriptions

## Data Flow Architecture

### Firestore Collections

- **`userContent`**: Stores all submitted content with workflow status
- **`userProfiles`**: User profile information (currently minimal)

### Security Rules (Current Implementation)

```firestore
// User-generated content collection
match /userContent/{contentId} {
  // Allow anyone to read published content (for news page)
  allow read: if resource.data.status == 'published';

  // Allow authenticated users to read ALL content (for admin interface)
  allow read: if isAuthenticated();

  // Allow authenticated users to create content (they must be the author)
  allow create: if isAuthenticated() && request.auth.uid == request.resource.data.authorId;

  // Allow authors to update their own content, or authenticated users to update status
  allow update: if isAuthenticated() &&
    (request.auth.uid == resource.data.authorId ||
     request.auth.uid == request.resource.data.reviewedBy);

  // Allow authenticated users to delete content
  allow delete: if isAuthenticated();
}
```

## Content Status States

1. **`'pending'`**: Newly submitted content awaiting review
2. **`'approved'`**: Content approved by reviewer but not yet published
3. **`'published'`**: Content visible to public on news page
4. **`'rejected'`**: Content rejected by reviewer (with optional reason)

## User Interface Components

### Public Interface

- **`/news`** (NewsUpdatesPage): Shows only published content to all users
- **`/contribute/submit`** (SubmitContentPage): Content submission form

### Admin Interface (Authenticated Users Only)

- **`/admin/content`** (ContentManagementPage): Complete content management
- **`/admin`** (NewsletterManagementPage): Newsletter administration

## Technical Implementation Details

### Services

- **`firebase-firestore.service.ts`**: Core CRUD operations for content
- **`content-submission.service.ts`**: Content submission workflow
- **`site-store-simple.ts`**: State management for news display

### Key Methods

- `getPublishedContent()`: Fetches only published content (public access)
- `getApprovedContent()`: Fetches approved + published content (admin access)
- `updateContentStatus()`: Changes content workflow status
- `subscribeToPublishedContent()`: Real-time updates for public news page

### Authentication Check Pattern

```typescript
const isAdmin = computed(() => {
  return (
    auth.currentUser.value?.email === 'admin@example.com' || // Replace with actual admin check
    auth.isAuthenticated.value
  ); // For now, any authenticated user can access
});
```

## Current Limitations & Design Notes

1. **No Role-Based Access Control**: All authenticated users have full admin access
2. **Simple Status Workflow**: Linear progression through states
3. **Manual Publishing**: No scheduled or automatic publication
4. **No Content Versioning**: Content updates overwrite previous versions
5. **Basic Approval Process**: No multi-level approval or delegation

## Security Considerations

- **Public Content Access**: Only published content visible without authentication
- **Admin Functions**: All admin functions require authentication
- **Author Restrictions**: Authors can only edit their own content
- **Reviewer Tracking**: All status changes track who made the change and when

## Future Enhancement Opportunities

1. Implement proper role-based access control
2. Add scheduled publishing capabilities
3. Create content versioning system
4. Add multi-level approval workflows
5. Implement content categories and advanced filtering
6. Add email notifications for workflow events
