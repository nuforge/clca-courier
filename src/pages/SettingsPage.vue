<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTheme } from '../composables/useTheme';
import { useUserSettings } from '../composables/useUserSettings';
import { useLocale } from '../composables/useLocale';
import { useTimeFormat } from '../composables/useTimeFormat';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';
import type { SupportedLocale } from '../i18n/utils/locale-detector';

// Import Base Components for Maximum Reuse
import BaseTabbedContent from '../components/BaseTabbedContent.vue';
import BaseStatsGrid from '../components/BaseStatsGrid.vue';
import BaseContentList from '../components/BaseContentList.vue';
import BaseActionToolbar from '../components/BaseActionToolbar.vue';

// Base component interfaces
import type { TabConfig } from '../components/BaseTabbedContent.vue';

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  description?: string;
}

interface ActionButton {
  label: string;
  icon: string;
  color: string;
  style?: 'outline' | 'flat';
  size?: 'sm' | 'md';
  to?: string;
  action?: string;
  disabled?: boolean;
  loading?: boolean;
}

interface ActionSection {
  title: string;
  titleIcon: string;
  description: string;
  primaryAction: ActionButton;
  secondaryActions: ActionButton[];
}

interface LanguageListItem {
  id: string;
  title: string;
  description: string;
  flag: string;
  isActive: boolean;
  value: SupportedLocale;
}

// Use the enhanced user settings
const userSettings = useUserSettings();
const { isDarkMode, currentTheme, setTheme } = useTheme();
const { currentLocale, currentLocaleInfo, locales, switchLocale } = useLocale();
const { timeFormatPreference, timeFormatOptions, getTimeFormatExample, setTimeFormatPreference } = useTimeFormat();
const $q = useQuasar();
const { t } = useI18n();

// Active tab for BaseTabbedContent
const activeSettingsTab = ref('language');

// Computed properties for Base Components

// 1. Settings Tabs Configuration for BaseTabbedContent
const settingsTabs = computed<TabConfig[]>(() => [
  {
    name: 'language',
    label: t(TRANSLATION_KEYS.SETTINGS_PAGE.LANGUAGE_SETTINGS),
    icon: 'mdi-translate',
    description: 'Language and localization preferences'
  },
  {
    name: 'theme',
    label: t(TRANSLATION_KEYS.SETTINGS_PAGE.THEME_SETTINGS),
    icon: 'mdi-palette',
    description: 'Visual theme and appearance'
  },
  {
    name: 'notifications',
    label: t(TRANSLATION_KEYS.SETTINGS_PAGE.NOTIFICATION_SETTINGS),
    icon: 'mdi-bell',
    description: 'Notification preferences'
  },
  {
    name: 'display',
    label: t(TRANSLATION_KEYS.SETTINGS_PAGE.DISPLAY_SETTINGS),
    icon: 'mdi-monitor',
    description: 'Display behavior settings'
  },
  {
    name: 'timeFormat',
    label: t(TRANSLATION_KEYS.SETTINGS_PAGE.TIME_FORMAT_SETTINGS),
    icon: 'mdi-clock-outline',
    description: 'Time display preferences'
  },
  {
    name: 'pdf',
    label: t(TRANSLATION_KEYS.SETTINGS_PAGE.PDF_VIEWER),
    icon: 'mdi-file-pdf-box',
    description: 'PDF viewer settings'
  }
]);

// 2. User Settings Statistics for BaseStatsGrid
const userStats = computed<StatItem[]>(() => [
  {
    label: 'Active Language',
    value: currentLocaleInfo.value.nativeName,
    icon: 'mdi-translate',
    color: 'primary',
    description: 'Current interface language'
  },
  {
    label: 'Theme Mode',
    value: currentTheme.value === 'auto' ? 'Auto' : (isDarkMode.value ? 'Dark' : 'Light'),
    icon: isDarkMode.value ? 'mdi-brightness-4' : 'mdi-brightness-7',
    color: isDarkMode.value ? 'deep-purple' : 'amber',
    description: 'Current theme setting'
  },
  {
    label: 'Notifications',
    value: Object.values(userSettings.notificationSettings.value).filter(Boolean).length,
    icon: 'mdi-bell',
    color: 'green',
    description: 'Active notification types'
  },
  {
    label: 'PDF Zoom',
    value: `${(userSettings.pdfSettings.value.defaultZoom * 100).toFixed(0)}%`,
    icon: 'mdi-file-pdf-box',
    color: 'orange',
    description: 'Default PDF zoom level'
  }
]);

