<script setup lang="ts">
import { ref } from 'vue';
import { useTheme } from '../composables/useTheme';
import { useUserSettings } from '../composables/useUserSettings';
import { useQuasar } from 'quasar';

// Use the enhanced user settings
const userSettings = useUserSettings();
const { isDarkMode, currentTheme, setTheme } = useTheme();
const $q = useQuasar();

// Local state for UI
const settingsExpanded = ref({
  theme: true,
  notifications: false,
  display: false,
  pdf: false,
});

// Methods
async function handleThemeChange(theme: 'light' | 'dark' | 'auto') {
  await setTheme(theme);
  $q.notify({
    message: `Theme changed to ${theme}`,
    type: 'positive',
    position: 'top',
    timeout: 2000,
  });
}

async function handleNotificationUpdate(key: string, value: boolean) {
  await userSettings.updateNotificationSettings({ [key]: value });
  $q.notify({
    message: 'Notification settings updated',
    type: 'positive',
    position: 'top',
    timeout: 2000,
  });
}

async function handleDisplayUpdate(key: string, value: boolean) {
  await userSettings.updateDisplaySettings({ [key]: value });
  $q.notify({
    message: 'Display settings updated',
    type: 'positive',
    position: 'top',
    timeout: 2000,
  });
}

async function handlePdfUpdate(key: string, value: number | string | null) {
  if (value !== null) {
    await userSettings.updatePdfSettings({ [key]: value });
    $q.notify({
      message: 'PDF settings updated',
      type: 'positive',
      position: 'top',
      timeout: 2000,
    });
  }
}

