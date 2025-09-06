# CLCA Courier - Development Guide

## 🚨 CRITICAL RULES (USER-ENFORCED)

### ABSOLUTE PROHIBITIONS

- **❌ Hash Mode Routing**: Always use history mode (`/archive` not `/#/archive`)
- **❌ Hardcoded Data**: No static arrays, JSON files for content, or fake data
- **❌ Path Assumptions**: Always verify file/directory existence before implementation
- **❌ Theme Violations**: Never hardcode background colors or theme-specific styles
- **❌ Gutter + Columns**: Never use `q-gutter-*` classes with precise column layouts

### MANDATORY PRACTICES

- **✅ Firebase-First**: Use Firebase services for all data, auth, and storage
- **✅ Dynamic Discovery**: Generate content from actual files using manifest system
- **✅ Path Verification**: Check existence before referencing files/directories
- **✅ Theme Awareness**: Use Quasar's theme-aware color classes only
- **✅ Responsive Layouts**: Use padding-based spacing instead of margin-based gutters

## 🏗️ Architecture

### Framework Stack

- **Frontend**: Vue 3 + Quasar Framework (Vite-based)
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **State Management**: Pinia stores
- **PDF Handling**: PDFTron WebViewer + PDF.js fallback
- **Routing**: History mode only

### Firebase Integration

- **Authentication**: Multi-provider OAuth (Google, Facebook, Twitter, GitHub)
- **Database**: Firestore for newsletters, metadata, user content
- **Storage**: Firebase Storage for PDFs and user uploads
- **Security**: Role-based access (Reader, Contributor, Editor, Admin)

### Storage Strategy

- **Current**: Firebase Storage for all PDF storage needs
- **Cost**: ~$0.85/month for current scale
- **Future-Ready**: Service layer supports additional providers when needed

## 🛠️ Development Commands

```bash
# Development with hot reload
quasar dev

# Production build
quasar build

# Generate PDF manifest (run before build)
node scripts/generate-pdf-manifest.js

# Firebase deployment
firebase deploy
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
├── pages/               # Route components (*Page.vue naming)
├── services/            # Business logic (TypeScript interfaces)
├── stores/              # Pinia state management
├── config/              # Firebase and app configuration
├── boot/                # Quasar boot files
└── layouts/             # Layout components

public/
├── data/                # Build-time generated manifests
├── issues/              # Local PDF storage (legacy)
└── thumbnails/          # Auto-generated PDF thumbnails

scripts/                 # Build and utility scripts
```

## 🔧 Key Components

### Services

- **firebase-newsletter.service.ts**: Newsletter management with Firebase
- **firebase-firestore.service.ts**: Direct Firestore operations
- **firebase-auth.service.ts**: Authentication handling
- **firebase-storage.service.ts**: File upload and storage

### Components

- **MainLayout.vue**: Base layout with global PDF viewer
- **GlobalPdfViewer.vue**: Application-wide PDF viewer dialog
- **FirebaseNewsletterCard.vue**: Newsletter display with admin controls
- **FirebaseNewsletterArchivePage.vue**: Main archive interface

### Stores

- **newsletter-archive.store.ts**: Newsletter state management
- **auth.store.ts**: Authentication state
- **ui.store.ts**: UI state (theme, modals)

## 📝 Code Patterns

### Firebase-First Pattern

```typescript
// ✅ CORRECT: Firebase-based storage
const newsletterService = new FirebaseNewsletterService();
await newsletterService.initialize();
const downloadUrl = newsletter.downloadUrl;

// ❌ WRONG: Hardcoded arrays
const pdfs = ['2024.01-newsletter.pdf', '2024.02-newsletter.pdf'];
```

### Theme-Aware Styling

```vue
<!-- ✅ CORRECT: Theme-aware classes -->
<div class="bg-primary text-white"></div>
```

### Responsive Layout

```vue
<!-- ✅ CORRECT: Padding-based spacing -->
<div class="row"></div>
```

## 🚀 Development Workflows

### Adding New Features

1. Check Firebase configuration and permissions
2. Verify path existence using tools
3. Follow Firebase-first data patterns
4. Use theme-aware styling
5. Test responsive layouts

### PDF Management

1. Upload to Firebase Storage via admin interface
2. Metadata automatically extracted and stored in Firestore
3. Thumbnails generated and cached
4. Access controlled by security rules

### Authentication Flow

1. User signs in via OAuth providers
2. Profile created/updated in Firestore
3. Role-based permissions applied
4. Real-time state management with Pinia

## 🔍 Debugging

### Common Issues

- **Route not found**: Check history mode configuration in `quasar.config.ts`
- **Firebase errors**: Verify configuration in `firebase.config.ts`
- **PDF not loading**: Check Firebase Storage security rules
- **Theme conflicts**: Remove hardcoded colors, use Quasar classes
- **Layout overflow**: Replace gutters with padding in responsive layouts

### Tools

- Browser DevTools for Firebase debugging
- Quasar DevTools for component inspection
- Firebase Console for data management
- Network tab for API call debugging

## 📚 Key Files

### Configuration

- `quasar.config.ts`: App configuration, history mode routing
- `src/config/firebase.config.ts`: Firebase initialization
- `firebase.json`: Firebase project configuration
- `firestore.rules`: Database security rules
- `storage.rules`: Storage security rules

### Documentation

- `DEVELOPMENT_GUIDE.md`: This file - comprehensive development guide
- `README.md`: Project overview and quick start
- `CHANGELOG.md`: Version history and changes

## 🎯 Best Practices

### Security

- Never expose Firebase config secrets
- Use security rules for data access control
- Validate user permissions on both client and server
- Sanitize user input before storage

### Performance

- Use lazy loading for routes
- Implement pagination for large datasets
- Cache frequently accessed data
- Optimize images and PDFs

### Maintenance

- Keep dependencies updated
- Monitor Firebase usage and costs
- Regular security rule audits
- Document all major changes

## 🔄 Deployment

### Development

```bash
quasar dev               # Local development server
```

### Production

```bash
quasar build           # Build for production
firebase deploy        # Deploy to Firebase Hosting
```

### Environment Variables

- Firebase configuration in `firebase.config.ts`
- API keys in environment variables (production)
- Development vs production Firebase projects
