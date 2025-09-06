# Design Document: Versioning and Collaboration System

## 1. Overview
**System Purpose**: Implement a robust version control system for content management that supports collaborative editing, maintains complete history, and provides intuitive conflict resolution for non-technical users.

**Current Tech Stack**: Quasar/Vue3 frontend, Firebase (Firestore + Storage), with existing basic document management.

## 2. Core Principles
- **Separation of Concerns**: Current content state is separate from edit history
- **User Experience First**: Complex versioning concepts hidden behind intuitive UI
- **Progressive Enhancement**: Implement in phases, with each phase delivering value
- **Offline Capability**: Support offline editing with sync resolution

## 3. Data Model Implementation

### 3.1 Content Record (Firestore)
```javascript
// Path: /content/{contentId}
{
  id: string,                      // Unique content identifier
  type: string,                    // 'article', 'event', 'asset'
  title: string,                   // Content title
  content: string | object,        // Structured content or HTML
  status: string,                  // 'draft', 'review', 'approved', 'published'
  metadata: {
    author: string,                // User ID of creator
    category: string,
    tags: string[],
    featuredImage: string,         // Reference to asset
    relatedContent: string[],      // References to other content
    seo: {
      title: string,
      description: string,
      keywords: string
    }
  },
  settings: {
    template: string,
    visibility: string,
    publishDate: Timestamp
  },
  system: {
    version: number,               // Current version number
    createdAt: Timestamp,
    updatedAt: Timestamp,
    updatedBy: string,             // User ID of last editor
    currentHash: string,           // Hash of content + metadata
    parentVersion: number          // For branch tracking
  }
}
```

### 3.2 Edit History (Firestore)
```javascript
// Path: /history/{contentId}_{version}
{
  id: string,                      // Composite ID: contentId_version
  recordId: string,                // Reference to content
  version: number,                 // Sequential version number
  type: string,                    // 'create', 'update', 'status_change'
  timestamp: Timestamp,
  userId: string,                  // User who made changes
  changes: {                       // Specific fields changed
    fieldName: [oldValue, newValue],
    // Example:
    // title: ["Old Title", "New Title"],
    // content: ["<p>old</p>", "<p>new</p>"]
  },
  snapshot: Map,                   // Complete content state at this version
  hash: string,                    // Hash of this version's content
  comment: string,                 // User comment for this change
  branch: string                   // 'main' or user-specific branch
}
```

## 4. System Architecture

### 4.1 Version Control Service
```javascript
class ContentVersionService {
  constructor(firestore) {
    this.db = firestore;
    this.queuedOperations = [];
  }
  
  async createContent(data, userId) {
    // Implementation logic with initial versioning
  }
  
  async updateContent(contentId, changes, userId, comment = "") {
    // 1. Get current version
    // 2. Validate permissions
    // 3. Create history entry
    // 4. Update content record
    // 5. Handle offline scenario
  }
  
  async getContentHistory(contentId, limit = 50) {
    // Retrieve and format history
  }
  
  async restoreVersion(contentId, version) {
    // Restore to specific version
  }
  
  async resolveConflict(contentId, resolutionStrategy, userSelection) {
    // Handle conflict resolution
  }
}
```

### 4.2 Conflict Detection Algorithm
```javascript
// Pseudocode for conflict detection
function detectConflicts(localChange, remoteRecord) {
  const conflicts = [];
  
  // Check if remote has been updated since local change started
  if (localChange.baseVersion !== remoteRecord.system.version) {
    // Compare specific field changes
    for (const field in localChange.changes) {
      if (remoteRecord[field] !== localChange.originalValues[field]) {
        conflicts.push({
          field,
          localValue: localChange.newValues[field],
          remoteValue: remoteRecord[field]
        });
      }
    }
  }
  
  return conflicts;
}
```

## 5. Phased Implementation Plan

### Phase 1: Basic Versioning (Core Functionality)
**Objectives**: 
- Track all content changes in history collection
- Maintain version numbers
- Basic history viewing

**Components to Implement**:
1. Modified content service with version tracking
2. History collection structure
3. Basic history panel in UI
4. Automatic version incrementing on save

### Phase 2: Advanced Collaboration Features
**Objectives**:
- Conflict detection and resolution
- User roles and permissions
- Branching for drafts

**Components to Implement**:
1. Conflict detection system
2. Role-based access control
3. Draft branching system
4. Enhanced history comparison UI