function resetAllSettings() {
  $q.dialog({
    title: 'Reset Settings',
    message: 'Are you sure you want to reset all settings to defaults? This cannot be undone.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void userSettings.resetSettings().then(() => {
      $q.notify({
        message: 'All settings have been reset to defaults',
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
            <q-icon name="mdi-account-circle" class="q-mr-sm" />
            Account Settings
          </div>

          <!-- Theme Settings -->
          <q-expansion-item v-model="settingsExpanded.theme" icon="mdi-palette" label="Theme & Appearance"
            default-opened class="q-mb-md">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">Theme Selection</div>

                <q-option-group :model-value="currentTheme" @update:model-value="handleThemeChange" :options="[
                  { label: 'Light Mode', value: 'light', icon: 'mdi-brightness-7' },
                  { label: 'Dark Mode', value: 'dark', icon: 'mdi-brightness-4' },
                  { label: 'Auto (System)', value: 'auto', icon: 'mdi-brightness-auto' }
                ]" color="primary" type="radio" />

                <q-separator class="q-my-md" />

                <div class="text-body2 text-grey-6">
                  Current mode: <strong>{{ isDarkMode ? 'Dark' : 'Light' }}</strong>
                  <q-chip :color="isDarkMode ? 'deep-purple' : 'amber'"
                    :icon="isDarkMode ? 'mdi-brightness-4' : 'mdi-brightness-7'" size="sm" class="q-ml-sm">
                    {{ currentTheme === 'auto' ? 'Auto' : (isDarkMode ? 'Dark' : 'Light') }}
                  </q-chip>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Notification Settings -->
          <q-expansion-item v-model="settingsExpanded.notifications" icon="mdi-bell" label="Notifications"
            class="q-mb-md">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">Notification Preferences</div>

                <div class="column q-gutter-md">
                  <q-toggle :model-value="userSettings.notificationSettings.value.browser"
                    @update:model-value="(val) => handleNotificationUpdate('browser', val)"
                    label="Browser Notifications" color="primary" />

                  <q-toggle :model-value="userSettings.notificationSettings.value.email"
                    @update:model-value="(val) => handleNotificationUpdate('email', val)" label="Email Notifications"
                    color="primary" />

                  <q-toggle :model-value="userSettings.notificationSettings.value.issues"
                    @update:model-value="(val) => handleNotificationUpdate('issues', val)" label="New Issue Alerts"
                    color="primary" />

                  <q-toggle :model-value="userSettings.notificationSettings.value.events"
                    @update:model-value="(val) => handleNotificationUpdate('events', val)" label="Event Reminders"
                    color="primary" />
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Display Settings -->
          <q-expansion-item v-model="settingsExpanded.display" icon="mdi-monitor" label="Display & Behavior"
            class="q-mb-md">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">Display Options</div>

                <div class="column q-gutter-md">
                  <q-toggle :model-value="userSettings.displaySettings.value.compactMode"
                    @update:model-value="(val) => handleDisplayUpdate('compactMode', val)" label="Compact Mode"
                    color="primary" />
                  <div class="text-caption text-grey-6 q-ml-md">
                    Reduces spacing and shows more content on screen
                  </div>

                  <q-toggle :model-value="userSettings.displaySettings.value.animationsEnabled"
                    @update:model-value="(val) => handleDisplayUpdate('animationsEnabled', val)"
                    label="Enable Animations" color="primary" />
                  <div class="text-caption text-grey-6 q-ml-md">
                    Turn off to improve performance on slower devices
                  </div>

                  <q-toggle :model-value="userSettings.displaySettings.value.autoplayVideos"
                    @update:model-value="(val) => handleDisplayUpdate('autoplayVideos', val)" label="Autoplay Videos"
                    color="primary" />
                  <div class="text-caption text-grey-6 q-ml-md">
                    Automatically play videos when they come into view
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- PDF Settings -->
          <q-expansion-item v-model="settingsExpanded.pdf" icon="mdi-file-pdf-box" label="PDF Viewer" class="q-mb-md">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">PDF Viewer Preferences</div>

                <div class="column q-gutter-md">
                  <div>
                    <div class="text-subtitle2 q-mb-sm">Default Zoom Level</div>
                    <q-slider :model-value="userSettings.pdfSettings.value.defaultZoom"
                      @update:model-value="(val) => handlePdfUpdate('defaultZoom', val)" :min="0.5" :max="3.0"
                      :step="0.1" label color="primary" />
                    <div class="text-caption text-grey-6">
                      Current: {{ (userSettings.pdfSettings.value.defaultZoom * 100).toFixed(0) }}%
                    </div>
                  </div>

                  <div>
                    <div class="text-subtitle2 q-mb-sm">Page Layout</div>
                    <q-option-group :model-value="userSettings.pdfSettings.value.pageLayout"
                      @update:model-value="(val) => handlePdfUpdate('pageLayout', val)" :options="[
                        { label: 'Single Page', value: 'single' },
                        { label: 'Facing Pages', value: 'facing' },
                        { label: 'Cover Page', value: 'cover' }
                      ]" color="primary" type="radio" inline />
                  </div>

                  <div>
                    <div class="text-subtitle2 q-mb-sm">Thumbnail Size</div>
                    <q-option-group :model-value="userSettings.pdfSettings.value.thumbnailSize"
                      @update:model-value="(val) => handlePdfUpdate('thumbnailSize', val)" :options="[
                        { label: 'Small', value: 'small' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Large', value: 'large' }
                      ]" color="primary" type="radio" inline />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Settings Management -->
          <q-card class="q-mt-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Settings Management</div>

              <div class="row q-gutter-md">
                <q-btn @click="exportSettings" icon="mdi-export" label="Export Settings" color="primary" outline />

                <q-btn @click="importSettings" icon="mdi-import" label="Import Settings" color="primary" outline />

                <q-btn @click="resetAllSettings" icon="mdi-restore" label="Reset to Defaults" color="negative"
                  outline />
              </div>

              <div class="text-body2 text-grey-6 q-mt-md">
                Export your settings to back them up or import settings from a backup file.
                Settings are automatically saved to your device.
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

@media (max-width: 599px) {
  .setting-item .row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .col-auto {
      width: 100%;
    }
  }
}
</style>
