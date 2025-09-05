# 🚨 CRITICAL DEVELOPMENT RULES - CLCA Courier

## ⚠️ ABSOLUTE PROHIBITIONS (USER-ENFORCED)

### ❌ NEVER USE HASH MODE ROUTING

- **ALWAYS** use history mode (`/archive` not `/#/archive`)
- Configured in `quasar.config.ts` as `vueRouterMode: 'history'`
- Hash routing breaks Firebase authentication flows

### ❌ NO HARDCODED DATA LISTS

- **NO** static arrays, JSON files for content, or fake data
- Use dynamic discovery from Firebase or manifest system only
- Example violations: `const pdfs = ['2024.01.pdf', '2024.02.pdf']`

### ❌ NO PATH ASSUMPTIONS

- **ALWAYS** verify file/directory existence using tools like `list_dir`, `file_search`, `grep_search`
- Never reference paths without existence verification
- Use Firebase Storage or manifest system for file discovery

## ✅ MANDATORY PRACTICES

### 🔥 Firebase-First Architecture

- **PRIMARY**: Use Firebase services for all data operations
- **Authentication**: Firebase Auth with multi-provider OAuth
- **Database**: Firestore for newsletters, user content, profiles
- **Storage**: Firebase Storage for PDFs and user uploads
- **Real-time**: Firestore listeners for live updates

### 📊 Dynamic Content Discovery

- Generate content from actual files using `scripts/generate-pdf-manifest.js`
- Use Firebase Firestore for newsletter metadata
- Implement real-time content updates via Firestore listeners
- No hardcoded file lists or static data

### 🔍 Path Verification Protocol

- Check Firebase Storage existence before file operations
- Use Firestore queries to verify document existence
- Implement proper error handling for missing resources
- Validate user permissions before data access

### 🛡️ Security-First Development

- Follow Firebase security rules in `firestore.rules` and `storage.rules`
- Implement role-based access control (Reader, Contributor, Editor, Admin)
- Validate user authentication before sensitive operations
- Use Firebase Auth state listeners for session management

## 🏗️ Firebase Architecture Requirements

### Authentication Flow

```typescript
// ✅ CORRECT: Firebase Auth integration
const { auth } = useFirebase();
await auth.signIn('google');

// ❌ WRONG: Custom auth or hardcoded users
const user = { id: 1, name: 'John' };
```

### Data Operations

```typescript
// ✅ CORRECT: Firestore operations
const { newsletters } = useFirebase();
const data = await newsletters.loadNewsletters();

// ❌ WRONG: Static data or direct file access
const data = await fetch('/data/newsletters.json');
```

### File Management

```typescript
// ✅ CORRECT: Firebase Storage
const { storage } = useFirebase();
const result = await storage.uploadPdf(file, metadata);

// ❌ WRONG: Direct file system or Google Drive
const upload = await googleDrive.uploadFile(file);
```

## 🔧 Implementation Standards

### Service Layer Organization

```
src/services/
├── firebase-auth.service.ts      # Authentication management
├── firebase-firestore.service.ts # Database operations
├── firebase-storage.service.ts   # File storage
└── newsletter-service.ts         # Legacy (being migrated)
```

### Vue 3 Composable Integration

```typescript
// ✅ REQUIRED: Use Firebase composables
const { auth, newsletters, storage, userContent } = useFirebase();

// ✅ REQUIRED: Reactive state management
const isAuthenticated = computed(() => auth.isAuthenticated.value);
```

### Error Handling Requirements

```typescript
// ✅ REQUIRED: Comprehensive error handling
try {
  const result = await firebaseOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', error);
  throw new Error('User-friendly message');
}
```

## 📁 File Structure Compliance

### Firebase Configuration

- `src/config/firebase.config.ts` - Central Firebase setup
- `src/boot/firebase.ts` - Quasar boot file integration
- `firebase.json` - Project configuration
- `firestore.rules` - Database security rules
- `storage.rules` - File access security rules

### Component Architecture

