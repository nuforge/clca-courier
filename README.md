# The Courier @ Conashaugh Lakes 🚀

**A production-ready community content management platform for the Conashaugh Lakes Community Association**

Built with Vue 3, Quasar Framework, and Firebase backend for managing newsletters, community content, and member engagement.

**Current Status:** ✅ **Production Ready** - Launched September 2025

## 🌟 Platform Features

### Newsletter Management
- 📰 **Digital Archive** - Complete searchable newsletter collection with advanced filtering
- 📁 **Dual PDF Viewer** - PDFTron WebViewer & PDF.js integration for optimal document viewing
- � **Smart Search** - Full-text search across all newsletter content with keyword highlighting
- 📅 **Date-Based Organization** - Chronological browsing with month/year filtering

### Community Content Hub
- 📝 **Unified Interface** - Single platform at `/community` for all content types:
  - News articles and announcements
  - Community events and activities  
  - Classifieds (for sale, services, wanted, free items)
  - Official community announcements
- ✏️ **Content Submission** - User-friendly forms for community contributions at `/contribute/submit`
- 👨‍💼 **Admin Review System** - Comprehensive moderation interface at `/admin/content`
- 🔄 **Publishing Workflow** - Structured progression: Submit → Review → Approve → Publish
- 📊 **Real-time Updates** - Live content updates via Firebase subscriptions

### Community Features
- 🗺️ **Interactive Map** - Google Maps integration with community lot visualization
- 🌐 **Public Access** - Published content accessible without authentication
- 📱 **Mobile-First Design** - Responsive interface optimized for all devices
- 🎯 **Featured Content** - Highlight important community information

### Technical Foundation
- 🔐 **Multi-Provider Auth** - Google, Facebook, Twitter, GitHub OAuth integration
- ☁️ **Firebase Backend** - Firestore database, Storage, and real-time subscriptions
- 🛡️ **Security** - Role-based access control with public/private content separation
- ⚡ **Performance** - Optimized bundle (2.4MB JS, 540KB CSS) with code splitting
- 🎨 **Professional UI** - Dark/light theme support with Quasar Material Design
- 🌐 **Internationalization** - Full bilingual support (English/Spanish) with Vue i18n

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with enabled services (Auth, Firestore, Storage)
- PDFTron WebViewer license (optional - falls back to PDF.js)

### Quick Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# or
quasar dev

# Build for production
npm run build
# or
quasar build
```

### Environment Configuration

Create `.env` file in project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: PDFTron WebViewer
VITE_PDFTRON_LICENSE_KEY=your_license_key
```

### Firebase Setup

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication providers (Google, Facebook, Twitter, GitHub)
3. Create Firestore database with security rules from `firestore.rules`
4. Enable Storage with rules from `storage.rules`
5. Deploy Firebase Functions (optional)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Vue 3 + Quasar Framework v2.18.2
- **Build Tool**: Vite v6.3.5 with TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **State Management**: Pinia with composition API
- **PDF Processing**: PDFTron WebViewer + PDF.js
- **UI Framework**: Quasar Material Design components
- **Internationalization**: Vue i18n v11.0.0 with English/Spanish support

### Project Structure
```
src/
├── components/     # Reusable Vue components
├── pages/         # Route-based page components
├── layouts/       # Application layouts
├── services/      # Business logic and API integrations
├── stores/        # Pinia state management
├── types/         # TypeScript type definitions
├── utils/         # Utility functions and helpers
└── assets/        # Static assets and styles
```

### Key Features Implementation
- **Newsletter Archive**: Firebase Storage + Firestore metadata with PDF text extraction
- **Content Management**: Real-time Firebase subscriptions with status-based workflows
- **Authentication**: Multi-provider OAuth with role-based access control
- **PDF Viewing**: Dual-viewer architecture with WebViewer primary, PDF.js fallback
- **Search**: Full-text search across extracted PDF content and metadata

## 📱 Key Routes

- **`/`** - Homepage with featured content and quick navigation
- **`/archive`** - Newsletter archive with search and filtering
- **`/community`** - Unified community content hub
- **`/contribute/submit`** - Content submission forms
- **`/admin/content`** - Content moderation dashboard
- **`/admin`** - Administrative tools and settings
- **`/map`** - Interactive community map

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run build:prod   # High-memory production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run deploy       # Build and deploy to Firebase
```

### Code Quality
- **TypeScript**: Strict mode with comprehensive type definitions
- **ESLint**: Configured with Vue and TypeScript rules
- **Prettier**: Consistent code formatting
- **Professional Logging**: Centralized logger utility
- **Zero Build Errors**: Clean compilation with optimized bundle

## 📚 Documentation

Complete documentation available in [`docs/`](./docs/):

- **[🚀 Quick Start Guide](docs/quickstart.md)** - Get up and running
- **[🏗️ Architecture Overview](docs/architecture.md)** - System design and patterns
- **[🔥 Firebase Setup](docs/firebase-setup.md)** - Backend configuration
- **[📝 Content Management](docs/content-management.md)** - Submission and review workflow
- **[🗺️ Interactive Map](docs/interactive-map.md)** - Community map features
- **[🎨 Theme System Summary](docs/THEME_SYSTEM_SUMMARY.md)** - Icon and UI consistency guide
- **[🌐 Localization Plan](docs/localization-analysis-report.md)** - Comprehensive bilingual implementation strategy
- **[⚙️ Development Guide](docs/development/README.md)** - Developer documentation

## 🚦 Project Status

**Current Version:** 1.0.0 (Production Ready)  
**Last Updated:** September 9, 2025  
**Build Status:** ✅ Passing (0 errors, 0 warnings)  
**Bundle Size:** 2.4MB JS, 540KB CSS (optimized)

### Recent Achievements
- ✅ **Type System Unified** - Single source of truth for all data structures
- ✅ **Code Quality Standards** - Professional logging and error handling
- ✅ **Community Features** - Complete content management workflow
- ✅ **Performance Optimized** - Clean build with code splitting
- ✅ **Security Implemented** - Role-based access with Firebase rules
- ✅ **Localization Ready** - Comprehensive bilingual implementation plan approved

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

See [docs/development/README.md](docs/development/README.md) for detailed contribution guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏘️ About CLCA

The Conashaugh Lakes Community Association is a private community in Pennsylvania dedicated to providing residents with recreational opportunities, community engagement, and natural beauty preservation.

---

**Built with ❤️ for the Conashaugh Lakes Community**
