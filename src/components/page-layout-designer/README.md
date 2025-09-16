# Page Layout Designer Components

This directory contains the modular components for the Page Layout Designer system, which was refactored from the original monolithic `PageLayoutDialog.vue` component for better maintainability, testing, and code organization.

## Architecture Overview

The Page Layout Designer is now split into several focused components that work together through a shared composable:

### Core Components

#### `PageLayoutDesignerPage.vue`
- **Purpose**: Main page component that serves as the container for all layout designer functionality
- **Route**: `/admin/newsletters/:issueId/layout`
- **Features**: 
  - Navigation and page header
  - Integration with all panel components
  - Issue data loading and initialization
  - PDF preview functionality

#### `AvailableContentPanel.vue`
- **Purpose**: Manages available content and issue content library
- **Features**:
  - Collapsible available content section with search and filtering
  - Issue content library with layout status indicators
  - Drag and drop functionality for content management
  - Add/remove content to/from issues

#### `PagePreviewPanel.vue`
- **Purpose**: Provides visual page preview with drag-and-drop layout management
- **Features**:
  - Real-time page preview with template-based layout
  - Drop zones for content placement
  - Template selection dropdown
  - Visual feedback for drag operations

#### `LayoutControlsPanel.vue`
- **Purpose**: Houses all layout control tools and actions
- **Features**:
  - Page management (add/remove pages)
  - Template selection and configuration
  - Content flow controls (auto-arrange, clear)
  - Content statistics display
  - Save and preview actions

#### `LayoutPreviewDialog.vue`
- **Purpose**: Full-screen preview dialog for final layout review
- **Features**:
  - Maximized preview of newsletter layout
  - Template-aware content rendering
  - PDF generation trigger
  - Professional print-ready preview

### Shared State Management

#### `usePageLayoutDesigner.ts`
- **Purpose**: Centralized composable for managing all page layout designer state and functionality
- **Features**:
  - Reactive state management for all components
  - Content management operations (add/remove from issues)
  - Template and page management
  - Drag and drop coordination
  - Layout saving and validation

## Key Features

### 🎯 **Modular Architecture**
- Each component has a single, focused responsibility
- Clean separation of concerns
- Reusable components that can be tested independently

### 🌐 **Full Internationalization**
- All user-facing text uses `$t()` translation functions
- Comprehensive English and Spanish translations
- Type-safe translation key constants

### ♿ **Accessibility First**
- ARIA labels and roles throughout
- Keyboard navigation support
- Screen reader compatibility
- Focus management for dialog components

### 🎨 **Responsive Design**
- Mobile-friendly layouts
- Adaptive component sizing
- Touch-friendly drag and drop
- Responsive grid systems

### 🧪 **Testing Ready**
- Modular components are easier to unit test
- Clear component boundaries
- Composable logic separated from UI
- Mocked dependencies support

## Usage Example

```vue
<template>
  <PageLayoutDesignerPage />
</template>

<script setup lang="ts">
// The page component handles all initialization
// Individual panel components are automatically included
</script>
```

## State Flow

```
┌─────────────────────────────────────┐
│         Page Designer Page          │
│  (Loads issue data & initializes)   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│     usePageLayoutDesigner()         │
│  (Shared state & business logic)    │
└─────────────────┬───────────────────┘
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Available│ │ Preview │ │Controls │
│ Content │ │  Panel  │ │  Panel  │
│  Panel  │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘
```

## Component Interactions

- **AvailableContentPanel** ↔ **usePageLayoutDesigner**: Content search, filtering, add/remove operations
- **PagePreviewPanel** ↔ **usePageLayoutDesigner**: Drag/drop operations, template changes, area management  
- **LayoutControlsPanel** ↔ **usePageLayoutDesigner**: Page management, template selection, bulk operations
- **LayoutPreviewDialog** ↔ **usePageLayoutDesigner**: Preview display, PDF generation

## Development Guidelines