// 3. Language Options for BaseContentList
const languageOptions = computed<LanguageListItem[]>(() =>
  locales.value.map(locale => ({
    id: locale.value,
    title: `${locale.flag} ${locale.nativeLabel}`,
    description: locale.label,
    flag: locale.flag,
    isActive: currentLocale.value === locale.value,
    value: locale.value
  }))
);

// 4. Settings Management Actions for BaseActionToolbar
const settingsActions = computed<ActionSection[]>(() => [
  {
    title: t(TRANSLATION_KEYS.SETTINGS_PAGE.SETTINGS_MANAGEMENT),
    titleIcon: 'mdi-cog',
    description: t(TRANSLATION_KEYS.SETTINGS_PAGE.EXPORT_DESCRIPTION),
    primaryAction: {
      label: t(TRANSLATION_KEYS.SETTINGS_PAGE.EXPORT_SETTINGS),
      icon: 'mdi-export',
      color: 'primary',
      action: 'export',
      style: 'outline'
    },
    secondaryActions: [
      {
        label: t(TRANSLATION_KEYS.SETTINGS_PAGE.IMPORT_SETTINGS),
        icon: 'mdi-import',
        color: 'primary',
        action: 'import',
        style: 'outline'
      },
      {
        label: t(TRANSLATION_KEYS.SETTINGS_PAGE.RESET_TO_DEFAULTS),
        icon: 'mdi-restore',
        color: 'negative',
        action: 'reset',
        style: 'outline'
      }
    ]
  }
]);

// Methods
async function handleLanguageChange(language: SupportedLocale) {
  switchLocale(language); // switchLocale is synchronous, no await needed
  await userSettings.setLanguage(language);
  $q.notify({
    message: t(TRANSLATION_KEYS.SETTINGS_PAGE.LANGUAGE_SETTINGS),
    type: 'positive',
    position: 'top',
    timeout: 2000,
  });
}

async function handleThemeChange(theme: 'light' | 'dark' | 'auto') {
  await setTheme(theme);
  $q.notify({
    message: t(TRANSLATION_KEYS.SETTINGS_PAGE.THEME_SETTINGS),
    type: 'positive',
    position: 'top',
    timeout: 2000,
  });
}

async function handleNotificationUpdate(key: string, value: boolean) {
  await userSettings.updateNotificationSettings({ [key]: value });
  $q.notify({
    message: t(TRANSLATION_KEYS.SETTINGS_PAGE.NOTIFICATION_SETTINGS),
    type: 'positive',
    position: 'top',
    timeout: 2000,
  });
}

async function handleDisplayUpdate(key: string, value: boolean) {
  await userSettings.updateDisplaySettings({ [key]: value });
  $q.notify({
    message: t(TRANSLATION_KEYS.SETTINGS_PAGE.DISPLAY_SETTINGS),
    type: 'positive',
    position: 'top',
    timeout: 2000,
  });
}

async function handlePdfUpdate(key: string, value: number | string | null) {
  if (value !== null) {
    await userSettings.updatePdfSettings({ [key]: value });
    $q.notify({
      message: t(TRANSLATION_KEYS.SETTINGS_PAGE.PDF_SETTINGS),
      type: 'positive',
      position: 'top',
      timeout: 2000,
    });
  }
}

async function handleTimeFormatChange(preference: 'auto' | '12hour' | '24hour') {
  await setTimeFormatPreference(preference);
  $q.notify({
    message: t(TRANSLATION_KEYS.SETTINGS_PAGE.TIME_FORMAT_SETTINGS),
    type: 'positive',
    position: 'top',
    timeout: 2000,
  });
}

function resetAllSettings() {
  $q.dialog({
    title: t(TRANSLATION_KEYS.SETTINGS_PAGE.RESET_CONFIRMATION),
    message: t(TRANSLATION_KEYS.SETTINGS_PAGE.RESET_WARNING),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void userSettings.resetSettings().then(() => {
      $q.notify({
        message: t(TRANSLATION_KEYS.SETTINGS_PAGE.RESET_ALL),
        type: 'positive',
        position: 'top',
        timeout: 3000,
      });
    });
  });
}

