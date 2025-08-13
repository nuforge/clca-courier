# Brand Icons

This module provides Vue components for popular brand icons using SVG paths from Simple Icons.

## Available Icons

- `DiscordIcon` - Discord brand icon
- `GithubIcon` - GitHub brand icon
- `TwitterIcon` - Twitter/X brand icon
- `FacebookIcon` - Facebook brand icon
- `InstagramIcon` - Instagram brand icon
- `LinkedinIcon` - LinkedIn brand icon

## Usage

### Basic Usage

```vue
<template>
  <div>
    <DiscordIcon />
    <GithubIcon />
    <TwitterIcon />
  </div>
</template>

<script setup lang="ts">
import { DiscordIcon, GithubIcon, TwitterIcon } from '@/components/BrandIcons';
</script>
```

### Custom Size and Color

```vue
<template>
  <div>
    <!-- Custom size -->
    <DiscordIcon :size="32" />

    <!-- Custom color -->
    <DiscordIcon color="#5865F2" />

    <!-- Both custom size and color -->
    <DiscordIcon :size="48" color="#5865F2" />

    <!-- Using CSS variables (recommended for Quasar themes) -->
    <DiscordIcon color="var(--q-primary)" />
  </div>
</template>

<script setup lang="ts">
import { DiscordIcon } from '@/components/BrandIcons';
</script>
```

### With Quasar Components

```vue
<template>
  <div>
    <!-- In buttons -->
    <q-btn @click="openDiscord" flat round color="primary">
      <DiscordIcon :size="24" />
    </q-btn>

    <!-- In list items -->
    <q-item clickable @click="openDiscord">
      <q-item-section side>
        <DiscordIcon :size="24" color="var(--q-secondary)" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Discord</q-item-label>
        <q-item-label caption>Join our community</q-item-label>
      </q-item-section>
    </q-item>
  </div>
</template>
```

## Props

All icon components accept the following props:

| Prop    | Type               | Default          | Description                         |
| ------- | ------------------ | ---------------- | ----------------------------------- |
| `size`  | `string \| number` | `24`             | Size of the icon in pixels          |
| `color` | `string`           | `'currentColor'` | Color of the icon (CSS color value) |

## Brand Colors

For authentic brand appearance, use these official brand colors:

- **Discord**: `#5865F2`
- **GitHub**: `#333333` (light mode) / `#ffffff` (dark mode)
- **Twitter/X**: `#000000`
- **Facebook**: `#1877F2`
- **Instagram**: `#E4405F`
- **LinkedIn**: `#0A66C2`

## Why Not React Icons?

While React Icons is a popular choice, this implementation:

1. **Better Vue Integration**: Native Vue components work seamlessly with Vue's reactivity
2. **Smaller Bundle**: Only includes the icons you need
3. **Quasar Compatibility**: Works perfectly with Quasar's color system and theming
4. **No React Dependency**: Keeps bundle size smaller for Vue-only projects

## Adding New Icons

To add a new brand icon:

1. Get the SVG path from [Simple Icons](https://simpleicons.org/)
2. Add the path to the `iconPaths` object in `BrandIcons.ts`
3. Export a new component using `createBrandIcon()`

```typescript
// In BrandIcons.ts
const iconPaths = {
  // ...existing icons
  newbrand: 'M12 0C5.373...', // SVG path from Simple Icons
};

export const NewBrandIcon = createBrandIcon('newbrand');
```
