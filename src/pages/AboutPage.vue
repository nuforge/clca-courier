<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

function volunteer() {
  $q.notify({
    message: 'Thank you for your interest!',
    caption: 'Volunteer registration coming soon.',
    icon: 'mdi-heart',
    color: 'positive'
  })
}

function contribute() {
  void router.push('/contribute')
}
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <q-card flat class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-information" class="q-mr-sm" />
                About The Courier
              </div>
              <p class="text-body1">
                The Courier is the official newsletter of the Conashaugh Lakes community,
                dedicated to keeping residents informed and connected.
              </p>
            </q-card-section>
          </q-card>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card flat>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-target" class="q-mr-sm" />
                    Our Mission
                  </div>
                  <p class="text-body2">
                    To foster community spirit and keep residents informed about important
                    news, events, and updates that affect our beautiful lakeside community.
                    We strive to be the central hub for community communication and engagement.
                  </p>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card flat>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-history" class="q-mr-sm" />
                    Our History
                  </div>
                  <p class="text-body2">
                    Founded in 1995, The Courier has been serving the Conashaugh Lakes
                    community for over 25 years. What started as a simple newsletter has
                    evolved into a comprehensive community communication platform.
                  </p>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12">
              <q-card flat>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-eye" class="q-mr-sm" />
                    What We Cover
                  </div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-item>
                        <q-item-section side>
                          <q-icon name="mdi-calendar" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">Community
                            Events</q-item-label>
                          <q-item-label caption>Meetings, activities, and
                            celebrations</q-item-label>
                        </q-item-section>
                      </q-item>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-item>
                        <q-item-section side>
                          <q-icon name="mdi-newspaper" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">Local News</q-item-label>
                          <q-item-label caption>Updates and announcements</q-item-label>
                        </q-item-section>
                      </q-item>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-item>
                        <q-item-section side>
                          <q-icon name="mdi-nature" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">Lake
                            Activities</q-item-label>
                          <q-item-label caption>Recreation and conservation</q-item-label>
                        </q-item-section>
                      </q-item>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-item>
                        <q-item-section side>
                          <q-icon name="mdi-account-group" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">Resident
                            Spotlights</q-item-label>
                          <q-item-label caption>Community member features</q-item-label>
                        </q-item-section>
                      </q-item>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-card flat class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">Community Statistics</div>
              <div class="row q-col-gutter-md text-center">
                <div class="col-12 col-sm-6 col-md-3">
                  <q-card flat class="q-pa-md">
                    <q-icon name="mdi-home-group" size="2em" color="primary" />
                    <div class="text-h5 text-weight-bold q-mt-sm">450+</div>
                    <div class="text-caption">Households</div>
                  </q-card>
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-card flat class="q-pa-md">
                    <q-icon name="mdi-water" size="2em" color="blue" />
                    <div class="text-h5 text-weight-bold q-mt-sm">3</div>
                    <div class="text-caption">Beautiful Lakes</div>
                  </q-card>
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-card flat class="q-pa-md">
                    <q-icon name="mdi-calendar-multiple" size="2em" color="green" />
                    <div class="text-h5 text-weight-bold q-mt-sm">12</div>
                    <div class="text-caption">Issues Per Year</div>
                  </q-card>
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-card flat class="q-pa-md">
                    <q-icon name="mdi-clock" size="2em" color="orange" />
                    <div class="text-h5 text-weight-bold q-mt-sm">29</div>
                    <div class="text-caption">Years Publishing</div>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">Get Involved</div>
              <p class="text-body2 q-mb-md">
                The Courier is made possible by dedicated volunteers from our community.
                We're always looking for new contributors and helpers.
              </p>
              <div class="text-center">
                <q-btn color="primary" icon="mdi-hand-heart" label="Volunteer with Us" @click="volunteer"
                  class="q-mr-sm" />
                <q-btn color="secondary" icon="mdi-pencil" label="Contribute Content" @click="contribute" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>
