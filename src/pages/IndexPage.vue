<script setup lang="ts">
import { useSiteStore } from '../stores/site-store-simple';

const siteStore = useSiteStore();

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
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4" v-for="item in quickLinks" :key="item.title">
              <q-card flat class="cursor-pointer full-height" @click="$router.push(item.link)" v-ripple>
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
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card flat>
                <q-card-section>
                  <div class="text-h6 q-mb-sm">
                    <q-icon name="mdi-calendar" class="q-mr-sm" />
                    Upcoming Events
                  </div>
                  <q-list separator>
                    <q-item v-for="event in siteStore.upcomingEvents.slice(0, 2)" :key="event.id">
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ event.title }}</q-item-label>
                        <q-item-label caption>{{ new Date(event.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) }} • {{ event.time }}</q-item-label>
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
              <q-card flat>
                <q-card-section>
                  <div class="text-h6 q-mb-sm">
                    <q-icon name="mdi-bulletin-board" class="q-mr-sm" />
                    Recent Classifieds
                  </div>
                  <q-list separator>
                    <q-item v-for="classified in siteStore.recentClassifieds.slice(0, 2)" :key="classified.id">
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ classified.title }}</q-item-label>
                        <q-item-label caption>{{ classified.description.length > 50 ?
                          classified.description.substring(0, 50) + '...' : classified.description }} {{
                            classified.price ? '• ' + classified.price : '' }}</q-item-label>
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
          <q-card flat>
            <q-card-section>
              <div class="text-h6 text-center q-mb-md">Our Community</div>
              <div class="row text-center">
                <div class="col-3">
                  <div class="text-h4 text-primary">{{ siteStore.communityStats.households }}+</div>
                  <div class="text-caption">Households</div>
                </div>
                <div class="col-3">
                  <div class="text-h4 text-blue">{{ siteStore.communityStats.lakes }}</div>
                  <div class="text-caption">Lakes</div>
                </div>
                <div class="col-3">
                  <div class="text-h4 text-green">{{ siteStore.communityStats.yearsPublished }}</div>
                  <div class="text-caption">Years</div>
                </div>
                <div class="col-3">
                  <div class="text-h4 text-orange">{{ siteStore.communityStats.issuesPerYear }}</div>
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
