# Enhanced UserProfile with Tag-Based System

Based on your request, I've revised the UserProfile to align with the ContentDoc model by using a flexible tag system instead of a fixed "skills" array. This allows for namespaced tags like `[skill:computers]` or `[language:german]`, enabling better integration between user profiles and content through shared tagging.

## Revised UserProfile Interface

```typescript
// user.types.ts
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: 'contributor' | 'editor' | 'publisher' | 'admin';
  tags: string[]; // Namespaced tags e.g., ['skill:writing', 'language:german', 'interest:technology']
  availability: 'regular' | 'occasional' | 'on-call';
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    taskAssignments: boolean;
  };
  joinedAt: Timestamp;
  lastActive?: Timestamp;
}

// Utility functions for working with UserProfile tags
export const userUtils = {
  /**
   * Get all tags with a specific namespace from a user's profile.
   * @param user - The user profile to analyze
   * @param namespace - The namespace to filter by (e.g., 'skill', 'language')
   * @returns Array of tag values for the specified namespace
   */
  getTagsByNamespace: (user: UserProfile, namespace: string): string[] => {
    const prefix = `${namespace}:`;
    return user.tags
      .filter(tag => tag.startsWith(prefix))
      .map(tag => tag.substring(prefix.length));
  },

  /**
   * Check if a user has a specific tag.
   * @param user - The user profile to check
   * @param tag - The tag to look for (full format or value-only)
   * @returns Boolean indicating if the tag exists
   */
  hasTag: (user: UserProfile, tag: string): boolean => {
    // Handle both full format (namespace:value) and value-only checking
    if (tag.includes(':')) {
      return user.tags.includes(tag);
    }
    // Check if any tag ends with :value for value-only matching
    return user.tags.some(t => t.endsWith(`:${tag}`));
  },

  /**
   * Add a tag to a user's profile if it doesn't already exist.
   * @param user - The user profile to update
   * @param tag - The tag to add (in namespace:value format)
   * @returns Updated tags array
   */
  addTag: (user: UserProfile, tag: string): string[] => {
    if (!user.tags.includes(tag)) {
      return [...user.tags, tag];
    }
    return user.tags;
  },

  /**
   * Remove a tag from a user's profile.
   * @param user - The user profile to update
   * @param tag - The tag to remove
   * @returns Updated tags array
   */
  removeTag: (user: UserProfile, tag: string): string[] => {
    return user.tags.filter(t => t !== tag);
  }
};
```

## Firebase Security Rules Update

Update your Firestore rules to handle the new tags field:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can update their own tags
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Admins can update any user
      allow write: if hasRole(request.auth.uid, 'admin');
    }
    
    // Helper function to check roles
    function hasRole(uid, role) {
      return get(/databases/$(database)/documents/users/$(uid)).data.role == role;
    }
  }
}
```

## Cloud Functions for User Management

Update the onboarding function to use tags:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  // Create user profile with tags
  const userProfile: UserProfile = {
    id: user.uid,
    displayName: user.displayName || '',
    email: user.email || '',
    role: 'contributor',
    tags: [], // Start with empty tags
    availability: 'occasional',
    notificationPreferences: {
      email: true,
      inApp: true,
      taskAssignments: true
    },
    joinedAt: admin.firestore.Timestamp.now()
  };

  await db.collection('users').doc(user.uid).set(userProfile);
  
  // Send welcome email
  await sendWelcomeEmail(user.email);
  
  // Assign first tasks based on default availability
  await assignFirstTasks(user.uid);
});

// Function to find users by tag
export async function findUsersByTag(tag: string): Promise<UserProfile[]> {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('tags', 'array-contains', tag).get();
  return snapshot.docs.map(doc => doc.data() as UserProfile);
}

// Function to find users by namespace and value
export async function findUsersByNamespace(namespace: string, value: string): Promise<UserProfile[]> {
  const tag = `${namespace}:${value}`;
  return findUsersByTag(tag);
}
```

