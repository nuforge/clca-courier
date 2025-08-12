<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Hero Section -->
      <div class="row justify-center q-mb-xl">
        <div class="col-12 col-md-10 col-lg-8 text-center">
          <q-img src="/courier-logo.svg" style="height: 120px; max-width: 300px" class="q-mb-md" fit="contain" />
          <div class="text-h3 text-weight-light q-mb-md">
            Welcome to The Courier
          </div>
          <div class="text-h6 text-grey-7 q-mb-lg">
            Your source for Conashaugh Lakes community news and updates
          </div>
          <q-btn color="primary" size="lg" icon="mdi-newspaper" label="Latest News" to="/news" class="q-mr-sm" />
          <q-btn color="secondary" size="lg" icon="mdi-pencil" label="Contribute" to="/contribute" outline />
        </div>
      </div>

      <!-- Quick Links Section -->
      <div class="row justify-center q-mb-xl">
        <div class="col-12 col-md-10 col-lg-8">
          <div class="text-h5 text-center q-mb-lg">Explore Our Sections</div>
          <div class="row q-gutter-md">
            <div class="col-12 col-sm-6 col-md-4" v-for="item in quickLinks" :key="item.title">
              <q-card flat bordered class="cursor-pointer full-height" @click="$router.push(item.link)" v-ripple>
                <q-card-section class="text-center q-pa-lg">
                  <q-icon :name="item.icon" size="3em" :color="item.color" class="q-mb-md" />
                  <div class="text-h6 q-mb-sm">{{ item.title }}</div>
                  <div class="text-body2 text-grey-7">{{ item.description }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <!-- Featured Content Section -->
      <div class="row justify-center q-mb-xl">
        <div class="col-12 col-md-10 col-lg-8">
          <div class="text-h5 text-center q-mb-lg">Latest Updates</div>
          <div class="row q-gutter-md">
            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-h6 q-mb-sm">
                    <q-icon name="mdi-calendar" class="q-mr-sm" />
                    Upcoming Events
                  </div>
                  <q-list separator>
                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Community Meeting</q-item-label>
                        <q-item-label caption>August 15, 2025 • 7:00 PM</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Lake Cleanup Day</q-item-label>
                        <q-item-label caption>August 20, 2025 • 9:00 AM</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div class="text-center q-mt-md">
                    <q-btn color="primary" label="View All Events" size="sm" outline to="/news" />
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-h6 q-mb-sm">
                    <q-icon name="mdi-bulletin-board" class="q-mr-sm" />
                    Recent Classifieds
                  </div>
                  <q-list separator>
                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Kayak for Sale</q-item-label>
                        <q-item-label caption>Almost new • $350</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">Lawn Care Services</q-item-label>
                        <q-item-label caption>Professional service available</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div class="text-center q-mt-md">
                    <q-btn color="secondary" label="Browse Classifieds" size="sm" outline to="/classifieds" />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <!-- Community Stats -->
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 text-center q-mb-md">Our Community</div>
              <div class="row text-center">
                <div class="col-3">
                  <div class="text-h4 text-primary">450+</div>
                  <div class="text-caption">Households</div>
                </div>
                <div class="col-3">
                  <div class="text-h4 text-blue">3</div>
                  <div class="text-caption">Lakes</div>
                </div>
                <div class="col-3">
                  <div class="text-h4 text-green">29</div>
                  <div class="text-caption">Years</div>
                </div>
                <div class="col-3">
                  <div class="text-h4 text-orange">12</div>
                  <div class="text-caption">Issues/Year</div>
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
interface QuickLink {
  title: string;
  description: string;
  icon: string;
  color: string;
  link: string;
}

const quickLinks: QuickLink[] = [
  {
    title: 'News & Updates',
    description: 'Stay informed with community news and announcements',
    icon: 'mdi-newspaper',
    color: 'primary',
    link: '/news'
  },
  {
    title: 'Classifieds & Ads',
    description: 'Browse community marketplace and services',
    icon: 'mdi-bulletin-board',
    color: 'secondary',
    link: '/classifieds'
  },
  {
    title: 'Issue Archive',
    description: 'Access past issues and historical content',
    icon: 'mdi-archive',
    color: 'accent',
    link: '/archive'
  },
  {
    title: 'Contribute',
    description: 'Share your stories and help build our community',
    icon: 'mdi-pencil',
    color: 'positive',
    link: '/contribute'
  },
  {
    title: 'Contact Us',
    description: 'Get in touch with our editorial team',
    icon: 'mdi-phone',
    color: 'info',
    link: '/contact'
  },
  {
    title: 'About',
    description: 'Learn more about The Courier and our mission',
    icon: 'mdi-information',
    color: 'warning',
    link: '/about'
  }
];
</script>