- Use Quasar components with Firebase composables
- Implement reactive state with Vue 3 Composition API
- Follow role-based UI rendering patterns
- Integrate real-time updates via Firestore listeners

## 🚀 Development Workflow

### Local Development

```bash
# 1. Start Firebase emulators (required)
firebase emulators:start

# 2. Start development server
npm run dev

# 3. Test Firebase integration
# Visit: http://localhost:9000/firebase-demo
```

### Production Deployment

```bash
# 1. Build with Firebase configuration
npm run build

# 2. Deploy security rules
firebase deploy --only firestore:rules,storage:rules

# 3. Deploy to Firebase Hosting
firebase deploy --only hosting
```

## 🔍 Code Review Checklist

### Firebase Integration

- [ ] Uses Firebase services instead of legacy Google Drive
- [ ] Implements proper authentication checks
- [ ] Follows Firestore security rules
- [ ] Uses Firebase Storage for file operations
- [ ] Implements real-time listeners appropriately

### Security Requirements

- [ ] User authentication verified before sensitive operations
- [ ] Role-based access control implemented
- [ ] Input validation on all user data
- [ ] Firebase security rules tested and functional
- [ ] Error handling prevents information leakage

### Performance Standards

- [ ] Firestore queries optimized with proper indexing
- [ ] Real-time listeners disposed properly (onUnmounted)
- [ ] File uploads include progress tracking
- [ ] Client-side caching implemented where appropriate
- [ ] Offline support considerations included

## ⚠️ Common Violations to Avoid

### Authentication Anti-Patterns

```typescript
// ❌ WRONG: Hardcoded auth state
const isLoggedIn = true;

// ❌ WRONG: Manual session management
localStorage.setItem('user', JSON.stringify(user));

// ✅ CORRECT: Firebase Auth state
const { isAuthenticated } = useFirebase().auth;
```

### Data Access Anti-Patterns

```typescript
// ❌ WRONG: Static data arrays
const newsletters = [
  { id: 1, title: 'Newsletter 1' },
  { id: 2, title: 'Newsletter 2' },
];

// ❌ WRONG: Direct API calls without Firebase
const response = await fetch('/api/newsletters');

// ✅ CORRECT: Firebase Firestore
const { newsletters } = useFirebase();
await newsletters.loadNewsletters();
```

### File Access Anti-Patterns

```typescript
// ❌ WRONG: Direct file system access
const pdfUrl = '/public/issues/newsletter.pdf';

// ❌ WRONG: Google Drive direct access (legacy)
const files = await googleDrive.listFiles();

// ✅ CORRECT: Firebase Storage
const { storage } = useFirebase();
const files = await storage.getStorageFiles('newsletters');
```

## 🎯 Success Criteria

### Technical Requirements

- ✅ All data operations use Firebase services
- ✅ Authentication flows through Firebase Auth
- ✅ File storage managed by Firebase Storage
- ✅ Real-time updates via Firestore listeners
- ✅ Production-ready security rules deployed

### User Experience Requirements

- ✅ History mode routing functional
- ✅ Role-based access working correctly
- ✅ Real-time collaboration features active
- ✅ Offline support and synchronization
- ✅ Responsive design across all devices

### Performance Requirements

- ✅ Build process completes without errors
- ✅ Firebase emulators integration working
- ✅ Production deployment successful
- ✅ Security rules passing all tests
- ✅ Cost optimization measures implemented

---

## 🚀 Firebase Migration Status

### ✅ Completed

- Firebase project setup and configuration
- Authentication with multi-provider OAuth
- Firestore database with security rules
- Firebase Storage with access controls
- Vue 3 composables for Firebase integration
- Demo page for testing all features

### 🔄 In Progress

- Migration of existing PDFs to Firebase Storage
- User training on new editorial workflows
- Legacy Google Drive service deprecation

### 📋 Next Steps

- Complete data migration from Google Drive
- Deploy production security rules
- Train editors on Firebase-based workflow
- Monitor and optimize Firebase usage costs

**Compliance with these rules ensures a secure, scalable, and maintainable Firebase-powered application.**
