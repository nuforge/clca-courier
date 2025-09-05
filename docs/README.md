# Documentation Index

Complete documentation for the CLCA Courier project.

## Quick Start

New to the project? Start here:

1. [Development Setup](development/README.md) - Get the project running locally
2. [Project Rules](../CRITICAL_DEVELOPMENT_RULES.md) - User-enforced development constraints
3. [Refactoring Status](../REFACTORING_ANALYSIS.md) - Current code organization status

## Core Documentation

### � Firebase Integration

- **[📘 Firebase Setup Guide](firebase-setup-guide.md)** - Complete Firebase project setup
- **[🔐 Firebase Authentication Setup](firebase-authentication-setup.md)** - Authentication implementation with troubleshooting
- **[📙 Firebase Migration Guide](firebase-migration-guide.md)** - Migration strategy from Google Drive
- **[🔥 Firebase Complete Guide](../FIREBASE_COMPLETE.md)** - All Firebase features and benefits
- **[📊 Implementation Summary](../FIREBASE_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

### �🔧 Development

- **[Development Guide](development/README.md)** - Complete developer documentation
  - Project structure and architecture
  - Code standards and best practices
  - Build process and deployment
  - Debugging and troubleshooting

### 🔌 Integrations

- **[Google Drive Integration](integrations/google-drive.md)** - Cloud storage and authentication
  - CORS limitations and solutions
  - Setup and configuration
  - API usage and best practices
- **[PDF Viewer Integration](integrations/pdf-viewer.md)** - Document viewing system
  - Dual viewer architecture (PDFTron + PDF.js)
  - Performance optimization
  - File discovery and caching

### ✨ Features

- **[Interactive Map](features/interactive-map.md)** - Community property mapping
  - Property boundaries and search
  - GIS data and trail information
  - Performance and accessibility

- **[User Interface](features/user-interface.md)** - UI components and UX
  - Brand icons and theming
  - User settings and accessibility
  - Forms, animations, and notifications

## Architecture Overview

### Frontend Stack

- **Framework:** Vue 3 + Quasar Framework (Vite-based)
- **Language:** TypeScript (strict mode)
- **State:** Pinia stores with Composition API
- **Routing:** Vue Router (history mode)

### Key Services

- **Newsletter Service:** Hybrid local/Google Drive PDF management
- **PDF Metadata Service:** Automatic PDF analysis and thumbnails
- **Google Drive Service:** OAuth2 integration with CORS awareness
- **Interactive Map Service:** GIS data and property information

### Project Structure

```
src/
├── components/          # Vue components
├── pages/              # Route components
├── layouts/            # Layout templates
├── composables/        # Composition functions
├── services/           # Business logic
├── stores/             # Pinia state management
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── boot/               # Quasar boot files

docs/                   # Documentation (this directory)
├── development/        # Developer guides
├── integrations/       # External service docs
└── features/           # Feature documentation

public/
├── issues/             # Newsletter PDFs
├── thumbnails/         # Generated thumbnails
└── data/               # Manifests and data files
```

## Development Workflow

### Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Generate PDF manifest
node scripts/generate-pdf-manifest.js

# 4. Start development
npm run dev
```

### Common Tasks

```bash
# Development
npm run dev              # Start dev server
npm run type-check       # TypeScript check
npm run lint            # Code quality check

# Build
npm run build           # Production build
npm run preview         # Preview build
```

## Key Principles

### 🚨 Critical Rules (User-Enforced)

- **✅ History Mode Routing** - Always `/archive` not `/#/archive`
- **✅ Dynamic Content Discovery** - Use manifest system, no hardcoded data
- **✅ Path Verification** - Check file existence before referencing
- **❌ No Static Data Arrays** - Generate content from actual files

### 📐 Code Standards

- **TypeScript Strict Mode** - All code must pass strict checks
- **Centralized Types** - Use `src/types/` directory structure
- **Vue 3 Composition API** - Modern Vue patterns
- **Quasar Components** - Framework-consistent UI

### 🔄 Service Architecture

- **Unified Services** - Single responsibility pattern
- **Error Handling** - Consistent error response format
- **Legacy Compatibility** - Maintain backward compatibility during refactoring
- **API Response Types** - Strongly typed service responses

## Recent Changes

### Phase 1-2 Refactoring (Complete)

- ✅ **Type System Consolidated** - All duplicate interfaces merged
- ✅ **Google Drive Services Unified** - 7 services → 4 clean services
- ✅ **Build Stability** - Zero TypeScript compilation errors
- ✅ **Documentation Cleanup** - 37 markdown files → 5 organized docs

### Next Steps

- 🔄 **Phase 3:** Debug code cleanup (console statements)
- 🔄 **Phase 4:** Component organization (extract business logic)

## Support

### Getting Help

1. **Check Documentation** - Look for existing solutions in these docs
2. **Search Issues** - Check GitHub for similar problems
3. **Review Commit History** - See how similar changes were made
4. **Contact Maintainers** - Reach out for complex issues

### Contributing

1. Follow the [Development Guide](development/README.md)
2. Adhere to [Critical Development Rules](../CRITICAL_DEVELOPMENT_RULES.md)
3. Update documentation for new features
4. Test thoroughly before submitting changes

---

**Last Updated:** September 4, 2025  
**Documentation Version:** 2.0 (Post-Refactoring)
