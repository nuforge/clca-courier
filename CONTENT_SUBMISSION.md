# Newsletter System: Page Architecture & Functional Specification

## Public-Facing Pages (Unauthenticated)

### 1. Homepage (/)

**Purpose**: Entry point showcasing published content and calls-to-action

**UI Elements**:

- Featured content carousel
- Latest articles grid
- Upcoming events list
- Submission call-to-action cards
- Newsletter archive link

**Programming Actions**:

- Fetch published content with `status=approved`
- Filter content by `publication.digital=true`
- Sort content by publication date (descending)

### 2. Content Listing Pages (/articles, /events, /classifieds)

**Purpose**: Category-specific content browsing

**UI Elements**:

- Filterable content grid
- Search bar
- Category/tag filters
- Pagination controls

**Programming Actions**:

- Query content by type and status
- Implement search across title/description/tags
- Handle filter and sort parameters

### 3. Single Content View (/content/{id})

**Purpose**: Individual content item display

**UI Elements**:

- Content title and metadata
- Author information
- Body content with formatted text
- Related content suggestions
- Social sharing buttons

**Programming Actions**:

- Fetch specific content by ID
- Verify `status=approved` and `publication.digital=true`
- Increment view counter

### 4. Submission Landing Page (/submit)

**Purpose**: Guide users to appropriate submission forms

**UI Elements**:

- Content type selection cards
- Submission guidelines
- Authentication prompt

**Programming Actions**:

- Redirect unauthenticated users to login
- Provide clear pathways to type-specific forms

## Authenticated User Pages

### 5. User Dashboard (/dashboard)

**Purpose**: Central hub for user content management

**UI Elements**:

- Personal stats widget
- Drafts in progress list
- Submission history table
- Quick action buttons

**Programming Actions**:

- Fetch user's content with various statuses
- Calculate submission metrics
- Provide quick access to common actions

### 6. Content Submission Forms (/submit/{type})

**Purpose**: Type-specific content creation interfaces

**UI Elements**:

- Dynamic form fields based on content type
- WYSIWYG editor for articles
- Date/time pickers for events
- Image upload widget with preview
- Validation error display
- Save draft/preview/submit buttons

**Programming Actions**:

- Handle form validation
- Manage draft autosave
- Process image uploads
- Submit content to review queue

### 7. Content Editor (/content/{id}/edit)

**Purpose**: Modify existing submissions

**UI Elements**:

- Pre-filled form fields
- Status indicator
- Revision history
- Delete/cancel/save buttons

**Programming Actions**:

- Verify user ownership or admin rights
- Handle content updates
- Maintain version history

## Moderation & Administration Pages

### 8. Moderation Queue (/moderate)

**Purpose**: Centralized content review interface

**UI Elements**:

- Filterable queue of submissions
- Content preview panels
- Quick action buttons (approve/reject)
- Bulk selection tools
- Statistics dashboard

**Programming Actions**:

- Fetch content with `status=submitted`
- Handle batch operations
- Track moderator activity
- Send status notifications

### 9. Content Detail Moderation (/moderate/{id})

**Purpose**: Detailed review of individual submissions

**UI Elements**:

- Full content display
- Moderation action buttons
- Comment thread for feedback
- Side-by-side comparison with guidelines
- User history panel

**Programming Actions**:

- Lock content during review
- Record moderation decisions
- Notify author of changes
- Escalate to senior moderators

### 10. Content Management (/admin/content)

**Purpose**: Comprehensive content administration

**UI Elements**:

- Advanced search and filters
- Bulk editing tools
- Status modification controls
- Export functionality
- Audit log

**Programming Actions**:

- Query across all content regardless of status
- Handle mass status changes
- Generate reports
- Manage featured content

## Key UI Components (Reusable)

### Content Card Component

**Purpose**: Consistent content preview across pages

**Properties**:

- contentData (object)
- showStatus (boolean)
- showActions (boolean)
- size (enum: small, medium, large)

### Submission Form Component

**Purpose**: Base for all content type forms

**Properties**:

- contentData (object for editing)
- contentType (enum)
- onSubmit (function)
- onSaveDraft (function)

### Moderation Action Bar

**Purpose**: Consistent moderation controls

**Properties**:

- contentId (string)
- currentStatus (enum)
- onApprove (function)
- onReject (function)
- onRequestChanges (function)

## Functional Flow & Data Handling

### Submission Workflow

1. User selects content type → Loads appropriate form component
2. User fills form → Validates and auto-saves draft to Firestore
3. User submits → Creates content document with `status=submitted`
4. System triggers → Creates review queue entry
5. Email notification → Sent to moderators

### Moderation Workflow

1. Moderator loads queue → Filters by priority/type
2. Selects item → Locks content for review
3. Reviews content → Checks against guidelines
4. Makes decision → Updates status and notifies user
5. If approved → Content becomes publicly visible

### Publication Flow

1. Approved content → Automatically appears on relevant pages
2. Digital publication → Set `publication.digital=true`
3. Homepage updates → Query reflects new content
4. RSS/feeds → Regenerate with new content

## Required State Management

### Global State Objects

- `authState` (current user, roles, permissions)
- `contentFilters` (current browse/search parameters)
- `moderationQueue` (filtered subset of submissions)
- `uiState` (loading states, notifications, modal controls)

### Local State Needs

- Form data and validation states
- Pagination and filter states
- Content selection state (for bulk operations)
- Image upload progress states

This page architecture supports the complete content lifecycle from submission through publication while maintaining clear separation of concerns between public, authenticated, and administrative functionalities.
