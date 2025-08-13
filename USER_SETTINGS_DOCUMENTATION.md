# User Settings System Documentation

## Overview

The CLCA Courier application now features a comprehensive user settings system that persists data across browser sessions using a combination of localStorage for quick access and IndexedDB for more complex data storage.

## Architecture

### Storage Layers

1. **localStorage**: Used for immediate access to frequently used settings like theme preferences
2. **IndexedDB**: Used for comprehensive settings backup and more complex data structures

### Key Components

#### 1. Storage Service (`src/services/storage-service.ts`)

The core service that manages all data persistence operations.

**Features:**

- Dual storage strategy (localStorage + IndexedDB)
- Automatic fallback mechanisms
- Type-safe operations
- TTL (Time To Live) support for cached data
- Export/Import functionality
- Graceful error handling

#### 2. User Settings Composable (`src/composables/useUserSettings.ts`)

A Vue composable that provides reactive access to user settings.

**Features:**

- Reactive state management
- Automatic initialization
- Theme synchronization with Quasar
- Category-specific update methods
- Export/Import capabilities

#### 3. Enhanced Theme Composable (`src/composables/useTheme.ts`)

Updated to integrate with the new user settings system while maintaining backward compatibility.

#### 4. Updated Site Store (`src/stores/site-store-simple.ts`)

Integrates with the user settings system for theme management and exposes settings throughout the application.

## Settings Categories

### Theme Settings

```typescript
theme: 'light' | 'dark' | 'auto';
```

- **light**: Force light mode
- **dark**: Force dark mode
- **auto**: Follow system preference

### Notification Settings

```typescript
notifications: {
  browser: boolean; // Browser notifications
  email: boolean; // Email notifications (future)
  issues: boolean; // New issue alerts
  events: boolean; // Event reminders
}
```

### Display Settings

```typescript
display: {
  compactMode: boolean; // Reduced spacing
  animationsEnabled: boolean; // UI animations
  autoplayVideos: boolean; // Auto-play media
}
```

### PDF Viewer Settings

```typescript
pdf: {
  defaultZoom: number; // 0.5 - 3.0
  pageLayout: 'single' | 'facing' | 'cover'; // Layout mode
  thumbnailSize: 'small' | 'medium' | 'large'; // Thumbnail size
}
```

### Language Setting

```typescript
language: string; // ISO language code (e.g., 'en-US')
```

## Usage Examples

### In Vue Components

```vue
<script setup lang="ts">
import { useUserSettings } from '@/composables/useUserSettings';

const userSettings = useUserSettings();

// Access current settings
console.log(userSettings.userSettings.value);

// Update theme
await userSettings.setTheme('dark');

// Toggle theme
await userSettings.toggleDarkMode();

// Update notifications
await userSettings.updateNotificationSettings({
  browser: true,
  issues: false,
});

// Update display settings
await userSettings.updateDisplaySettings({
  compactMode: true,
  animationsEnabled: false,
});

// Update PDF settings
await userSettings.updatePdfSettings({
  defaultZoom: 1.5,
  pageLayout: 'facing',
});

// Export settings
const settingsJson = await userSettings.exportSettings();

// Import settings
await userSettings.importSettings(settingsJson);

// Reset to defaults
await userSettings.resetSettings();
</script>
```

### Using the Enhanced Theme Composable

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const theme = useTheme();

// Reactive theme state
const isDark = theme.isDarkMode;
const currentTheme = theme.currentTheme;

// Theme-aware CSS classes
const cardClass = theme.cardClasses;
const textClass = theme.textClasses;
const bgClass = theme.backgroundClasses;
const borderClass = theme.borderClasses;

// Actions
await theme.setTheme('auto');
await theme.toggleDarkMode();
</script>

<template>
  <q-card :class="cardClass">
    <q-card-section :class="textClass.primary"> Current theme: {{ currentTheme }} </q-card-section>
  </q-card>
</template>
```

### Direct Storage Service Usage

```typescript
import { storageService } from '@/services/storage-service';

// Get all settings
const settings = await storageService.getUserSettings();

// Save partial settings
await storageService.saveUserSettings({
  theme: 'dark',
  display: { compactMode: true },
});

// Theme-specific methods
const theme = await storageService.getTheme();
await storageService.setTheme('light');

