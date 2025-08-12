<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-newspaper" class="q-mr-sm" />
                News & Updates
              </div>
              <p class="text-body1">
                Stay informed with the latest news and updates from the Conashaugh Lakes community.
                This section will feature important announcements, community events, and relevant news
                that affects our residents.
              </p>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-sm">Recent Updates</div>
              <q-separator class="q-mb-md" />

              <q-list separator>
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">Community Meeting Notice</q-item-label>
                    <q-item-label caption>August 10, 2025</q-item-label>
                    <q-item-label class="q-mt-sm">
                      The monthly community meeting will be held on August 15th at 7 PM in the community center.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">Lake Activities Schedule</q-item-label>
                    <q-item-label caption>August 8, 2025</q-item-label>
                    <q-item-label class="q-mt-sm">
                      Summer lake activities schedule has been updated. Check the community board for details.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">Road Maintenance Update</q-item-label>
                    <q-item-label caption>August 5, 2025</q-item-label>
                    <q-item-label class="q-mt-sm">
                      Scheduled road maintenance will begin Monday, August 12th. Please plan alternative routes.
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// No additional logic needed for this page
</script>
