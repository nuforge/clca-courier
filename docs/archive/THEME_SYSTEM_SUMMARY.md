# Standardized Theme System & Admin Dashboard

## Overview

We've created a comprehensive theme management system and admin dashboard that addresses the issues you mentioned:

1. **Standardized Icons & Colors** - Single source of truth for all content categories
2. **Centralized Management** - Easy-to-edit configuration files
3. **Admin Dashboard** - Central hub for all administrative functions

## What We Built

### 1. Centralized Theme Configuration (`src/config/site-theme.config.ts`)

**Single source of truth for:**
- Content type icons and colors (article, event, announcement, classified, photo, newsletter)
- Category mappings with subcategories
- Status indicators (draft, pending, approved, published, rejected, featured)
- Complete color palette

**Key Features:**
- Easily editable in one place
- Consistent across entire application
- Type-safe TypeScript interfaces
- Color reference system (e.g., `contentTypes.event` resolves to purple)

### 2. Theme Composable (`src/composables/useSiteTheme.ts`)

**Provides reactive access to:**
- `getContentIcon(type)` - Get icon/color for content types
- `getCategoryIcon(contentType, category)` - Get icon/color for categories  
- `getStatusIcon(status)` - Get icon/color for status
- `getAvailableCategories(contentType)` - Get valid categories
- `updateTheme()` - Admin function to modify theme

### 3. Admin Dashboard (`src/pages/AdminDashboardPage.vue`)

**Central hub with sections for:**
- **Content Management** - Review submitted content, access pending/published items
- **Newsletter Management** - Manage newsletter archive and uploads
- **Site Configuration** - Theme, categories, and color management
- **User Management** - User accounts and permissions (placeholder)
- **Statistics Overview** - Real-time stats on content and activity
- **Recent Activity** - Live feed of system activity

### 4. Theme Management Dialogs

**Three specialized interfaces:**

#### Theme Configuration Dialog (`ThemeConfigDialog.vue`)
- Full theme editor with tabs for Content Types, Categories, Colors, Status
- Visual preview of icons and colors
- Bulk editing capabilities
- Reset to defaults option

#### Categories Dialog (`CategoriesDialog.vue`)
- Quick overview of all content categories
- Shows available subcategories for each content type
- Links to full theme editor

#### Colors Dialog (`ColorsDialog.vue`)
- Visual color palette overview
- Shows primary, content type, and status colors
- Color previews with hex values
- Links to full color editor

### 5. Updated Routes

**New admin routes:**
- `/admin` - Admin Dashboard (central hub)
- `/admin/dashboard` - Redirects to `/admin`
- `/admin/content` - Content Management (existing)
- `/admin/newsletters` - Newsletter Management (existing)

## How to Use

### For Administrators

1. **Access Admin Dashboard:** Navigate to `/admin`
2. **Theme Management:** Click "Theme & Categories" for full editor
3. **Quick Category View:** Click "Categories" for overview
4. **Color Palette:** Click "Colors" for color scheme view
5. **Content Review:** Click "Review Content" or specific pending counts

### For Developers

1. **Get Content Icon:**
   ```vue
   <script setup>
   import { useSiteTheme } from '@/composables/useSiteTheme';
   const { getContentIcon } = useSiteTheme();
   
   const eventIcon = getContentIcon('event');
   // Returns: { icon: 'mdi-calendar-star', color: '#9c27b0', label: 'Events & Activities' }
   </script>
   ```

2. **Get Category Icon:**
   ```vue
   const meetingIcon = getCategoryIcon('event', 'meeting');
   // Returns: { icon: 'mdi-account-group', color: '#673ab7', label: 'Meeting' }
   ```

3. **Use in Templates:**
   ```vue
   <q-icon 
     :name="getContentIcon('event').icon" 
     :color="getContentIcon('event').color" 
   />
   ```

### Standardization Achieved

**Before:** Different icons/colors for events across:
- Calendar page: `mdi-calendar-star` with `primary` color
- Community page: `mdi-calendar-event` with `accent` color  
- Submit page: Different icon/color combinations

**After:** Consistent across all pages:
- Event icon: `mdi-calendar-star`
- Event color: `accent` (purple)
- Single source in `site-theme.config.ts`

## Configuration Management

### Easy Category Changes

Edit `src/config/site-theme.config.ts`:

```typescript
// Add new content type
contentTypes: {
  // ... existing types
  workshop: {
    icon: 'mdi-school',
    color: 'contentTypes.workshop',
    label: 'Workshops',
    description: 'Educational workshops and training',
    subcategories: ['technical', 'creative', 'business'],
  },
}

// Add colors for new type
colors: {
  contentTypes: {
    // ... existing colors
    workshop: '#795548', // Brown
  }
}
```

### Easy Color Changes

```typescript
colors: {
  contentTypes: {
    event: '#e91e63', // Change from purple to pink
    article: '#00bcd4', // Change from blue to cyan
  }
}
```

All components using these content types will automatically update!

## Files Created/Modified

### New Files:
- `src/config/site-theme.config.ts` - Theme configuration
- `src/composables/useSiteTheme.ts` - Theme composable
- `src/pages/AdminDashboardPage.vue` - Admin dashboard
- `src/components/admin/ThemeConfigDialog.vue` - Full theme editor
- `src/components/admin/CategoriesDialog.vue` - Category overview
- `src/components/admin/ColorsDialog.vue` - Color palette view

### Modified Files:
- `src/router/routes.ts` - Added admin routes
- `src/services/calendar-events.service.ts` - Standardized icons/colors
- `src/pages/CommunityContentPage.vue` - Updated imports

## Benefits Achieved

1. **Consistency:** Same icons/colors across entire app
2. **Maintainability:** Single file to edit all categories/colors
3. **Admin Control:** Non-technical users can modify themes
4. **Type Safety:** Full TypeScript support
5. **Scalability:** Easy to add new content types/categories
6. **Developer Experience:** Simple composable interface

The system is now ready for production use with centralized theme management and a comprehensive admin dashboard!