### Phase 3: Advanced Features
**Objectives**:
- Content relationships
- Validation rules
- Advanced history visualization

**Components to Implement**:
1. Relationship tracking in history
2. Content validation framework
3. Visual timeline interface
4. Advanced diff tools

## 6. UI/UX Components

### 6.1 Status Indicators
```vue
<template>
  <div class="status-indicator" :class="status">
    <q-icon :name="statusIcon" />
    <span>{{ statusText }}</span>
    <q-tooltip>{{ statusTooltip }}</q-tooltip>
  </div>
</template>
```

### 6.2 History Timeline Component
```vue
<template>
  <div class="history-timeline">
    <div v-for="version in history" :key="version.id" 
         class="history-item" @click="viewVersion(version)">
      <div class="version-number">v{{ version.version }}</div>
      <div class="version-details">
        <div class="user">{{ getUserName(version.userId) }}</div>
        <div class="time">{{ formatTime(version.timestamp) }}</div>
        <div class="comment">{{ version.comment }}</div>
      </div>
    </div>
  </div>
</template>
```

### 6.3 Conflict Resolution Dialog
```vue
<template>
  <q-dialog :model-value="showConflictResolution">
    <q-card class="conflict-resolution">
      <q-card-section>
        <h3>Conflict Detected</h3>
        <p>The content has been modified by another user.</p>
        
        <div class="comparison">
          <div class="version local">
            <h4>Your Changes</h4>
            <!-- Display local changes -->
          </div>
          <div class="version remote">
            <h4>Server Version</h4>
            <!-- Display remote changes -->
          </div>
        </div>
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn label="Keep Theirs" @click="resolve('theirs')" />
        <q-btn label="Keep Yours" @click="resolve('mine')" />
        <q-btn label="Merge Manually" @click="resolve('merge')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
```

## 7. Important Considerations

### 7.1 Performance Optimizations
- **Lazy Loading**: Only load history when requested
- **Pagination**: Implement pagination for history records
- **Selective Sync**: Only sync necessary fields for current view
- **Caching**: Implement smart caching for frequently accessed content

### 7.2 Error Handling
```javascript
// Example error handling strategy
class VersioningError extends Error {
  constructor(message, code, recoverable = false) {
    super(message);
    this.code = code;
    this.recoverable = recoverable;
  }
}

// Common error codes
const ERROR_CODES = {
  CONFLICT: 'VERSION_CONFLICT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  OFFLINE: 'OFFLINE_OPERATION'
};
```

### 7.3 Security Rules
```javascript
// Example Firestore security rules
match /content/{contentId} {
  allow read: if resource.data.metadata.visibility == 'public' 
               || request.auth.uid in resource.data.collaborators;
  allow write: if request.auth.uid in resource.data.collaborators
               && request.resource.data.system.version == resource.data.system.version + 1;
}

match /history/{historyId} {
  allow read: if request.auth.uid in get(/databases/$(database)/documents/content/$(historyId.split('_')[0])).data.collaborators;
  allow write: if false; // History is append-only via functions
}
```

## 8. Integration Points with Existing System

### 8.1 Current Content Service Modifications
- Add version parameter to update operations
- Integrate history creation on content changes
- Add conflict detection to save operations

### 8.2 UI Integration Points
- Add history panel to content editor
- Add status indicators to content lists
- Add conflict resolution modal to editor
- Add version selection to editor toolbar

## 9. Testing Strategy

### 9.1 Test Cases
1. **Basic Versioning**: Edit content and verify history is created
2. **Conflict Detection**: Simulate concurrent edits
3. **Offline Operation**: Edit offline, then sync
4. **Permission Validation**: Test role-based access to history
5. **Performance**: Load testing with large history sets

### 9.2 Monitoring
- Track history collection size growth
- Monitor conflict resolution rates
- Measure sync operation performance
- Track user interactions with versioning features

## 10. Iterative Implementation Guidance

### 10.1 Phase 1 Focus
- Start with simple version tracking without conflict resolution
- Implement basic history viewing before advanced features
- Use simple linear versioning before introducing branching
- Add basic status indicators before full conflict UI

### 10.2 User Education
- Tooltips and guided tours for new features
- Progressive disclosure of advanced features
- Clear error messages with guidance
- Documentation integrated into UI

This design document provides a comprehensive roadmap for implementing a version control system that integrates with your existing architecture while providing clear guidance for iterative implementation. The system is designed to be robust yet accessible to non-technical users, with special attention to performance and scalability considerations.