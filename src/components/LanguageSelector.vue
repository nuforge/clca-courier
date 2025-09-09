<!--
Language Selector Component

Provides a user interface for switching between supported languages
with proper accessibility and responsive design.

@author CLCA Courier Development Team
@version 1.0.0
-->

<script setup lang="ts">
import { computed } from 'vue';
import { useLocale } from 'src/composables/useLocale';
import { UI_ICONS } from 'src/constants/ui-icons';
import { TRANSLATION_KEYS } from 'src/i18n/utils/translation-keys';
import { useI18n } from 'vue-i18n';

interface Props {
  /**
   * Show compact mini version (icon only)
   */
  mini?: boolean;

  /**
   * Show as dropdown menu instead of button group
   */
  dropdown?: boolean;

  /**
   * Color variant for styling
   */
  color?: string;

  /**
   * Size variant
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  mini: false,
  dropdown: true,
  color: 'primary',
  size: 'md'
});

const { t } = useI18n();
const {
  currentLocale,
  currentLocaleInfo,
  locales,
  switchLocale
} = useLocale();

// Compute display options based on props
const buttonLabel = computed(() => {
  if (props.mini) {
    return currentLocaleInfo.value.flag;
  }
  return `${currentLocaleInfo.value.flag} ${currentLocaleInfo.value.nativeName}`;
});

// Handle locale selection
const handleLocaleChange = (locale: string) => {
  switchLocale(locale as 'en-US' | 'es-ES');
};

// Accessibility label
const ariaLabel = computed(() =>
  t(TRANSLATION_KEYS.SETTINGS.LANGUAGE)
);
</script>

<template>
  <div class="language-selector">
    <!-- Dropdown Version (Default) -->
    <q-btn-dropdown
      v-if="dropdown"
      :label="buttonLabel"
      :color="color"
      :size="size"
      :icon="mini ? undefined : UI_ICONS.language"
      :flat="mini"
      :rounded="!mini"
      :aria-label="ariaLabel"
      class="language-selector__dropdown"
    >
      <q-list class="language-selector__list">
        <q-item
          v-for="locale in locales"
          :key="locale.value"
          clickable
          v-close-popup
          :active="currentLocale === locale.value"
          active-class="text-primary bg-primary-alpha"
          class="language-selector__item"
          @click="handleLocaleChange(locale.value)"
        >
          <q-item-section avatar class="language-selector__flag">
            <span class="text-h6">{{ locale.flag }}</span>
          </q-item-section>

          <q-item-section class="language-selector__text">
            <q-item-label class="language-selector__native">
              {{ locale.nativeLabel }}
            </q-item-label>
            <q-item-label
              caption
              class="language-selector__display"
            >
              {{ locale.label }}
            </q-item-label>
          </q-item-section>

          <q-item-section
            side
            v-if="currentLocale === locale.value"
            class="language-selector__check"
          >
            <q-icon :name="UI_ICONS.checkCircle" color="primary" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>

    <!-- Button Group Version -->
    <q-btn-group
      v-else
      rounded
    >
      <q-btn
        v-for="locale in locales"
        :key="locale.value"
        :label="mini ? locale.flag : `${locale.flag} ${locale.nativeLabel}`"
        :color="currentLocale === locale.value ? color : 'grey-6'"
        :flat="currentLocale !== locale.value"
        :size="size"
        :aria-label="`${t(TRANSLATION_KEYS.SETTINGS.LANGUAGE)}: ${locale.label}`"
        @click="handleLocaleChange(locale.value)"
      />
    </q-btn-group>
  </div>
</template>

<style lang="scss" scoped>
.language-selector {
  &__dropdown {
    min-width: 120px;
  }

  &__list {
    min-width: 180px;
  }

  &__item {
    padding: 8px 16px;

    &:hover {
      background-color: rgba(var(--q-primary), 0.1);
    }
  }

  &__flag {
    min-width: 32px;
    display: flex;
    justify-content: center;
  }

  &__text {
    flex: 1;
  }

  &__native {
    font-weight: 500;
    font-size: 14px;
  }

  &__display {
    font-size: 12px;
    opacity: 0.7;
  }

  &__check {
    min-width: 24px;
  }

  &__group {
    .language-selector__button {
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
      }
    }
  }
}

// Responsive adjustments
@media (max-width: 600px) {
  .language-selector {
    &__list {
      min-width: 160px;
    }

    &__native {
      font-size: 13px;
    }

    &__display {
      font-size: 11px;
    }
  }
}

// Dark mode support
body.body--dark {
  .language-selector {
    &__item {
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .language-selector {
    &__dropdown {
      border: 2px solid currentColor;
    }

    &__item {
      border-bottom: 1px solid rgba(var(--q-primary), 0.2);

      &:last-child {
        border-bottom: none;
      }
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .language-selector {
    &__button {
      transition: none;

      &:hover {
        transform: none;
      }
    }
  }
}
</style>
