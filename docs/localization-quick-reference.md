# Localization Quick Reference Guide

**CLCA Courier Internationalization Implementation**  
*Quick reference for developers implementing bilingual features*

## 🚀 Getting Started

### Basic Translation Usage

```vue
<template>
  <!-- Simple translation -->
  <h1>{{ $t('navigation.community') }}</h1>
  
  <!-- Translation with parameters -->
  <p>{{ $t('forms.validation.required', { field: 'Email' }) }}</p>
  
  <!-- Conditional translation -->
  <span>{{ $t(`content.status.${status}`) }}</span>
  
  <!-- Pluralization -->
  <span>{{ $tn('items.count', itemCount, { count: itemCount }) }}</span>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { TRANSLATION_KEYS } from 'src/i18n/utils/translation-keys';

const { t, tn } = useI18n();

// Type-safe translation keys
const buttonText = computed(() => t(TRANSLATION_KEYS.FORMS.SAVE));
</script>
```

## 📁 File Structure

```
src/i18n/
├── index.ts                    # Main i18n configuration
├── locales/
│   ├── en-US/
│   │   ├── index.ts           # English entry point
│   │   ├── common.ts          # Buttons, labels, common UI
│   │   ├── navigation.ts      # Menu items, breadcrumbs
│   │   ├── forms.ts           # Form labels, validation
│   │   ├── content.ts         # Content types, statuses
│   │   ├── newsletter.ts      # Newsletter-specific terms
│   │   └── errors.ts          # Error messages
│   └── es-ES/
│       └── [same structure]   # Spanish translations
└── utils/
    ├── translation-keys.ts    # Type-safe constants
    └── locale-detector.ts     # Browser detection
```

## 🔑 Translation Key Structure

```typescript
// src/i18n/utils/translation-keys.ts
export const TRANSLATION_KEYS = {
  NAVIGATION: {
    HOME: 'navigation.home',
    ARCHIVE: 'navigation.archive',
    COMMUNITY: 'navigation.community',
    ADMIN: 'navigation.admin'
  },
  FORMS: {
    SAVE: 'forms.save',
    CANCEL: 'forms.cancel',
    SUBMIT: 'forms.submit',
    VALIDATION: {
      REQUIRED: 'forms.validation.required',
      EMAIL: 'forms.validation.email'
    }
  },
  CONTENT: {
    STATUS: {
      PENDING: 'content.status.pending',
      APPROVED: 'content.status.approved',
      PUBLISHED: 'content.status.published'
    },
    TYPES: {
      NEWS: 'content.types.news',
      EVENT: 'content.types.event',
      CLASSIFIED: 'content.types.classified'
    }
  }
} as const;
```

## 🌐 Composable Usage

```typescript
// src/composables/useLocale.ts
import { useLocale } from 'src/composables/useLocale';

export function useComponentWithLocale() {
  const { currentLocale, switchLocale, availableLocales } = useLocale();
  
  // Switch language programmatically
  const changeToSpanish = () => switchLocale('es-ES');
  
  // Get current locale for conditional logic
  const isSpanish = computed(() => currentLocale.value === 'es-ES');
  
  return {
    currentLocale,
    switchLocale,
    availableLocales,
    isSpanish
  };
}
```

## 📅 Date Formatting

```typescript
// Use localized date formatting
import { formatDateLocalized } from 'src/utils/date-formatter';

// Format date according to current locale
const formattedDate = formatDateLocalized(
  newsletter.publicationDate,
  'NEWSLETTER_DISPLAY'
);

// Spanish: "enero 2025"
// English: "January 2025"
```

## 🎨 Language Selector Component

```vue
<!-- Add to any component for language switching -->
<template>
  <LanguageSelector :mini="false" />
</template>

<script setup lang="ts">
import LanguageSelector from 'src/components/LanguageSelector.vue';
</script>
```

## 📝 Creating New Translations

