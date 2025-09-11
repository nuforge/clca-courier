<script setup lang="ts">
import { useTheme } from '../composables/useTheme';
import { useContentStore } from '../stores/content-store';
import { getPublicPath } from '../utils/path-utils';

const { cardClasses, textClasses } = useTheme();
const contentStore = useContentStore();

// Google Drive image downloaded locally - WORKING SOLUTION!
const heroBackgroundImage = getPublicPath('images/hero-background.jpg');
// Original Google Drive URL (CORS blocked): 'https://drive.google.com/file/d/14M00bRp3NxPG2d1Itj-E9WAmmB_C6vWh/view?usp=sharing'

// Hero actions
const heroActions = [
  {
    label: 'Latest News',
    icon: 'mdi-newspaper',
    color: 'primary',
    to: '/community',
    size: 'lg'
  },
  {
    label: 'Contribute',
    icon: 'mdi-pencil',
    color: 'secondary',
    to: '/contribute',
    outline: false,
    size: 'lg'
  }
];

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
    link: '/community'
  },
  {
    title: 'Classifieds & Ads',
    description: 'Browse community marketplace and services',
    icon: 'mdi-bulletin-board',
    color: 'secondary',
    link: '/community'
  },
  {
    title: 'Community Calendar',
    description: 'Stay updated on community events and activities',
    icon: 'mdi-calendar',
    color: 'yellow-9',
    link: '/calendar'
  },
  {
    title: 'Issue Archive',
    description: 'Access past issues and historical content',
    icon: 'mdi-bookshelf',
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
    title: 'About & Contact',
    description: 'Learn about our mission and get in touch',
    icon: 'mdi-comment-question',
    color: 'info',
    link: '/about'
  }
];
</script>

<template>
  <q-page>
    <!-- Hero Section with Direct Background Image -->
    <div class="hero-section" :style="{
      height: '70vh',
      minHeight: '500px',
      backgroundImage: `url(${heroBackgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }">
      <!-- Overlay -->
      <div class="absolute-full" style="background-color: rgba(0, 0, 0, 0.4);"></div>

      <!-- Content -->
      <div class="relative-position text-center text-white q-pa-lg">
        <h1 class="text-h2 text-weight-bold q-mb-md">Welcome to The Courier</h1>
        <p class="text-h5 text-weight-light q-mb-lg">Your source for Conashaugh Lakes community news and updates</p>

        <!-- Actions -->
        <div class="">
          <q-btn v-for="action in heroActions" :key="action.label" :label="action.label" :icon="action.icon"
            :color="action.color" :to="action.to" size="lg" unelevated class="q-px-lg" />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="q-pa-md">
      <!-- Quick Links Section -->
      <div class="row justify-center q-mb-xl">
        <div class="col-12 col-md-10 col-lg-8">
          <div class="text-h5 text-center q-mb-lg">Explore Our Sections</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4" v-for="item in quickLinks" :key="item.title">
              <q-card :class="cardClasses" class="cursor-pointer full-height" @click="$router.push(item.link)" v-ripple>
                <q-card-section class="text-center q-pa-lg">
                  <q-icon :name="item.icon" size="3em" :color="item.color" class="q-mb-md" />
                  <div class="text-h6 q-mb-sm">{{ item.title }}</div>
                  <div class="text-body2" :class="textClasses.secondary">{{ item.description }}</div>
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
              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-sm">
                    <q-icon name="mdi-calendar" class="q-mr-sm" />
                    Upcoming Events
                  </div>
                  <q-list separator>
                    <q-item v-for="event in contentStore.events.slice(0, 2)" :key="event.id">
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ event.title }}</q-item-label>
                        <q-item-label caption>{{
                          event.features['feat:date']?.start ?
                          new Date(event.features['feat:date'].start.toDate()).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Date TBD'
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div class="text-center q-mt-md">
                    <q-btn color="primary" label="View All Events" size="sm" outline to="/community" />
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card :class="cardClasses">
                <q-card-section>
                  <div class="text-h6 q-mb-sm">
                    <q-icon name="mdi-bulletin-board" class="q-mr-sm" />
                    Recent Classifieds
                  </div>
                  <q-list separator>
                    <q-item v-for="classified in contentStore.classifieds.slice(0, 2)" :key="classified.id">
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ classified.title }}</q-item-label>
                        <q-item-label caption>{{ classified.description.length > 50 ?
                          classified.description.substring(0, 50) + '...' : classified.description }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div class="text-center q-mt-md">
                    <q-btn color="secondary" label="Browse Classifieds" size="sm" outline to="/community?type=classifieds" />
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
          <q-card flat :class="cardClasses">
            <q-card-section>
              <div class="text-h6 text-center q-mb-md">Our Community</div>
              <div class="row text-center">
                <div class="col-3">
                  <div class="text-h4 text-primary">500+</div>
                  <div class="text-caption">Households</div>
                </div>
                <div class="col-3">
                  <div class="text-h4 text-blue">16</div>
                  <div class="text-caption">Lakes</div>
                </div>
                <div class="col-3">
                  <div class="text-h4 text-green">25+</div>
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
