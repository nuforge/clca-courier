<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <!-- Header -->
          <q-card flat class="q-mb-lg">
            <q-card-section>
              <div class="text-h4 text-center q-mb-md">
                <q-icon name="mdi-shield-crown" class="q-mr-sm" />
                Admin Dashboard
              </div>
              <p class="text-center text-body1">
                Administrative tools and content management for CLCA Courier
              </p>
            </q-card-section>
          </q-card>

          <!-- Main Admin Sections -->
          <div class="row">
            <!-- Newsletter Management -->
            <div class="col-12 col-md-6 q-pa-md">
              <q-card>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-newspaper" class="q-mr-sm" />
                    Newsletter Management
                  </div>
                  <p class="text-body2 q-mb-md">
                    Manage newsletter archive, upload new issues, and configure display settings.
                  </p>

                  <div class="q-gutter-sm">
                    <q-btn flat color="primary" label="Firebase Demo" icon="mdi-firebase" to="/admin/firebase-demo"
                      class="full-width" />
                    <q-btn flat color="secondary" label="Newsletter Archive" icon="mdi-archive" to="/archive"
                      class="full-width" />
                    <q-btn flat color="accent" label="PDF Text Extraction" icon="mdi-file-document-outline"
                      to="/admin/pdf-extraction" class="full-width" />
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Content Management -->
            <div class="col-12 col-md-6 q-pa-md">
              <q-card>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-file-document-multiple" class="q-mr-sm" />
                    Content Management
                  </div>
                  <p class="text-body2 q-mb-md">
                    Manage submissions, moderate content, and handle user contributions.
                  </p>

                  <div class="q-gutter-sm">
                    <q-btn flat color="primary" label="All Submissions" icon="mdi-inbox-multiple" to="/contribute"
                      class="full-width" />
                    <q-btn flat color="secondary" label="News Updates" icon="mdi-newspaper-variant" to="/news"
                      class="full-width" />
                    <q-btn flat color="accent" label="Classifieds" icon="mdi-bulletin-board" to="/classifieds"
                      class="full-width" />
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- System Tools -->
            <div class="col-12 col-md-6 q-pa-md">
              <q-card>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-tools" class="q-mr-sm" />
                    System Tools
                  </div>
                  <p class="text-body2 q-mb-md">
                    Development tools, testing utilities, and system diagnostics.
                  </p>

                  <div class="q-gutter-sm">
                    <q-btn flat color="primary" label="Lightweight Test" icon="mdi-test-tube" to="/admin/test"
                      class="full-width" />
                    <q-btn flat color="secondary" label="Interactive Map" icon="mdi-map" to="/map" class="full-width" />
                    <q-btn flat color="warning" label="Legacy Archive" icon="mdi-archive-outline" to="/archive/legacy"
                      class="full-width" />
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- User Management -->
            <div class="col-12 col-md-6 q-pa-md">
              <q-card>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-account-group" class="q-mr-sm" />
                    User Management
                  </div>
                  <p class="text-body2 q-mb-md">
                    Manage user accounts, permissions, and community features.
                  </p>

                  <div class="q-gutter-sm">
                    <q-btn flat color="primary" label="Account Settings" icon="mdi-account-cog" to="/account"
                      class="full-width" />
                    <q-btn flat color="secondary" label="Contact Management" icon="mdi-contacts" to="/contact"
                      class="full-width" />
                    <q-btn flat color="accent" label="About Page" icon="mdi-information" to="/about"
                      class="full-width" />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Quick Actions -->
          <q-card class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-lightning-bolt" class="q-mr-sm" />
                Quick Actions
              </div>

              <div class="row">
                <div class="col-12 col-sm-4 q-pa-sm">
                  <q-btn color="positive" icon="mdi-home" label="View Site" to="/" class="full-width" />
                </div>
                <div class="col-12 col-sm-4 q-pa-sm">
                  <q-btn color="info" icon="mdi-refresh" label="Refresh Cache" @click="refreshCache"
                    class="full-width" />
                </div>
                <div class="col-12 col-sm-4 q-pa-sm">
                  <q-btn color="warning" icon="mdi-backup-restore" label="Backup Data" @click="backupData"
                    class="full-width" />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- System Status -->
          <q-card class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-chart-line" class="q-mr-sm" />
                System Status
              </div>

              <div class="row">
                <div class="col-12 col-md-4 q-pa-sm">
                  <q-linear-progress :value="0.8" color="positive" class="q-mb-sm" />
                  <div class="text-caption">Storage: 80% used</div>
                </div>
                <div class="col-12 col-md-4 q-pa-sm">
                  <q-linear-progress :value="0.3" color="info" class="q-mb-sm" />
                  <div class="text-caption">Memory: 30% used</div>
                </div>
                <div class="col-12 col-md-4 q-pa-sm">
                  <q-linear-progress :value="0.95" color="positive" class="q-mb-sm" />
                  <div class="text-caption">Uptime: 95%</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';

const $q = useQuasar();

function refreshCache() {
  $q.notify({
    type: 'info',
    message: 'Cache refresh initiated...',
    position: 'top',
  });

  // Simulate cache refresh
  setTimeout(() => {
    $q.notify({
      type: 'positive',
      message: 'Cache refreshed successfully!',
      position: 'top',
    });
  }, 2000);
}

function backupData() {
  $q.notify({
    type: 'info',
    message: 'Data backup initiated...',
    position: 'top',
  });

  // Simulate backup
  setTimeout(() => {
    $q.notify({
      type: 'positive',
      message: 'Data backup completed!',
      position: 'top',
    });
  }, 3000);
}
</script>

<style scoped>
.q-card {
  transition: all 0.3s ease;
}

.q-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
</style>
