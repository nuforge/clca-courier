# The Courier (CLCA Courier)

Community newsletter and information platform for Conashaugh Lakes.

## 🚨 CRITICAL DEVELOPMENT RULES

### NEVER DO THESE (USER ENFORCED)

- ❌ **Hash Mode Routing**: Always use history mode (`/archive` not `/#/archive`)
- ❌ **Hardcoded Data Lists**: No static arrays, JSON files for content, or fake data
- ❌ **Assuming Paths**: Always verify file/directory existence before implementation

### MANDATORY PRACTICES

- ✅ **Dynamic Content Discovery**: Generate content from actual files using manifest system
- ✅ **Path Verification**: Check existence before referencing any files or directories
- ✅ **History Mode Only**: Application runs in history mode routing

## 📚 Documentation

Complete documentation is available in the [`docs/`](./docs/) directory:

- **[📖 Documentation Index](./docs/README.md)** - Start here for all documentation
- **[🔧 Development Guide](./docs/development/README.md)** - Setup, standards, and workflow
- **[🔌 Google Drive Integration](./docs/integrations/google-drive.md)** - Cloud storage setup
- **[📄 PDF Viewer Integration](./docs/integrations/pdf-viewer.md)** - Document viewing system
- **[🗺️ Interactive Map](./docs/features/interactive-map.md)** - Community mapping features
- **[🎨 User Interface](./docs/features/user-interface.md)** - UI components and UX

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/nuforge/clca-courier.git
cd clca-courier

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Generate PDF manifest
node scripts/generate-pdf-manifest.js

# Start development server
npm run dev
```

## 🛠️ Development Commands

### Development

```bash
npm run dev           # Start dev server with hot reload
npm run type-check    # TypeScript compilation check
npm run lint          # ESLint code quality check
npm run format        # Prettier code formatting
```

### Build

```bash
npm run build         # Production build
npm run preview       # Preview production build
```

## 🏗️ Project Architecture

### Frontend Stack

- **Framework:** Vue 3 + Quasar Framework (Vite-based)
- **Language:** TypeScript (strict mode)
- **State Management:** Pinia stores
- **Routing:** Vue Router (history mode)

### Key Features

- **📄 PDF Viewer:** Dual system (PDFTron WebViewer + PDF.js)
- **☁️ Google Drive Integration:** OAuth2 with CORS awareness
- **🗺️ Interactive Map:** Community property mapping with GIS data
- **📱 Responsive Design:** Mobile-first approach
- **♿ Accessibility:** WCAG 2.1 compliance

## ⚠️ Important Notes

### Google Drive CORS Limitation

Google Drive URLs cannot be accessed directly from client-side JavaScript due to CORS policies. See [Google Drive Integration docs](./docs/integrations/google-drive.md) for solutions.

### PDF Discovery System

The application uses a manifest-based system for PDF discovery. Run `node scripts/generate-pdf-manifest.js` before building to update the PDF index.

## 🤝 Contributing

1. Read the [Development Guide](./docs/development/README.md)
2. Follow [Critical Development Rules](./CRITICAL_DEVELOPMENT_RULES.md)
3. Check the [Refactoring Analysis](./REFACTORING_ANALYSIS.md) for current status
4. Test thoroughly before submitting changes

## 📝 License

[Add your license information here]

---

**For detailed documentation, visit [`docs/README.md`](./docs/README.md)**