// Cache arbitrary data
await storageService.cacheData('myKey', { some: 'data' }, 'category', 3600000); // 1 hour TTL

// Retrieve cached data
const cachedData = await storageService.getCachedData('myKey');

// Clear all user data
await storageService.clearUserData();
```

## Settings Persistence Strategy

### Initialization Flow

1. **localStorage Check**: First checks localStorage for immediate access
2. **IndexedDB Fallback**: If localStorage is empty, checks IndexedDB
3. **Default Values**: If neither has data, uses application defaults
4. **Sync**: Syncs settings between localStorage and IndexedDB

### Update Flow

1. **Immediate Update**: Updates in-memory reactive state immediately
2. **localStorage Save**: Saves to localStorage for quick future access
3. **IndexedDB Save**: Saves to IndexedDB for persistence and backup
4. **Error Handling**: Gracefully handles storage failures

### Data Migration

The system automatically merges new default settings with existing user settings, ensuring that new features don't break existing user configurations.

## Account Settings Page

The enhanced Account Settings page (`src/pages/AccountPage.vue`) provides a comprehensive UI for managing all user settings:

### Features

- **Expandable sections** for different setting categories
- **Real-time preview** of theme changes
- **Visual feedback** with notifications
- **Export/Import functionality** for backup and restore
- **Reset to defaults** with confirmation dialog
- **Loading states** and error handling

### Theme Section

- Radio buttons for theme selection (Light/Dark/Auto)
- Visual indicator of current active theme
- Instant preview of changes

### Notification Section

- Toggle switches for each notification type
- Clear descriptions of what each option controls

### Display Section

- Toggles for UI behavior settings
- Helpful descriptions for each option

### PDF Viewer Section

- Slider for zoom level with percentage display
- Radio buttons for page layout options
- Thumbnail size selection

### Settings Management

- Export settings to JSON file
- Import settings from JSON file
- Reset all settings to defaults

## Error Handling

The system includes comprehensive error handling:

- **Storage Failures**: Gracefully degrades to defaults if storage is unavailable
- **Corrupt Data**: Validates and recovers from invalid stored data
- **Network Issues**: Operates entirely offline
- **User Feedback**: Displays helpful notifications for user actions

## Future Enhancements

The architecture supports easy addition of new settings categories:

### Planned Features

- **User Profiles**: Multiple user configurations
- **Cloud Sync**: Synchronize settings across devices
- **Advanced PDF Settings**: Annotation preferences, reading modes
- **Accessibility**: Font size, contrast, motion preferences
- **Content Filters**: Customize what content is displayed

### Adding New Settings

1. Update the `UserSettings` interface in `storage-service.ts`
2. Add default values to `DEFAULT_SETTINGS`
3. Add getter/setter methods to the storage service
4. Add reactive computed properties to the composable
5. Update the Account Settings page UI

## Performance Considerations

- **Lazy Loading**: Settings are only loaded when first accessed
- **Debounced Updates**: Rapid setting changes are batched
- **Memory Efficient**: Uses reactive refs to minimize re-renders
- **Storage Optimized**: Only stores changed values, not entire objects

## Browser Compatibility

- **localStorage**: Supported in all modern browsers
- **IndexedDB**: Supported in all modern browsers
- **Graceful Degradation**: Falls back to in-memory storage if needed
- **Mobile Support**: Optimized for mobile browsers

## Security Considerations

- **No Sensitive Data**: Settings don't contain personal or sensitive information
- **Local Storage Only**: All data stays on the user's device
- **No Authentication**: Settings are device-specific
- **Safe Defaults**: Secure defaults if storage is compromised

## Testing

The system includes comprehensive error handling and fallbacks that make it resilient in various scenarios:

- **Storage Disabled**: Works with in-memory defaults
- **Quota Exceeded**: Gracefully handles storage limits
- **Invalid Data**: Validates and recovers from corrupt settings
- **Missing Properties**: Merges new defaults with existing settings

## Migration Path

For existing applications, the settings system:

- **Preserves Existing**: Doesn't break existing theme functionality
- **Backward Compatible**: Old theme methods still work
- **Progressive Enhancement**: Can be adopted incrementally
- **Easy Integration**: Drop-in replacement for existing stores
