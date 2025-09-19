# Volunteer Workflow Implementation Plan

## Overview
This document outlines the implementation plan for a tag-based volunteer workflow system that integrates with your existing ContentDoc architecture. The system will use TypeScript strict mode in a Vue3/Quasar application with reusable, accessible components following best practices.

## Implementation Queries

### 1. User Profile Enhancement
```typescript
// Extend UserProfile interface in user.types.ts
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'member' | 'contributor' | 'canva_contributor' | 'editor' | 'moderator' | 'administrator';
  permissions: string[];
  isApproved: boolean;
  tags: string[]; // Namespaced tags: ['skill:writing', 'language:german']
  availability: 'regular' | 'occasional' | 'on-call';
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    preferredCategories: string[];
    taskAssignments?: boolean;
  };
  createdAt: string;
  lastLoginAt: string;
}
```

### 2. Content Features Extension
```typescript
// Extend ContentFeatures in content.types.ts
export interface ContentFeatures {
  // ... existing features ...
  
  /**
   * Task feature for volunteer workflow.
   */
  'feat:task'?: {
    category: 'review' | 'layout' | 'fact-check' | 'approve' | 'print';
    estimatedTime: number; // minutes
    assignedTo?: string; // userId
    status: 'unclaimed' | 'claimed' | 'in-progress' | 'completed';
    instructions?: string;
    dueDate?: Timestamp;
    priority: 'low' | 'medium' | 'high';
  };
}
```

### 3. Utility Functions
```typescript
// Create userUtils.ts
export const userUtils = {
  getTagsByNamespace: (user: UserProfile, namespace: string): string[] => {
    const prefix = `${namespace}:`;
    return user.tags
      .filter(tag => tag.startsWith(prefix))
      .map(tag => tag.substring(prefix.length));
  },

  hasTag: (user: UserProfile, tag: string): boolean => {
    if (tag.includes(':')) {
      return user.tags.includes(tag);
    }
    return user.tags.some(t => t.endsWith(`:${tag}`));
  },

  addTag: (user: UserProfile, tag: string): string[] => {
    if (!user.tags.includes(tag)) {
      return [...user.tags, tag];
    }
    return user.tags;
  },

  removeTag: (user: UserProfile, tag: string): string[] => {
    return user.tags.filter(t => t !== tag);
  }
};
```

### 4. Firebase Security Rules Update
```javascript
// Update firestore.rules
match /userProfiles/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId
    && request.resource.data.keys().hasAll(['tags', 'availability'])
    && request.resource.data.size() == 2;
  allow write: if hasRole(request.auth.uid, 'administrator');
}
```

### 5. Cloud Function for Task Assignment
```typescript
// Create task-assignment.ts in functions/src
export const onContentCreated = onDocumentCreated('content/{contentId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  
  const content = snapshot.data();
  const contentId = event.params.contentId;
  const requiredSkills = content.tags.filter((tag: string) => tag.startsWith('skill:'));
  
  if (requiredSkills.length === 0) return;
  
  let assignedUserId: string | null = null;
  
  for (const skillTag of requiredSkills) {
    const usersSnapshot = await db.collection('userProfiles')
      .where('tags', 'array-contains', skillTag)
      .where('availability', 'in', ['regular', 'occasional'])
      .get();

    if (!usersSnapshot.empty) {
      const user = usersSnapshot.docs[0].data() as UserProfile;
      assignedUserId = user.uid;
      break;
    }
  }
  
  if (assignedUserId) {
    await snapshot.ref.update({
      'features.feat:task': {
        category: 'review',
        estimatedTime: 5,
        assignedTo: assignedUserId,
        status: 'claimed',
        priority: 'medium',
      }
    });
    
    // Send notification
    await sendNotification(assignedUserId, 'task_assigned', {
      contentId,
      title: content.title
    });
  }
});
```

### 6. Vue Components
```vue
<!-- UserProfileEditor.vue -->
<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">Edit Your Profile</div>
    </q-card-section>

    <q-card-section>
      <q-input
        v-model="user.displayName"
        label="Display Name"
        outlined
        :rules="[val => !!val || 'Display name is required']"
      />

      <q-select
        v-model="user.availability"
        :options="availabilityOptions"
        label="Availability"
        outlined
        class="q-mt-md"
      />

      <div class="q-mt-md">
        <div class="text-subtitle2">Your Tags</div>
        <q-input
          v-model="newTag"
          label="Add a tag (e.g., skill:writing)"
          outlined
          @keyup.enter="addTag"
        >
          <template v-slot:append>
            <q-btn icon="add" @click="addTag" flat />
          </template>
        </q-input>

        <q-chip
          v-for="tag in user.tags"
          :key="tag"
          removable
          @remove="removeTag(tag)"
        >
          {{ tag }}
        </q-chip>
      </div>
    </q-card-section>

    <q-card-actions>
      <q-btn label="Save" color="primary" @click="saveProfile" />
    </q-card-actions>
  </q-card>
</template>
```

### 7. Tests
```typescript
// userUtils.spec.ts
import { userUtils } from 'src/types/user';
import { UserProfile } from 'src/types/user';

describe('userUtils', () => {
  const mockUser: UserProfile = {
    uid: '123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'contributor',
    permissions: [],
    isApproved: true,
    tags: ['skill:writing', 'language:german', 'interest:technology'],
    availability: 'regular',
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      preferredCategories: [],
      taskAssignments: true,
    },
    createdAt: '',
    lastLoginAt: '',
  };

  it('gets tags by namespace', () => {
    const skills = userUtils.getTagsByNamespace(mockUser, 'skill');
    expect(skills).toEqual(['writing']);
  });

  it('checks if user has tag', () => {
    expect(userUtils.hasTag(mockUser, 'skill:writing')).toBe(true);
    expect(userUtils.hasTag(mockUser, 'writing')).toBe(true);
  });
});
```

## Implementation Goals and Progress

### Week 1: Core Integration
- [ ] Extend UserProfile interface with tags and availability fields
- [ ] Create userUtils functions
- [ ] Update Firestore rules for tag modifications
- [ ] Create UserProfileEditor component

### Week 2: Task System
- [ ] Add feat:task to ContentFeatures
- [ ] Extend ContentSubmissionService with task creation
- [ ] Create TaskCard and TaskList components
- [ ] Update AdminDashboard with volunteer task view

### Week 3: Automation
- [ ] Create Cloud Function for automatic task assignment
- [ ] Extend notification system
- [ ] Add task filtering to content queries

### Week 4: Testing and Polish
- [ ] Write comprehensive tests for all new utilities
- [ ] Perform accessibility audit
- [ ] Optimize performance
- [ ] Create user documentation

## Best Practices

1. **TypeScript Strict Mode**: All new code will follow strict TypeScript rules
2. **Component Design**: Reusable, accessible components using Quasar's built-in attributes
3. **Testing**: Comprehensive test coverage for utilities and components
4. **Error Handling**: Proper error handling in all asynchronous operations
5. **Performance**: Efficient Firestore queries with proper indexing
6. **Accessibility**: All components will follow WCAG guidelines

## Edge Cases to Test

1. User with no tags trying to claim tasks
2. Content with no required skills
3. Multiple users with the same skills
4. Network failures during task assignment
5. Concurrent modifications to user profiles
6. Invalid tag formats
7. User availability changes during task assignment

This implementation plan builds on your existing architecture while adding the volunteer workflow capabilities you need, using a tag-based system that integrates seamlessly with your ContentDoc model.