async function exportSettings() {
  try {
    const settingsJson = await userSettings.exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clca-courier-settings.json';
    a.click();
    URL.revokeObjectURL(url);

    $q.notify({
      message: 'Settings exported successfully',
      type: 'positive',
      position: 'top',
      timeout: 2000,
    });
  } catch {
    $q.notify({
      message: 'Failed to export settings',
      type: 'negative',
      position: 'top',
      timeout: 2000,
    });
  }
}

function importSettings() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        const text = await file.text();
        await userSettings.importSettings(text);
        $q.notify({
          message: 'Settings imported successfully',
          type: 'positive',
          position: 'top',
          timeout: 2000,
        });
      } catch {
        $q.notify({
          message: 'Failed to import settings - invalid format',
          type: 'negative',
          position: 'top',
          timeout: 2000,
        });
      }
    }
  };
  input.click();
}

// Base Component Event Handlers

// Handle tab changes
const handleTabChange = (tabName: string) => {
  activeSettingsTab.value = tabName;
};

// Handle action clicks from BaseActionToolbar
const handleActionClick = (action: ActionButton) => {
  switch (action.action) {
    case 'export':
      void exportSettings();
      break;
    case 'import':
      importSettings();
      break;
    case 'reset':
      resetAllSettings();
      break;
    default:
      console.warn('Unknown action:', action.action);
  }
};

// Handle language selection from BaseContentList
const handleLanguageSelect = (item: LanguageListItem) => {
  void handleLanguageChange(item.value);
};

