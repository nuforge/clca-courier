# IMMEDIATE FIX: Assign Contributor Role

## The Problem
Your user `clcacourier@gmail.com` has a `reader` role but the Content Management page requires `contributor` role.

## Quick Fix (Do this in Firebase Console)

1. **Go to Firebase Console**: https://console.firebase.google.com/project/clca-courier-27aed/firestore

2. **Navigate to Firestore Database**

3. **Find the userProfiles collection**

4. **Look for document with ID**: `FOPs6aUNr0MB4iAuvk7x3mbUeRN2`

5. **If the document exists, edit it and change**:
   ```json
   {
     "role": "contributor",
     "permissions": ["content:read", "content:create", "content:update", "newsletter:read", "design:create", "theme:read", "theme:update"],
     "isApproved": true,
     "approvedBy": "admin",
     "approvalDate": "2025-09-26T07:25:00.000Z"
   }
   ```

6. **If the document doesn't exist, create it**:
   ```json
   {
     "uid": "FOPs6aUNr0MB4iAuvk7x3mbUeRN2",
     "email": "clcacourier@gmail.com",
     "displayName": "CLCA Courier Admin",
     "role": "contributor",
     "permissions": ["content:read", "content:create", "content:update", "newsletter:read", "design:create", "theme:read", "theme:update"],
     "isApproved": true,
     "approvedBy": "admin",
     "approvalDate": "2025-09-26T07:25:00.000Z",
     "createdAt": "2025-09-26T07:25:00.000Z",
     "lastLoginAt": "2025-09-26T07:25:00.000Z",
     "tags": [],
     "availability": "regular",
     "preferences": {
       "emailNotifications": true,
       "pushNotifications": true,
       "preferredCategories": [],
       "taskAssignments": true
     }
   }
   ```

## Alternative: Use the Temporary Fix
The ContentManagementPage has been temporarily modified to allow `reader` role access. You should be able to access the page now, but with limited functionality.

## After the Fix
Once you've updated the user role in Firebase Console:
1. Refresh the page
2. You should see full contributor access
3. The page will show appropriate content based on your role

## Revert Temporary Changes
After fixing the user role, you can revert the temporary changes by changing the authorization back to `requireContributor()`.
