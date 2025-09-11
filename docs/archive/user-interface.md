# User Interface Features

Documentation for UI components and user experience features in CLCA Courier.

## Brand Icons

### Overview

Custom icon system for community branding and visual consistency.

### Available Icons

- **Community Logo** - CLCA moon logo in multiple formats
- **Courier Logo** - Newsletter-specific branding
- **Navigation Icons** - Custom icons for menu items
- **Status Icons** - Loading, error, success indicators

### Implementation

```typescript
// Icon component usage
<BrandIcon
  name="clca-moon"
  size="lg"
  color="primary"
/>

// Available sizes: xs, sm, md, lg, xl
// Available colors: primary, secondary, accent, dark, light
```

### File Formats

```
public/icons/
├── clca-moon-logo.svg        # Vector format (preferred)
├── clca-moon-logo.png        # Raster fallback
├── courier-logo.svg          # Newsletter branding
├── favicon-16x16.png         # Browser tab icon
├── favicon-32x32.png         # Bookmark icon
├── favicon-96x96.png         # Desktop shortcut
└── favicon-128x128.png       # High-DPI displays
```

## User Settings

### Features

- **Theme Selection** - Light/dark mode toggle
- **Font Size** - Accessibility scaling options
- **Language** - Internationalization support
- **Notification Preferences** - Email and browser notifications
- **Privacy Controls** - Data collection preferences

### Settings Structure

```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  notifications: {
    email: boolean;
    browser: boolean;
    newsletter: boolean;
  };
  privacy: {
    analytics: boolean;
    cookies: boolean;
  };
}
```

### Storage

- **Local Storage** - Persisted across browser sessions
- **Encrypted** - Sensitive settings are encrypted
- **Sync Ready** - Prepared for cloud synchronization

### Usage Example

```typescript
import { useUserSettings } from '@/composables/useUserSettings';

const { settings, updateTheme, updateFontSize, saveSettings } = useUserSettings();

// Update theme
updateTheme('dark');

// Update font size
updateFontSize('large');

// Save all settings
await saveSettings();
```

## Accessibility Features

### Keyboard Navigation

- **Tab Order** - Logical navigation sequence
- **Focus Indicators** - Clear visual focus states
- **Skip Links** - Jump to main content
- **Escape Handling** - Close modals and menus

### Screen Reader Support

- **ARIA Labels** - Descriptive labels for interactive elements
- **Semantic HTML** - Proper heading hierarchy
- **Alt Text** - Image descriptions
- **Live Regions** - Dynamic content announcements

### Visual Accessibility

- **High Contrast** - Enhanced color schemes
- **Text Scaling** - Respects browser font size
- **Color Independence** - Information not conveyed by color alone
- **Motion Reduction** - Respects prefers-reduced-motion

### Implementation

```vue
<!-- Accessible component example -->
<template>
  <button
    :aria-label="buttonLabel"
    :aria-pressed="isPressed"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <BrandIcon name="menu" aria-hidden="true" />
    {{ buttonText }}
  </button>
</template>
```

## Responsive Design

### Breakpoints

```scss
// Quasar breakpoints
$breakpoint-xs: 0px; // Phone
$breakpoint-sm: 600px; // Tablet
$breakpoint-md: 1024px; // Desktop
$breakpoint-lg: 1440px; // Large desktop
$breakpoint-xl: 1920px; // Extra large
```

### Mobile Optimizations

- **Touch Targets** - Minimum 44px tap areas
- **Gesture Support** - Swipe navigation
- **Viewport Meta** - Proper mobile scaling
- **Performance** - Optimized for slower networks

### Layout Patterns

```vue
<!-- Responsive grid example -->
<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-md-6 col-lg-4">
      <!-- Content adapts to screen size -->
    </div>
  </div>
</template>
```
- `q-col-gutter-m` should be used for rows containing child elements with `col-*`

## Loading States

### Components

- **Skeleton Loaders** - Content placeholders
- **Progress Indicators** - Loading progress
- **Spinner Animations** - General loading state
- **Error Boundaries** - Graceful error handling

### Implementation

```vue
<template>
  <div>
    <!-- Loading state -->
    <QSkeleton v-if="loading" type="text" />

    <!-- Error state -->
    <div v-else-if="error" class="error-message">
      {{ error.message }}
    </div>

    <!-- Success state -->
    <div v-else>
      {{ content }}
    </div>
  </div>
</template>
```

## Form Components

### Input Validation

- **Real-time Validation** - Immediate feedback
- **Error Messages** - Clear, actionable error text
- **Success Indicators** - Confirmation of valid input
- **Accessibility** - ARIA invalid and describedby attributes

### Form Types

- **Search Forms** - Site-wide search functionality
- **Submission Forms** - Article and photo submissions
- **Contact Forms** - Community feedback and inquiries
- **Settings Forms** - User preference updates

### Example Implementation

```vue
<template>
  <QForm @submit="onSubmit" class="q-gutter-md">
    <QInput
      v-model="email"
      type="email"
      label="Email Address"
      :rules="[required, validEmail]"
      lazy-rules
    />

    <QBtn type="submit" color="primary" :loading="submitting"> Submit </QBtn>
  </QForm>
</template>
```

## Animation System

### Transitions

- **Page Transitions** - Smooth navigation
- **Component Animations** - Micro-interactions
- **Loading Animations** - Engaging loading states
- **Hover Effects** - Interactive feedback

### Performance

- **GPU Acceleration** - Transform and opacity animations
- **Reduced Motion** - Respects accessibility preferences
- **Efficient Triggers** - Minimize layout thrashing
- **Cleanup** - Remove event listeners on component destroy

### CSS Classes

```scss
// Transition utilities
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.slide-up {
  animation: slideUp 0.2s ease-out;
}

// Respect user preferences
@media (prefers-reduced-motion: reduce) {
  .fade-in,
  .slide-up {
    animation: none;
  }
}
```

## Error Handling

### Error Types

- **Network Errors** - API failures and connectivity issues
- **Validation Errors** - User input validation failures
- **Authorization Errors** - Authentication and permission issues
- **Application Errors** - Unexpected application state

### Error Display

```typescript
interface ErrorDisplay {
  type: 'toast' | 'inline' | 'modal' | 'page';
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  dismissible: boolean;
}
```

### Recovery Actions

- **Retry Buttons** - Allow users to retry failed operations
- **Alternative Actions** - Provide alternative paths forward
- **Help Links** - Direct users to relevant documentation
- **Support Contact** - Easy access to help when needed

## Notification System

### Types

- **Success Messages** - Confirm successful actions
- **Error Alerts** - Alert users to problems
- **Info Notifications** - Provide helpful information
- **Warning Messages** - Caution about potential issues

### Delivery Methods

- **Toast Notifications** - Temporary, non-intrusive messages
- **Banner Alerts** - Persistent, prominent notifications
- **Modal Dialogs** - Critical messages requiring acknowledgment
- **Email Notifications** - External communication

### Implementation

```typescript
import { useNotifications } from '@/composables/useNotifications';

const { notify } = useNotifications();

// Success notification
notify.success('Settings saved successfully');

// Error notification with action
notify.error('Failed to save settings', {
  action: {
    label: 'Retry',
    handler: () => saveSettings(),
  },
});
```
