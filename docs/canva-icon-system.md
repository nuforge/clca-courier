# Canva Icon System Documentation

## Overview

This document describes the implementation of Canva branded icons following official [Canva Brand Guidelines](https://www.canva.dev/docs/connect/guidelines/brand/). The system provides brand-compliant Canva logo integration for the CLCA Courier application.

## 🎯 Brand Compliance

Our implementation strictly follows Canva's official brand guidelines:

- ✅ **Logo Selection**: Icon logo for surfaces < 50px, type logo for ≥ 50px
- ✅ **Minimum Padding**: 8px padding around logos maintained
- ✅ **Color Integrity**: Original Canva colors preserved (no modifications)
- ✅ **Aspect Ratio**: Logos never stretched or distorted
- ✅ **Approved Assets**: Only official Canva logo assets used
- ✅ **Proper Attribution**: "Canva" or "Powered by Canva" messaging included

## 📁 File Structure

```
src/
├── constants/
│   └── canva-icons.ts          # Core constants and utilities
├── components/
│   ├── CanvaLogo.vue           # Main Canva logo component
│   └── CanvaIcon.vue           # Quasar-compatible icon wrapper
├── plugins/
│   └── canva-icons.ts          # Vue plugin registration
└── boot/
    └── canva-icons.ts          # Quasar boot file

tests/unit/
├── components/
│   ├── CanvaLogo.spec.ts       # CanvaLogo component tests
│   └── CanvaIcon.spec.ts       # CanvaIcon component tests
└── constants/
    └── canva-icons.spec.ts     # Constants and utilities tests
```

## 🔧 Installation and Setup

### 1. Boot File Registration

The system is automatically registered via Quasar's boot system:

```typescript
// quasar.config.ts
boot: ['i18n', 'axios', 'firebase', 'canva-icons']
```

### 2. Asset Organization

Canva assets are organized following their brand kit structure:

```
src/assets/logos/canva/
├── svg/
│   ├── Canva Icon logo.svg     # For surfaces < 50px
│   ├── Canva type logo.svg     # For surfaces ≥ 50px  
│   └── Canva circle logo.svg   # Alternative circular format
└── png/
    ├── 32x32/
    ├── 64x64/
    ├── 128x128/
    ├── 256x256/
    └── 512x512/
```

## 🎨 Usage Examples

### Basic Logo Component

```vue
<template>
  <!-- Auto-selects appropriate logo type based on size -->
  <CanvaLogo :size="32" />
  
  <!-- Explicit logo type -->
  <CanvaLogo type="icon" :size="24" />
  
  <!-- Using presets for common cases -->
  <CanvaLogo preset="buttonIcon" />
  <CanvaLogo preset="headerLogo" />
  
  <!-- Interactive logo -->
  <CanvaLogo 
    :size="40" 
    clickable 
    @click="handleCanvaClick" 
  />
</template>
```

### Icon Wrapper for Quasar Integration

```vue
<template>
  <!-- Use in buttons -->
  <q-btn>
    <CanvaIcon name="canva-icon" :size="16" />
    Open in Canva
  </q-btn>
  
  <!-- Navigation items -->
  <q-item>
    <q-item-section avatar>
      <CanvaIcon name="canva-icon" :size="24" />
    </q-item-section>
  </q-item>
  
  <!-- Headers -->
  <h2>
    <CanvaIcon name="canva-type" :size="32" />
    Powered by Canva
  </h2>
</template>
```

### Integration with Existing UI Icons

```vue
<script setup>
import { UI_ICONS } from '../constants/ui-icons';
</script>

<template>
  <!-- Traditional UI icon -->
  <q-icon :name="UI_ICONS.edit" />
  
  <!-- Canva branded icon -->
  <q-icon name="canva-icon" />
  
  <!-- Or use the component directly -->
  <CanvaIcon name="canva-icon" :size="20" />
</template>
```

## 📋 Component APIs

### CanvaLogo Component

**Props:**

```typescript
interface Props {
  type?: 'icon' | 'circle' | 'type'    // Logo type - auto-selected if not provided
  size?: number | string                // Target size in pixels
  preset?: 'buttonIcon' | 'navigationIcon' | 'headerLogo' | 'footerLogo'
  alt?: string                          // Custom alt text
  class?: string                        // Additional CSS classes
  padded?: boolean                      // Add 8px padding (default: true)
  clickable?: boolean                   // Make interactive (default: false)
  disabled?: boolean                    // Disabled state (default: false)
}
```

**Events:**
- `@click(event: MouseEvent)` - Emitted when clickable logo is clicked

**Auto-Selection Logic:**
- Size < 50px → Uses `icon` logo type
- Size ≥ 50px → Uses `type` logo type

### CanvaIcon Component

Simplified wrapper for Quasar compatibility:

```typescript
interface Props {
  name?: string          // 'canva-icon', 'canva-type', 'canva-circle'
  size?: string | number // Icon size
  color?: string         // Ignored per brand guidelines
  class?: string         // Additional CSS classes
}
```

## 🎯 Presets

Pre-configured settings for common use cases:

| Preset | Logo Type | Size | Use Case |
|--------|-----------|------|----------|
| `buttonIcon` | icon | 32px | Small interactive elements |
| `navigationIcon` | icon | 64px | Navigation items |
| `headerLogo` | type | 128px | Headers and branding |
| `footerLogo` | type | 64px | Footer attribution |

## 🎨 Brand Colors

Official Canva colors (never modify these):

```typescript
export const CANVA_COLORS = {
  primary: '#00C4CC',    // Canva teal
  purple: '#8B46FF',     // Canva purple
  pink: '#FF6DC7',       // Canva pink
  white: '#FFFFFF',
  black: '#000000',
};
```

## ♿ Accessibility Features

- **ARIA Support**: Proper `role`, `tabindex`, and `aria-disabled` attributes
- **Keyboard Navigation**: Enter and Space key support for interactive logos
- **Screen Reader**: Descriptive alt text and screen reader only text
- **Focus Management**: Visible focus indicators with proper contrast
- **Semantic HTML**: Appropriate use of `button` and `img` roles

## 🧪 Testing

Comprehensive test suite covering:

- **Brand Compliance**: Logo selection, color preservation, sizing
- **Accessibility**: ARIA attributes, keyboard navigation, screen readers
- **Component Integration**: Props passing, event handling, presets
- **Edge Cases**: Invalid inputs, size boundaries, missing assets

Run tests:

```bash
npm run test:unit src/components/Canva*.spec.ts
npm run test:unit src/constants/canva-icons.spec.ts
```

## 📐 Implementation Examples

### Navigation Button (Current Implementation)

```vue
<!-- Before: Generic tool icon -->
<q-btn @click="openProject" color="accent" size="xs">
  <q-icon :name="UI_ICONS.tools" class="q-mr-sm" />
  Canva
</q-btn>

<!-- After: Branded Canva icon -->
<q-btn @click="openProject" color="accent" size="xs">
  <CanvaIcon name="canva-icon" :size="16" class="q-mr-sm" />
  Canva
</q-btn>
```

### Content Creation Button

```vue
<q-btn color="primary" @click="createWithCanva">
  <CanvaIcon name="canva-icon" :size="18" class="q-mr-sm" />
  {{ $t('Create with Canva') }}
</q-btn>
```

### Footer Attribution

```vue
<div class="footer-attribution">
  <CanvaLogo preset="footerLogo" />
  <span class="q-ml-sm text-caption">Powered by Canva</span>
</div>
```

## 🔒 Brand Guidelines Compliance

Our implementation ensures compliance with Canva's brand guidelines:

### ✅ Required Practices

1. **Logo Selection**: Automatic selection based on surface size
2. **Minimum Spacing**: 8px padding maintained around logos
3. **Aspect Ratio**: Never stretch or compress logos
4. **Color Integrity**: Original Canva colors preserved
5. **Approved Usage**: Only for integration UI elements
6. **Attribution**: "Canva" text accompanies icons

### ❌ Prohibited Practices

1. **Color Modification**: Never alter Canva logo colors
2. **Shape Changes**: Never modify logo shape or padding
3. **Unauthorized Versions**: Only use approved logo variants
4. **Brand Confusion**: Never imply endorsement by Canva
5. **Marketing Usage**: Don't use in external marketing materials

## 🚀 Performance Considerations

- **SVG Priority**: SVG assets preferred for scalability and performance
- **Lazy Loading**: Images use `loading="lazy"` and `decoding="async"`
- **Asset Optimization**: PNG assets provided in multiple sizes
- **Bundle Impact**: Components tree-shakeable and lightweight

## 🔄 Updates and Maintenance

When updating Canva assets:

1. Download latest assets from Canva's official brand kit
2. Maintain existing file structure and naming
3. Update tests if new logo variants added
4. Verify brand guideline compliance
5. Update documentation for any API changes

## 📞 Support

For questions about:
- **Brand Guidelines**: Refer to [Canva's official documentation](https://www.canva.dev/docs/connect/guidelines/brand/)
- **Implementation**: See component source code and tests
- **Integration**: Check usage examples in this documentation
