# Component Refactoring Documentation

## Overview

The MainLayout.vue and related components have been refactored to improve code organization, reusability, and maintainability. The refactoring splits the monolithic layout into smaller, focused components and introduces composables for shared functionality.

## New Component Structure

### Core Layout Components

#### 1. `components/BaseLayout.vue`

- **Purpose**: A flexible, reusable layout wrapper that can be used for different layout configurations
- **Features**:
  - Configurable view settings
  - Optional header and navigation
  - Slot-based content injection
  - Theme-aware page container
- **Props**:
  - `viewConfig`: Quasar layout view configuration (default: 'hHh lpR lFf')
  - `showHeader`: Toggle header visibility (default: true)
  - `showNavigation`: Toggle navigation visibility (default: true)
  - `showMenuButton`: Toggle menu button visibility (default: true)
  - `search`: Search text value for two-way binding

#### 2. `components/AppHeader.vue`

- **Purpose**: Application header with logo, theme toggle, and search functionality
- **Features**:
  - Responsive logo display
  - Dark/light mode toggle
  - Integrated search input
  - Optional menu button for mobile
- **Props**:
  - `showMenuButton`: Whether to show the hamburger menu button
  - `modelValue`: Search text for two-way binding
- **Emits**:
  - `update:modelValue`: Search text updates
  - `toggle-drawer`: Menu button clicks

#### 3. `components/AppNavigation.vue`

- **Purpose**: Side navigation drawer with application menu items
- **Features**:
  - Responsive drawer behavior
  - Uses shared navigation data
  - Theme-aware styling
- **Props**:
  - `modelValue`: Drawer open/closed state
- **Emits**:
  - `update:modelValue`: Drawer state changes

#### 4. `components/NavigationItem.vue`

- **Purpose**: Individual navigation menu item component
- **Features**:
  - Router integration
  - Active state styling
  - Theme-aware appearance
  - Icon and text display
- **Props**:
  - `item`: Navigation item object with title, icon, and link

#### 5. `components/SearchInput.vue`

- **Purpose**: Reusable search input component
- **Features**:
  - Configurable appearance
  - Clear functionality
  - Event emission for search actions
- **Props**:
  - `modelValue`: Search text
  - `dark`, `dense`, `standout`: Styling options
  - `placeholder`: Input placeholder text
  - Various icon customization options

### Composables

#### 1. `composables/useNavigation.ts`

- **Purpose**: Centralized navigation menu configuration
- **Returns**: Array of navigation items with title, icon, and link properties
- **Benefits**: Single source of truth for navigation structure

#### 2. `composables/useTheme.ts`

- **Purpose**: Theme-aware styling utilities
- **Features**:
  - Reactive theme state
  - Pre-computed CSS classes for common elements
  - Theme toggle functionality
- **Returns**:
  - `isDarkMode`: Current theme state
  - `cardClasses`: Theme-appropriate card styles
  - `textClasses`: Various text color classes
  - `backgroundClasses`: Background color classes
  - `borderClasses`: Border color classes
  - `toggleDarkMode`: Function to toggle theme

## Refactored Files

### `layouts/MainLayout.vue`

- **Before**: 150+ lines of mixed layout, navigation, and styling code
- **After**: 15 lines using BaseLayout component
- **Benefits**: Dramatically simplified, more maintainable, easier to understand

### `pages/IndexPage.vue`

- **Updated**: Now uses `useTheme` composable instead of direct store access
- **Benefits**: Cleaner code, better separation of concerns

## Usage Examples

### Using BaseLayout for Custom Layouts

```vue
<template>
  <BaseLayout view-config="hHh lpR lFf" :show-navigation="false" v-model:search="searchText">
    <!-- Custom content -->
    <div>Custom page content</div>

    <!-- Custom header in header slot -->
    <template #header>
      <CustomHeader />
    </template>
  </BaseLayout>
</template>
```

### Using Theme Composable in Components

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const { cardClasses, textClasses, isDarkMode } = useTheme();
</script>

<template>
  <q-card :class="cardClasses">
    <q-card-section>
      <div :class="textClasses.primary">Main content</div>
      <div :class="textClasses.secondary">Secondary text</div>
    </q-card-section>
  </q-card>
</template>
```

### Creating Custom Navigation

```vue
<script setup lang="ts">
import { useNavigation } from '@/composables/useNavigation';

const { navigationItems } = useNavigation();

// Add custom items
const customItems = [
  ...navigationItems,
  { title: 'Admin', icon: 'admin_panel_settings', link: '/admin' },
];
</script>
```

## Benefits of Refactoring

1. **Maintainability**: Smaller, focused components are easier to understand and modify
2. **Reusability**: Components can be used across different parts of the application
3. **Testability**: Individual components can be tested in isolation
4. **Consistency**: Shared composables ensure consistent behavior across components
5. **Developer Experience**: Clear separation of concerns and well-defined interfaces
6. **Performance**: Better tree-shaking and code splitting opportunities
7. **Scalability**: Easy to extend and add new features without affecting existing code

## Migration Guide

### For New Features

- Use `BaseLayout` for new layout structures
- Use `useTheme` for theme-aware styling
- Use `useNavigation` for menu-related features
- Use `SearchInput` for search functionality

### For Existing Components

- Replace direct store access with appropriate composables
- Consider extracting reusable UI patterns into components
- Use the new components where applicable

## Future Enhancements

1. **Additional Layout Variants**: Create specialized layouts for different page types
2. **Advanced Search**: Extend SearchInput with autocomplete and filtering
3. **Navigation Permissions**: Add role-based navigation filtering
4. **Theme Presets**: Multiple theme options beyond dark/light
5. **Component Library**: Document and export components for other projects
