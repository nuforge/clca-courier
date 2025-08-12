<script setup lang="ts">
import { useTheme } from '../composables/useTheme';

// Use the theme composable
const { isDarkMode, toggleDarkMode } = useTheme();
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <div class="text-h4 q-mb-md">
            <q-icon name="mdi-account-circle" class="q-mr-sm" />
            Account
          </div>
          <q-card class="q-mb-md">
            <q-card-section>
              <div class="text-h6">User Profile</div>
              <div class="text-body1 q-mt-md">
                Account settings and preferences will be available here.
              </div>
            </q-card-section>
          </q-card>

          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">Settings</div>

              <!-- Theme Toggle Section -->
              <div class="setting-item q-mb-md">
                <div class="row items-center justify-between">
                  <div class="col">
                    <div class="text-subtitle1">Theme</div>
                    <div class="text-body2 text-grey-6">
                      Choose between light and dark mode
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-btn :icon="isDarkMode ? 'mdi-brightness-7' : 'mdi-brightness-4'"
                      :label="isDarkMode ? 'Light Mode' : 'Dark Mode'" @click="toggleDarkMode" unelevated
                      :color="isDarkMode ? 'orange' : 'primary'" class="q-px-md">
                      <q-tooltip>
                        Switch to {{ isDarkMode ? 'light' : 'dark' }} mode
                      </q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="text-body1">
                Additional account configuration options will be added in the future.
              </div>
            </q-card-section>
          </q-card>
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
