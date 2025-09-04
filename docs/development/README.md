# Development Documentation

Complete development guide for CLCA Courier contributors and maintainers.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- VS Code (recommended)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/nuforge/clca-courier.git
cd clca-courier

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

## Project Structure

### Core Architecture

```
src/
├── components/          # Vue components
├── pages/              # Route components
├── layouts/            # Layout templates
├── composables/        # Vue composition functions
├── services/           # Business logic services
├── stores/             # Pinia state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── boot/               # Quasar boot files
```

### Configuration Files

- `quasar.config.ts` - Quasar framework configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint rules
- `.env` - Environment variables

## Development Rules (USER-ENFORCED)

### ABSOLUTE PROHIBITIONS ❌

- **Hash Mode Routing:** Always use history mode (`/archive` not `/#/archive`)
- **Hardcoded Data Lists:** No static arrays, JSON files for content, or fake data
- **Path Assumptions:** Always verify file/directory existence before implementation

### MANDATORY PRACTICES ✅

- **Dynamic Content Discovery:** Generate content from actual files using manifest system
- **Path Verification:** Check existence before referencing any files or directories
- **Manifest-Based PDF Discovery:** Use `scripts/generate-pdf-manifest.js` for build-time PDF enumeration

## Code Standards

### TypeScript

- **Strict mode enabled** - All code must pass strict TypeScript checks
- **Centralized types** - Use `src/types/` directory structure
- **Interface over type** - Prefer interfaces for object types
- **Explicit return types** - Always specify function return types

### Vue 3 + Composition API

- **Setup script syntax** - Use `<script setup>` for new components
- **Reactive references** - Use `ref()` and `reactive()` appropriately
- **Composable pattern** - Extract reusable logic to composables
- **Props validation** - Define prop types and validation

### Quasar Framework

- **Component library** - Use Quasar components over custom HTML
- **Build optimization** - Import only needed Quasar components
- **Theme system** - Use Quasar's built-in theming
- **Responsive design** - Mobile-first approach with breakpoints

## Service Architecture

### Unified Service Pattern

```typescript
// Example service structure
export class ExampleService {
  private config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Service initialization
  }

  async operation(): Promise<ApiResponse<Data>> {
    // Service operations with proper error handling
  }
}
```

### Error Handling

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: {
    code: number;
    message: string;
    status: string;
  };
  status: 'success' | 'error';
}
```

## Build Process

### Development

```bash
npm run dev          # Start dev server with hot reload
npm run type-check   # TypeScript compilation check
npm run lint         # ESLint code quality check
npm run format       # Prettier code formatting
```

### Production

```bash
npm run build        # Production build
npm run preview      # Preview production build
npm run build:prod   # High-memory production build (if needed)
```

### PDF Manifest Generation

```bash
# Run before build to update PDF manifest
node scripts/generate-pdf-manifest.js
```

## Testing Strategy

### Manual Testing Checklist

- [ ] PDF viewer functionality (local and Google Drive)
- [ ] Interactive map performance
- [ ] Search functionality across all content types
- [ ] Mobile responsiveness
- [ ] Accessibility compliance
- [ ] Error handling and fallbacks

### Browser Testing

- ✅ Chrome (primary development)
- ✅ Firefox (PDF.js compatibility)
- ✅ Safari (WebKit compatibility)
- ✅ Edge (Chromium compatibility)
- ⚠️ Mobile browsers (responsive design)

## Performance Guidelines

### Bundle Optimization

- **Code splitting** - Lazy load route components
- **Tree shaking** - Import only used functions
- **Asset optimization** - Compress images and fonts
- **Service worker** - Cache static assets

### Runtime Performance

- **Lazy loading** - Load content on demand
- **Virtual scrolling** - For large lists
- **Image optimization** - WebP format with fallbacks
- **Memory management** - Clean up event listeners

## Environment Configuration

### Required Variables

```bash
# Google Drive Integration
VITE_GOOGLE_DRIVE_API_KEY=
VITE_GOOGLE_DRIVE_CLIENT_ID=
VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID=
VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID=
VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID=

# PDF Viewer
VITE_PDFTRON_LICENSE_KEY=

# Development
VITE_APP_ENV=development
```

### Optional Variables

```bash
# Analytics
VITE_GOOGLE_ANALYTICS_ID=

# Feature Flags
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_GOOGLE_DRIVE=true
```

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature development
- `hotfix/*` - Critical production fixes

### Commit Convention

```
type(scope): description

feat(map): add property search functionality
fix(pdf): resolve CORS issues with Google Drive
docs(readme): update setup instructions
refactor(types): consolidate duplicate interfaces
```

## Debugging

### Browser DevTools

- **Vue DevTools** - Component inspection and state management
- **Network Tab** - API calls and resource loading
- **Console** - JavaScript errors and logging
- **Performance** - Identify bottlenecks

### Logging System

```typescript
import { logger } from '@/utils/logger';

// Different log levels
logger.debug('Debug information');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error occurred', error);

// Service-specific logging
logger.drive('Google Drive operation');
logger.pdf('PDF processing');
logger.map('Map interaction');
```

## Deployment

### Build Verification

```bash
# Full build check
npm run build
npm run preview

# Check bundle size
npm run build --analyze
```

### Production Checklist

- [ ] Environment variables configured
- [ ] PDF manifest generated
- [ ] Google Drive authentication working
- [ ] SSL certificate valid
- [ ] CDN configured for assets
- [ ] Error monitoring enabled

### Server Configuration

```nginx
# Nginx configuration for history mode routing
location / {
  try_files $uri $uri/ /index.html;
}

# Gzip compression
gzip on;
gzip_types text/plain text/css application/javascript application/json;
```

## Troubleshooting

### Common Development Issues

**Build failures**

- Check TypeScript errors: `npm run type-check`
- Verify import paths are correct
- Ensure all dependencies are installed

**Runtime errors**

- Check browser console for JavaScript errors
- Verify environment variables are loaded
- Check network tab for failed API requests

**Performance issues**

- Use browser performance profiler
- Check for memory leaks in components
- Verify lazy loading is working correctly

### Getting Help

1. Check existing documentation in `/docs/`
2. Search GitHub issues for similar problems
3. Review commit history for related changes
4. Contact project maintainers

## Contributing

### Code Review Process

1. Create feature branch from `develop`
2. Implement changes following code standards
3. Test thoroughly on multiple browsers
4. Submit pull request with detailed description
5. Address review feedback promptly

### Documentation Updates

- Update relevant docs when changing functionality
- Add examples for new features
- Keep README.md current with setup instructions
- Document breaking changes in commit messages