### 1. Add to English File
```typescript
// src/i18n/locales/en-US/[category].ts
export default {
  newFeature: {
    title: 'New Feature',
    description: 'This is a new feature description',
    actions: {
      enable: 'Enable Feature',
      disable: 'Disable Feature'
    }
  }
};
```

### 2. Add to Spanish File
```typescript
// src/i18n/locales/es-ES/[category].ts
export default {
  newFeature: {
    title: 'Nueva Funcionalidad',
    description: 'Esta es la descripción de una nueva funcionalidad',
    actions: {
      enable: 'Activar Funcionalidad',
      disable: 'Desactivar Funcionalidad'
    }
  }
};
```

### 3. Add Type-Safe Keys
```typescript
// src/i18n/utils/translation-keys.ts
export const TRANSLATION_KEYS = {
  // ... existing keys
  NEW_FEATURE: {
    TITLE: 'newFeature.title',
    DESCRIPTION: 'newFeature.description',
    ACTIONS: {
      ENABLE: 'newFeature.actions.enable',
      DISABLE: 'newFeature.actions.disable'
    }
  }
} as const;
```

### 4. Use in Component
```vue
<template>
  <div>
    <h2>{{ $t(TRANSLATION_KEYS.NEW_FEATURE.TITLE) }}</h2>
    <p>{{ $t(TRANSLATION_KEYS.NEW_FEATURE.DESCRIPTION) }}</p>
    <q-btn 
      :label="$t(TRANSLATION_KEYS.NEW_FEATURE.ACTIONS.ENABLE)"
      @click="enableFeature"
    />
  </div>
</template>
```

## 🛠️ Development Tools

### ESLint Configuration
```javascript
// eslint.config.js
rules: {
  'vue/no-bare-strings-in-template': 'warn', // Catch hardcoded text
}
```

### VS Code Extensions
- **Vue i18n Ally**: Real-time translation management
- **Auto translation key generation**
- **Missing translation detection**

## 🧪 Testing Translations

### Manual Testing Checklist
- [ ] All UI elements display in both languages
- [ ] Language selector works correctly
- [ ] No hardcoded strings visible
- [ ] Date/number formatting respects locale
- [ ] Fallback to English for missing translations

### Automated Testing
```typescript
// Test translation completeness
describe('Translation Completeness', () => {
  it('should have all English keys in Spanish', () => {
    const englishKeys = getAllTranslationKeys('en-US');
    const spanishKeys = getAllTranslationKeys('es-ES');
    
    expect(spanishKeys).toContainAllKeys(englishKeys);
  });
});
```

## 🚨 Common Pitfalls

### ❌ Don't Do This
```vue
<template>
  <!-- Hardcoded text -->
  <h1>Newsletter Archive</h1>
  
  <!-- Direct string concatenation -->
  <p>Found {{ count }} results</p>
  
  <!-- Non-reactive translation -->
  <button>{{ t('forms.save') }}</button>
</template>
```

### ✅ Do This Instead
```vue
<template>
  <!-- Proper translation -->
  <h1>{{ $t('navigation.archive') }}</h1>
  
  <!-- Parameterized translation -->
  <p>{{ $t('search.results', { count }) }}</p>
  
  <!-- Reactive translation -->
  <button>{{ $t(TRANSLATION_KEYS.FORMS.SAVE) }}</button>
</template>
```

## 📊 Performance Considerations

- **Lazy Loading**: Translation files loaded only when needed
- **Bundle Size**: ~15-20KB additional per language
- **Caching**: Translations cached in memory
- **Fallbacks**: Graceful fallback to English for missing keys

## 🎯 Quick Commands

```bash
# Start dev server with locale debugging
npm run dev -- --locale-debug

# Build with translation validation
npm run build:validate-i18n

# Extract unused translation keys
npm run i18n:cleanup

# Generate translation completeness report
npm run i18n:audit
```

---

**Remember**: All user-facing text MUST use translation functions. The goal is 100% bilingual coverage with no hardcoded strings in the final implementation.
