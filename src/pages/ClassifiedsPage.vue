<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSiteStore } from '../stores/site-store-simple'

const $q = useQuasar()
const siteStore = useSiteStore()

// Computed property for card theme classes
const cardClasses = computed(() => {
  // Use specific classes that ensure proper theming for all child components
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
});
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-bulletin-board" class="q-mr-sm" />
                Classifieds & Ads
              </div>
              <p class="text-body1">
                Browse community classifieds and advertisements. Find items for sale, services offered,
                and community announcements from your neighbors.
              </p>
            </q-card-section>
          </q-card>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-tag" class="q-mr-sm" />
                    For Sale
                  </div>

                  <q-list separator>
                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Kayak - Almost New</q-item-label>
                        <q-item-label caption>$350 - Contact: (570) 555-0123</q-item-label>
                        <q-item-label class="q-mt-sm">
                          Barely used single kayak, perfect for lake activities. Includes paddle and life vest.
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Lawn Mower</q-item-label>
                        <q-item-label caption>$200 - Contact: (570) 555-0156</q-item-label>
                        <q-item-label class="q-mt-sm">
                          Self-propelled lawn mower in good condition. Recently serviced.
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-tools" class="q-mr-sm" />
                    Services
                  </div>

                  <q-list separator>
                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Lawn Care Services</q-item-label>
                        <q-item-label caption>Contact: (570) 555-0189</q-item-label>
                        <q-item-label class="q-mt-sm">
                          Professional lawn care and landscaping services. Free estimates.
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Pet Sitting</q-item-label>
                        <q-item-label caption>Contact: (570) 555-0198</q-item-label>
                        <q-item-label class="q-mt-sm">
                          Reliable pet sitting services while you're away. References available.
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div class="q-mt-lg text-center">
            <q-btn color="primary" icon="mdi-plus" label="Post New Ad" @click="$q.notify('Feature coming soon!')" />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>