### Adding New Features
1. Add state to `usePageLayoutDesigner.ts` if shared across components
2. Add local state to individual components if component-specific
3. Update translation files for any new user-facing text
4. Ensure accessibility attributes are included
5. Add appropriate TypeScript types

### Testing Strategy
- Unit test the composable logic separately from UI components
- Test component rendering and user interactions
- Mock the composable for component tests
- Integration tests for the full page workflow

### Code Quality
- Each component should stay under 200-300 lines (following user rules)
- Use TypeScript strict mode throughout
- Follow Vue 3 Composition API patterns
- Implement proper error boundaries

## Migration Notes

This refactor replaces the original `PageLayoutDialog.vue` which was:
- ✅ **Before**: 1,476 lines in a single file
- ✅ **After**: 5 focused components (~200-400 lines each) + shared composable

Benefits of the refactor:
- **Maintainability**: Easier to find and fix issues
- **Testing**: Each component can be tested in isolation  
- **Reusability**: Components can be reused in other contexts
- **Performance**: Better code splitting and lazy loading
- **Developer Experience**: Smaller files are easier to work with

## Debugging and Troubleshooting

### 🔍 **Content Debug Panel**

The Page Layout Designer includes a comprehensive debugging panel to help identify content loading issues:

**Activation Methods:**
- **Development**: Automatically enabled in dev mode
- **Production**: Add `?debug` to URL or run `togglePageLayoutDebug()` in browser console
- **Persistent**: Set `localStorage.setItem('pageLayoutDebug', 'true')`

**Debug Information Provided:**
- **Content Loading Summary**: Total loaded vs available vs filtered counts
- **Filter Status**: Current search query and status filters
- **Content Breakdown**: Count by status (published, approved, draft, etc.)
- **Sample Data**: JSON preview of actual content structure
- **Troubleshooting Tips**: Specific guidance based on current state

### 🚨 **Common Issues and Solutions**

#### **Available Content is Empty**
**Symptoms:** Debug panel shows content loaded but available count is 0

**Potential Causes:**
1. **Overly Restrictive Service Query**: Check `getApprovedSubmissions()` method
2. **Content Already in Issue**: Content appears in "In Issue" count instead
3. **Status Filter Mismatch**: Content status doesn't match selected filter
4. **Missing Required Tags**: Content lacks `newsletter:ready` tag (legacy implementation)

**Solutions:**
1. Check debug panel's "Content by Status" section
2. Verify content has expected status values
3. Reset status filter to "All" to see all content
4. Check Firestore collections (`content` and `content_submissions`)

#### **No Content Loaded at All**
**Symptoms:** Debug panel shows 0 total loaded

**Potential Causes:**
1. **Firestore Security Rules**: Rules block content access
2. **Collection Name Mismatch**: Content in different collection than expected
3. **Authentication Issues**: User not properly authenticated
4. **Network/Firebase Connection**: Firebase connection problems

**Solutions:**
1. Check browser dev tools for Firestore errors
2. Verify user authentication status  
3. Check Firestore security rules allow read access
4. Confirm collection names match service implementation

### 🧪 **Testing Strategy**

**Unit Tests:**
- `tests/unit/composables/usePageLayoutDesigner.test.ts`: Composable filtering logic
- `tests/unit/services/newsletter-generation.service.test.ts`: Content loading service

**Integration Tests:**
- Page-level tests verifying full content flow
- End-to-end tests with real Firestore data

**Manual Testing:**
- Use debug panel to verify content loading
- Test different filter combinations
- Verify content appears in correct sections

### 📊 **Performance Monitoring**

The debug panel helps identify performance issues:
- **Large Content Counts**: Monitor total loaded vs filtered ratios
- **Inefficient Filtering**: High "Filtered Out" counts may indicate inefficient queries
- **Missing Indexes**: Firestore query errors in browser console

## Future Enhancements

Potential areas for future improvement:
- Add more sophisticated template system
- Implement real-time collaboration features
- Add undo/redo functionality
- Enhanced drag and drop with visual guides
- Template marketplace integration
- Advanced content filtering and sorting options
- Real-time content collaboration features