// Handle stats click (optional - could show detailed settings)
const handleStatClick = (stat: StatItem) => {
  // Optional: Navigate to specific setting based on stat clicked
  switch (stat.label) {
    case 'Active Language':
      activeSettingsTab.value = 'language';
      break;
    case 'Theme Mode':
      activeSettingsTab.value = 'theme';
      break;
    case 'Notifications':
      activeSettingsTab.value = 'notifications';
      break;
    case 'PDF Zoom':
      activeSettingsTab.value = 'pdf';
      break;
  }
};
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <!-- Settings Page Header -->
          <div class="text-h4 q-mb-md">
            <q-icon name="mdi-cog" class="q-mr-sm" />
            {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.TITLE) }}
          </div>

          <!-- User Settings Statistics using BaseStatsGrid -->
          <div class="q-mb-lg">
            <div class="text-h6 q-mb-md">Settings Overview</div>
            <BaseStatsGrid
              :stats="userStats"
              :columns="4"
              @stat-click="handleStatClick"
            />
          </div>

          <!-- Settings Categories using BaseTabbedContent -->
          <BaseTabbedContent
            :tabs="settingsTabs"
            :active-tab="activeSettingsTab"
            @update:active-tab="handleTabChange"
            class="q-mb-lg"
          >
            <!-- Language Tab Content -->
            <template #language>
              <div class="q-mb-md">
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.SELECT_LANGUAGE) }}</div>

                <!-- Current Language Display -->
                <div class="row items-center q-mb-md">
                  <div class="col-12 col-md-6">
                    <div class="text-body1 q-mb-sm">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.CURRENT_LANGUAGE) }}:</div>
                    <div class="row items-center">
                      <q-chip
                        color="primary"
                        text-color="white"
                        size="lg"
                        class="q-mr-md"
                      >
                        <span class="q-mr-xs">{{ currentLocaleInfo.flag }}</span>
                        {{ currentLocaleInfo.nativeName }}
                      </q-chip>
                      <div class="text-caption text-grey-6">
                        {{ currentLocaleInfo.displayName }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Language Options using BaseContentList -->
                <div class="text-body1 q-mb-sm">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.SELECT_LANGUAGE) }}:</div>
                <BaseContentList
                  :items="languageOptions"
                  variant="compact"
                  :loading="false"
                >
                  <template #item="{ item }">
                    <q-item
                      clickable
                      @click="handleLanguageSelect(item)"
                      :class="item.isActive ? 'bg-primary text-white' : ''"
                      class="q-mb-xs rounded-borders"
                    >
                      <q-item-section avatar>
                        <span class="text-h6">{{ item.flag }}</span>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ item.title }}</q-item-label>
                        <q-item-label caption :class="item.isActive ? 'text-grey-3' : 'text-grey-6'">
                          {{ item.description }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side v-if="item.isActive">
                        <q-icon name="check" color="white" />
                      </q-item-section>
                    </q-item>
                  </template>
                </BaseContentList>

                <q-separator class="q-my-md" />
                <div class="text-body2 text-grey-6">
                  {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.LANGUAGE_DESCRIPTION) }}
                </div>
              </div>
            </template>

            <!-- Theme Tab Content -->
            <template #theme>
              <div class="q-mb-md">
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.THEME_SETTINGS) }}</div>

                <q-option-group
                  :model-value="currentTheme"
                  @update:model-value="handleThemeChange"
                  :options="[
                    { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.LIGHT_THEME), value: 'light', icon: 'mdi-brightness-7' },
                    { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.DARK_THEME), value: 'dark', icon: 'mdi-brightness-4' },
                    { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.AUTO_THEME), value: 'auto', icon: 'mdi-brightness-auto' }
                  ]"
                  color="primary"
                  type="radio"
                />

                <q-separator class="q-my-md" />

                <div class="text-body2 text-grey-6">
                  {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.THEME_DESCRIPTION) }}: <strong>{{ isDarkMode ? t(TRANSLATION_KEYS.SETTINGS_PAGE.DARK_THEME) : t(TRANSLATION_KEYS.SETTINGS_PAGE.LIGHT_THEME) }}</strong>
                  <q-chip
                    :color="isDarkMode ? 'deep-purple' : 'amber'"
                    :icon="isDarkMode ? 'mdi-brightness-4' : 'mdi-brightness-7'"
                    size="sm"
                    class="q-ml-sm"
                  >
                    {{ currentTheme === 'auto' ? t(TRANSLATION_KEYS.SETTINGS_PAGE.AUTO_THEME) : (isDarkMode ? t(TRANSLATION_KEYS.SETTINGS_PAGE.DARK_THEME) : t(TRANSLATION_KEYS.SETTINGS_PAGE.LIGHT_THEME)) }}
                  </q-chip>
                </div>
              </div>
            </template>

            <!-- Notifications Tab Content -->
            <template #notifications>
              <div class="q-mb-md">
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.NOTIFICATION_SETTINGS) }}</div>

                <div class="column q-gutter-md">
                  <q-toggle
                    :model-value="userSettings.notificationSettings.value.browser"
                    @update:model-value="(val) => handleNotificationUpdate('browser', val)"
                    :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.BROWSER_NOTIFICATIONS)"
                    color="primary"
                  />

                  <q-toggle
                    :model-value="userSettings.notificationSettings.value.email"
                    @update:model-value="(val) => handleNotificationUpdate('email', val)"
                    :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.EMAIL_NOTIFICATIONS)"
                    color="primary"
                  />

                  <q-toggle
                    :model-value="userSettings.notificationSettings.value.issues"
                    @update:model-value="(val) => handleNotificationUpdate('issues', val)"
                    :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.NEW_ISSUE_ALERTS)"
                    color="primary"
                  />

                  <q-toggle
                    :model-value="userSettings.notificationSettings.value.events"
                    @update:model-value="(val) => handleNotificationUpdate('events', val)"
                    :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.EVENT_REMINDERS)"
                    color="primary"
                  />
                </div>
              </div>
            </template>

            <!-- Display Tab Content -->
            <template #display>
              <div class="q-mb-md">
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.DISPLAY_SETTINGS) }}</div>

                <div class="column q-gutter-md">
                  <div>
                    <q-toggle
                      :model-value="userSettings.displaySettings.value.compactMode"
                      @update:model-value="(val) => handleDisplayUpdate('compactMode', val)"
                      :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.COMPACT_MODE)"
                      color="primary"
                    />
                    <div class="text-caption text-grey-6 q-ml-md q-mt-xs">
                      {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.COMPACT_MODE_DESCRIPTION) }}
                    </div>
                  </div>

                  <div>
                    <q-toggle
                      :model-value="userSettings.displaySettings.value.animationsEnabled"
                      @update:model-value="(val) => handleDisplayUpdate('animationsEnabled', val)"
                      :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.ENABLE_ANIMATIONS)"
                      color="primary"
                    />
                    <div class="text-caption text-grey-6 q-ml-md q-mt-xs">
                      {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.ENABLE_ANIMATIONS_DESCRIPTION) }}
                    </div>
                  </div>

                  <div>
                    <q-toggle
                      :model-value="userSettings.displaySettings.value.autoplayVideos"
                      @update:model-value="(val) => handleDisplayUpdate('autoplayVideos', val)"
                      :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.AUTOPLAY_VIDEOS)"
                      color="primary"
                    />
                    <div class="text-caption text-grey-6 q-ml-md q-mt-xs">
                      {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.AUTOPLAY_VIDEOS_DESCRIPTION) }}
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Time Format Tab Content -->
            <template #timeFormat>
              <div class="q-mb-md">
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.TIME_FORMAT_SETTINGS) }}</div>

                <div class="text-body2 q-mb-md">
                  {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.TIME_FORMAT_DESCRIPTION) }}
                </div>

                <q-option-group
                  :model-value="timeFormatPreference"
                  @update:model-value="handleTimeFormatChange"
                  :options="timeFormatOptions.map(option => ({
                    label: option.label,
                    value: option.value,
                    description: option.description
                  }))"
                  color="primary"
                  type="radio"
                />

                <q-separator class="q-my-md" />

                <div class="text-body2 text-grey-6">
                  {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.TIME_FORMAT_EXAMPLE, { example: getTimeFormatExample }) }}
                </div>
              </div>
            </template>

            <!-- PDF Tab Content -->
            <template #pdf>
              <div class="q-mb-md">
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.PDF_VIEWER_PREFERENCES) }}</div>

                <div class="column q-gutter-md">
                  <div>
                    <div class="text-subtitle2 q-mb-sm">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.DEFAULT_ZOOM_LEVEL) }}</div>
                    <q-slider
                      :model-value="userSettings.pdfSettings.value.defaultZoom"
                      @update:model-value="(val) => handlePdfUpdate('defaultZoom', val)"
                      :min="0.5"
                      :max="3.0"
                      :step="0.1"
                      label
                      color="primary"
                    />
                    <div class="text-caption text-grey-6">
                      {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.CURRENT) }}: {{ (userSettings.pdfSettings.value.defaultZoom * 100).toFixed(0) }}%
                    </div>
                  </div>

                  <div>
                    <div class="text-subtitle2 q-mb-sm">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.PAGE_LAYOUT) }}</div>
                    <q-option-group
                      :model-value="userSettings.pdfSettings.value.pageLayout"
                      @update:model-value="(val) => handlePdfUpdate('pageLayout', val)"
                      :options="[
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.SINGLE_PAGE), value: 'single' },
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.FACING_PAGES), value: 'facing' },
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.COVER_PAGE), value: 'cover' }
                      ]"
                      color="primary"
                      type="radio"
                      inline
                    />
                  </div>

                  <div>
                    <div class="text-subtitle2 q-mb-sm">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.THUMBNAIL_SIZE) }}</div>
                    <q-option-group
                      :model-value="userSettings.pdfSettings.value.thumbnailSize"
                      @update:model-value="(val) => handlePdfUpdate('thumbnailSize', val)"
                      :options="[
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.SMALL), value: 'small' },
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.MEDIUM), value: 'medium' },
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.LARGE), value: 'large' }
                      ]"
                      color="primary"
                      type="radio"
                      inline
                    />
                  </div>
                </div>
              </div>
            </template>
          </BaseTabbedContent>

          <!-- Settings Management using BaseActionToolbar -->
          <BaseActionToolbar
            :sections="settingsActions"
            :columns="1"
            @action-click="handleActionClick"
            class="q-mb-md"
          />

          <!-- Loading Indicator -->
          <div v-if="userSettings.isSettingsLoading.value" class="text-center q-mt-md">
            <q-spinner color="primary" size="2em" />
            <div class="text-body2 q-mt-sm">Loading settings...</div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>


<!-- NO CUSTOM CSS - Using only Quasar utility classes as per migration guide -->
