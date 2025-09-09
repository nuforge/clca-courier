# Standardized Content Icons System

This document demonstrates the usage of the new centralized content icons and category system implemented for the CLCA Courier application.

## Overview

The standardized icon system provides consistent visual representation across the entire application for:
- Content types (articles, events, announcements, etc.)
- Classified categories (for sale, services, wanted, free)
- News categories (news, announcements, events)
- Content status indicators (draft, submitted, approved, published)
- Community-specific categories

## Usage Examples

### Basic Icon Retrieval

```typescript
import { 
  getContentIcon, 
  getClassifiedCategoryIcon, 
  getContentTypeIcon,
  formatCategoryName 
} from '../utils/content-icons';

// Get icon for any content type
const articleIcon = getContentIcon('article');
// Returns: { icon: 'mdi-newspaper-variant', color: 'primary', label: 'Articles & Stories' }

// Get specific classified category icon
const forSaleIcon = getClassifiedCategoryIcon('for-sale');
// Returns: { icon: 'mdi-tag', color: 'green', label: 'For Sale' }

// Format category names consistently
const displayName = formatCategoryName('for-sale'); // "For Sale"
const displayName2 = formatCategoryName('volunteer-opportunities'); // "Volunteer Opportunities"
```

### Vue Component Usage

#### In ClassifiedAdCard.vue
```vue
<script setup lang="ts">
import { getClassifiedCategoryIcon, formatCategoryName } from '../utils/content-icons';

const getCategoryConfig = () => getClassifiedCategoryIcon(props.item.category);
const categoryDisplayName = computed(() => formatCategoryName(props.item.category));
</script>

<template>
  <q-avatar
    :color="getCategoryConfig().color"
    text-color="white"
    :icon="getCategoryConfig().icon"
  />
  <div class="text-overline" :class="`text-${getCategoryConfig().color}`">
    {{ categoryDisplayName }}
  </div>
</template>
```

#### In Content Type Selection
```vue
<script setup lang="ts">
import { getContentTypeIcon } from '../utils/content-icons';

const contentTypes = [
  {
    id: 'article',
    title: getContentTypeIcon('article').label,
    icon: getContentTypeIcon('article').icon,
    color: getContentTypeIcon('article').color,
    // ... other properties
  }
];
</script>
```

## Available Categories & Icons

### Content Types
- **article**: Articles & Stories (`mdi-newspaper-variant`, primary)
- **photo**: Photo Stories (`mdi-camera`, secondary)
- **event**: Events & Activities (`mdi-calendar-plus`, accent)
- **announcement**: Community News (`mdi-bullhorn`, positive)
- **classified**: Classifieds (`mdi-tag`, orange)
- **project**: Projects (`mdi-engineering`, info)
- **photo_story**: Photo Story (`mdi-photo-library`, teal)

### Classified Categories
- **for-sale** / **for_sale**: For Sale (`mdi-tag`, green)
- **services**: Services (`mdi-tools`, blue)
- **wanted**: Wanted (`mdi-magnify`, orange)
- **free**: Free (`mdi-gift`, purple)
- **housing**: Housing (`mdi-home`, brown)

### News Categories
- **news**: News (`mdi-newspaper`, primary)
- **announcement**: Announcement (`mdi-bullhorn`, positive)
- **event**: Event (`mdi-calendar-event`, accent)

### Content Status
- **draft**: Draft (`mdi-file-document-edit`, grey)
- **submitted**: Submitted (`mdi-send`, blue)
- **pending**: Pending (`mdi-clock-outline`, orange)
- **approved**: Approved (`mdi-check-circle`, green)
- **published**: Published (`mdi-publish`, positive)
- **rejected**: Rejected (`mdi-close-circle`, red)

### Community Categories
- **community**: Community (`mdi-account-group`, primary)
- **recreation**: Recreation (`mdi-pool`, cyan)
- **lake-activities**: Lake Activities (`mdi-waves`, blue)
- **volunteer-opportunities**: Volunteer Opportunities (`mdi-hand-heart`, pink)
- **neighborhood-watch**: Neighborhood Watch (`mdi-shield-account`, deep-orange)

## Migration Guide

### Before (Scattered Icons)
```vue
<!-- Multiple files with different icon mappings -->
const categoryConfig = {
  'for-sale': { color: 'green', icon: 'mdi-tag' },
  'services': { color: 'blue', icon: 'mdi-tools' },
  // ... different mappings in different files
};
```

### After (Centralized System)
```vue
<!-- Single source of truth -->
import { getClassifiedCategoryIcon } from '../utils/content-icons';
const getCategoryConfig = () => getClassifiedCategoryIcon(category);
```

## API Reference

### Functions

#### `getContentIcon(type: string, fallback?: ContentIconConfig): ContentIconConfig`
Main function that searches all icon collections for a match.

#### `getClassifiedCategoryIcon(category: string): ContentIconConfig`
Specific function for classified ad categories.

#### `getContentTypeIcon(type: string): ContentIconConfig`
Specific function for content types.

#### `getContentStatusIcon(status: string): ContentIconConfig`
Specific function for content status indicators.

#### `formatCategoryName(category: string): string`
Formats category names for display (handles hyphens, underscores, capitalization).

#### `getAvailableCategories(area?: string): string[]`
Returns list of available categories for specific areas.

### Types

```typescript
interface ContentIconConfig {
  icon: string;      // Material Design Icon name
  color: string;     // Quasar color name
  label: string;     // Display label
  description?: string; // Optional description
}
```

## Benefits

1. **Consistency**: Same icons and colors across all components
2. **Maintainability**: Single place to update icons/colors
3. **Type Safety**: TypeScript interfaces ensure correct usage
4. **Flexibility**: Easy to add new categories and types
5. **Performance**: No runtime lookups in templates
6. **Documentation**: Self-documenting with labels and descriptions

## Updated Components

The following components have been updated to use the centralized system:

- ✅ `ClassifiedAdCard.vue` - Uses `getClassifiedCategoryIcon()`
- ✅ `ContributePage.vue` - Uses `getContentTypeIcon()` for content types
- ✅ `FirebaseDebugPanel.vue` - Uses `getContentTypeIcon()` and `getContentStatusIcon()`
- ✅ `ContentPreview.vue` - Uses `getContentTypeIcon()`

## Future Enhancements

- Add theme-specific icon variants
- Implement icon size configurations
- Add animation/transition specifications
- Create icon preview component for admin interface
- Add accessibility labels and descriptions
