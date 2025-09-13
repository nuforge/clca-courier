<script setup lang="ts">
import { ref } from 'vue';
import { useTheme } from '../composables/useTheme';
import { useUserSettings } from '../composables/useUserSettings';
import { useLocale } from '../composables/useLocale';
import { useTimeFormat } from '../composables/useTimeFormat';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';
import type { SupportedLocale } from '../i18n/utils/locale-detector';

// Use the enhanced user settings
const userSettings = useUserSettings();
const { isDarkMode, currentTheme, setTheme } = useTheme();
const { currentLocale, currentLocaleInfo, locales, switchLocale } = useLocale();
const { timeFormatPreference, timeFormatOptions, getTimeFormatExample, setTimeFormatPreference } = useTimeFormat();
const $q = useQuasar();
const { t } = useI18n();

// Local state for UI
const settingsExpanded = ref({
  language: true,
  theme: true,
  notifications: false,
  display: false,
  timeFormat: false,
  pdf: false,
});

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
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <div class="text-h4 q-mb-md">
            <q-icon name="mdi-cog" class="q-mr-sm" />
            {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.TITLE) }}
          </div>

          <!-- Language Settings -->
          <q-expansion-item v-model="settingsExpanded.language" icon="mdi-translate"
            :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.LANGUAGE_SETTINGS)"
            default-opened class="q-mb-md">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.SELECT_LANGUAGE) }}</div>

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
                  </div>                  <div class="col-12 col-md-6 q-mt-md q-mt-md-none">
                    <div class="text-body1 q-mb-sm">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.SELECT_LANGUAGE) }}:</div>
                    <div class="row q-gutter-sm">
                      <q-btn
                        v-for="locale in locales"
                        :key="locale.value"
                        :label="`${locale.flag} ${locale.nativeLabel}`"
                        :color="currentLocale === locale.value ? 'primary' : 'grey-6'"
                        :flat="currentLocale !== locale.value"
                        size="md"
                        :aria-label="`${t(TRANSLATION_KEYS.SETTINGS.LANGUAGE)}: ${locale.label}`"
                        @click="handleLanguageChange(locale.value)"
                        class="language-option-button"
                      />
                    </div>
                  </div>
                </div>

                <q-separator class="q-my-md" />

                <div class="text-body2 text-grey-6">
                  {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.LANGUAGE_DESCRIPTION) }}
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Theme Settings -->
          <q-expansion-item v-model="settingsExpanded.theme" icon="mdi-palette" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.THEME_SETTINGS)"
            default-opened class="q-mb-md">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.THEME_SETTINGS) }}</div>

                <q-option-group :model-value="currentTheme" @update:model-value="handleThemeChange" :options="[
                  { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.LIGHT_THEME), value: 'light', icon: 'mdi-brightness-7' },
                  { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.DARK_THEME), value: 'dark', icon: 'mdi-brightness-4' },
                  { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.AUTO_THEME), value: 'auto', icon: 'mdi-brightness-auto' }
                ]" color="primary" type="radio" />

                <q-separator class="q-my-md" />

                <div class="text-body2 text-grey-6">
                  {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.THEME_DESCRIPTION) }}: <strong>{{ isDarkMode ? t(TRANSLATION_KEYS.SETTINGS_PAGE.DARK_THEME) : t(TRANSLATION_KEYS.SETTINGS_PAGE.LIGHT_THEME) }}</strong>
                  <q-chip :color="isDarkMode ? 'deep-purple' : 'amber'"
                    :icon="isDarkMode ? 'mdi-brightness-4' : 'mdi-brightness-7'" size="sm" class="q-ml-sm">
                    {{ currentTheme === 'auto' ? t(TRANSLATION_KEYS.SETTINGS_PAGE.AUTO_THEME) : (isDarkMode ? t(TRANSLATION_KEYS.SETTINGS_PAGE.DARK_THEME) : t(TRANSLATION_KEYS.SETTINGS_PAGE.LIGHT_THEME)) }}
                  </q-chip>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Notification Settings -->
          <q-expansion-item v-model="settingsExpanded.notifications" icon="mdi-bell" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.NOTIFICATION_SETTINGS)"
            class="q-mb-md">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.NOTIFICATION_SETTINGS) }}</div>

                <div class="column ">
                  <q-toggle :model-value="userSettings.notificationSettings.value.browser"
                    @update:model-value="(val) => handleNotificationUpdate('browser', val)"
                    :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.BROWSER_NOTIFICATIONS)" color="primary" />

                  <q-toggle :model-value="userSettings.notificationSettings.value.email"
                    @update:model-value="(val) => handleNotificationUpdate('email', val)" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.EMAIL_NOTIFICATIONS)"
                    color="primary" />

                  <q-toggle :model-value="userSettings.notificationSettings.value.issues"
                    @update:model-value="(val) => handleNotificationUpdate('issues', val)" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.NEW_ISSUE_ALERTS)"
                    color="primary" />

                  <q-toggle :model-value="userSettings.notificationSettings.value.events"
                    @update:model-value="(val) => handleNotificationUpdate('events', val)" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.EVENT_REMINDERS)"
                    color="primary" />
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Display Settings -->
          <q-expansion-item v-model="settingsExpanded.display" icon="mdi-monitor" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.DISPLAY_BEHAVIOR)"
            class="q-mb-md">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.DISPLAY_SETTINGS) }}</div>

                <div class="column ">
                  <q-toggle :model-value="userSettings.displaySettings.value.compactMode"
                    @update:model-value="(val) => handleDisplayUpdate('compactMode', val)" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.COMPACT_MODE)"
                    color="primary" />
                  <div class="text-caption text-grey-6 q-ml-md">
                    {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.COMPACT_MODE_DESCRIPTION) }}
                  </div>

                  <q-toggle :model-value="userSettings.displaySettings.value.animationsEnabled"
                    @update:model-value="(val) => handleDisplayUpdate('animationsEnabled', val)"
                    :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.ENABLE_ANIMATIONS)" color="primary" />
                  <div class="text-caption text-grey-6 q-ml-md">
                    {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.ENABLE_ANIMATIONS_DESCRIPTION) }}
                  </div>

                  <q-toggle :model-value="userSettings.displaySettings.value.autoplayVideos"
                    @update:model-value="(val) => handleDisplayUpdate('autoplayVideos', val)" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.AUTOPLAY_VIDEOS)"
                    color="primary" />
                  <div class="text-caption text-grey-6 q-ml-md">
                    {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.AUTOPLAY_VIDEOS_DESCRIPTION) }}
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Time Format Settings -->
          <q-expansion-item v-model="settingsExpanded.timeFormat" icon="mdi-clock-outline" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.TIME_FORMAT_SETTINGS)" class="q-mb-md">
            <q-card>
              <q-card-section>
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
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- PDF Settings -->
          <q-expansion-item v-model="settingsExpanded.pdf" icon="mdi-file-pdf-box" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.PDF_VIEWER)" class="q-mb-md">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.PDF_VIEWER_PREFERENCES) }}</div>

                <div class="column ">
                  <div>
                    <div class="text-subtitle2 q-mb-sm">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.DEFAULT_ZOOM_LEVEL) }}</div>
                    <q-slider :model-value="userSettings.pdfSettings.value.defaultZoom"
                      @update:model-value="(val) => handlePdfUpdate('defaultZoom', val)" :min="0.5" :max="3.0"
                      :step="0.1" label color="primary" />
                    <div class="text-caption text-grey-6">
                      {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.CURRENT) }}: {{ (userSettings.pdfSettings.value.defaultZoom * 100).toFixed(0) }}%
                    </div>
                  </div>

                  <div>
                    <div class="text-subtitle2 q-mb-sm">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.PAGE_LAYOUT) }}</div>
                    <q-option-group :model-value="userSettings.pdfSettings.value.pageLayout"
                      @update:model-value="(val) => handlePdfUpdate('pageLayout', val)" :options="[
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.SINGLE_PAGE), value: 'single' },
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.FACING_PAGES), value: 'facing' },
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.COVER_PAGE), value: 'cover' }
                      ]" color="primary" type="radio" inline />
                  </div>

                  <div>
                    <div class="text-subtitle2 q-mb-sm">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.THUMBNAIL_SIZE) }}</div>
                    <q-option-group :model-value="userSettings.pdfSettings.value.thumbnailSize"
                      @update:model-value="(val) => handlePdfUpdate('thumbnailSize', val)" :options="[
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.SMALL), value: 'small' },
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.MEDIUM), value: 'medium' },
                        { label: t(TRANSLATION_KEYS.SETTINGS_PAGE.LARGE), value: 'large' }
                      ]" color="primary" type="radio" inline />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Settings Management -->
          <q-card class="q-mt-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ t(TRANSLATION_KEYS.SETTINGS_PAGE.SETTINGS_MANAGEMENT) }}</div>

              <div class="row ">
                <q-btn @click="exportSettings" icon="mdi-export" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.EXPORT_SETTINGS)" color="primary" outline />

                <q-btn @click="importSettings" icon="mdi-import" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.IMPORT_SETTINGS)" color="primary" outline />

                <q-btn @click="resetAllSettings" icon="mdi-restore" :label="t(TRANSLATION_KEYS.SETTINGS_PAGE.RESET_TO_DEFAULTS)" color="negative"
                  outline />
              </div>

              <div class="text-body2 text-grey-6 q-mt-md">
                {{ t(TRANSLATION_KEYS.SETTINGS_PAGE.EXPORT_DESCRIPTION) }}
              </div>
            </q-card-section>
          </q-card>

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


<style lang="scss" scoped>
.setting-item {
  padding: 8px 0;

  .text-subtitle1 {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .text-body2 {
    line-height: 1.4;
  }
}

.language-option-button {
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

@media (max-width: 599px) {
  .setting-item .row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .col-auto {
      width: 100%;
    }
  }

  .language-option-button {
    min-width: 120px;
  }
}
</style>