## Task Assignment Based on Tags

Enhance task assignment to use user tags for matching skills:

```typescript
// functions/src/task-assignment.ts
import { findUsersByTag } from './index';

exports.assignTaskToQualifiedUser = functions.firestore
  .document('content/{contentId}')
  .onCreate(async (snap, context) => {
    const content = snap.data();
    
    // Extract required skills from content tags
    const requiredSkills = content.tags
      .filter(tag => tag.startsWith('skill:'))
      .map(tag => tag.replace('skill:', ''));
    
    // Find users with matching skills
    const potentialAssignees: UserProfile[] = [];
    for (const skill of requiredSkills) {
      const users = await findUsersByTag(`skill:${skill}`);
      potentialAssignees.push(...users);
    }
    
    // Filter by availability and assign task
    const availableUsers = potentialAssignees.filter(user => 
      user.availability !== 'on-call' || isUserAvailable(user.id)
    );
    
    if (availableUsers.length > 0) {
      // Assign to first available user (or use more sophisticated logic)
      const assignee = availableUsers[0];
      await snap.ref.update({
        'features.feat:task.assignedTo': assignee.id,
        'features.feat:task.status': 'claimed'
      });
      
      // Notify the user
      await sendNotification(assignee.id, 'task_assigned', {
        contentId: context.params.contentId,
        title: content.title
      });
    }
  });
```

## Volunteer Dashboard Integration

Update the dashboard to show tags and allow filtering:

```vue
<!-- UserProfileEditor.vue -->
<template>
  <q-card>
    <q-card-section>
      <h5>Your Profile</h5>
      <q-input v-model="user.displayName" label="Display Name" />
      
      <h6>Your Tags</h6>
      <tag-input v-model="user.tags" :suggestions="tagSuggestions" />
      
      <q-select v-model="user.availability" :options="availabilityOptions" label="Availability" />
    </q-card-section>
  </q-card>
</template>

<script>
import { userUtils } from '../types/user.types';

export default {
  data() {
    return {
      user: {},
      availabilityOptions: ['regular', 'occasional', 'on-call'],
      tagSuggestions: [
        'skill:writing', 'skill:editing', 'skill:design', 'skill:translation',
        'language:english', 'language:german', 'language:spanish',
        'interest:technology', 'interest:arts', 'interest:sports'
      ]
    };
  },
  methods: {
    addTag(tag) {
      this.user.tags = userUtils.addTag(this.user, tag);
    },
    removeTag(tag) {
      this.user.tags = userUtils.removeTag(this.user, tag);
    }
  }
};
</script>
```

## Benefits of This Approach

1. **Consistency**: User profiles and content use the same tagging system, enabling seamless integration.
2. **Flexibility**: Easily add new skill categories without changing the database schema.
3. **Query Efficiency**: Find users with specific skills using Firestore's `array-contains` queries.
4. **Interoperability**: Content can be matched to users based on shared tags (e.g., assign German content to German-speaking users).
5. **Extensibility**: Add new namespaces like `[language:]`, `[interest:]`, or `[tool:]` without code changes.

## Example Usage Scenarios

1. **Finding Volunteers for a Task**:
   ```typescript
   // Find all users with graphic design skills
   const designers = await findUsersByTag('skill:design');
   
   // Find all German speakers
   const germanSpeakers = await findUsersByNamespace('language', 'german');
   ```

2. **Content-User Matching**:
   ```typescript
   // For content tagged [language:german], find matching users
   const germanContent = await getContentByTag('language:german');
   const germanReviewers = await findUsersByNamespace('language', 'german');
   ```

3. **Personalized Dashboard**:
   ```vue
   <!-- Show tasks matching user's skills -->
   <task-list :tasks="tasks.filter(task => taskMatchesUserSkills(task, user))" />
   ```

This tag-based system enhances the volunteer workflow by making it easy to match content needs with volunteer capabilities, all within your existing ContentDoc architecture.