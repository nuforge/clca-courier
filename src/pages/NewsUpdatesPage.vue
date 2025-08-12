<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import type { NewsItem } from '../components/models';

const siteStore = useSiteStore();
const showDialog = ref(false);
const selectedArticle = ref<NewsItem | null>(null);

// Computed property for card theme classes
const cardClasses = computed(() => {
  // Use specific classes that ensure proper theming for all child components
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
});

const greyTextClass = computed(() =>
  siteStore.isDarkMode ? 'text-grey-4' : 'text-grey-7'
); function showArticleDetail(article: NewsItem) {
  selectedArticle.value = article;
  showDialog.value = true;
}
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-newspaper" class="q-mr-sm" />
                News & Updates
              </div>
              <p class="text-body1">
                Stay informed with the latest news and updates from the Conashaugh Lakes community.
                This section features important announcements, community events, and relevant news
                that affects our residents.
              </p>
            </q-card-section>
          </q-card>

          <!-- Featured News -->
          <div v-if="siteStore.featuredNews.length > 0">
            <div class="text-h5 q-mb-md">Featured News</div>
            <div class="row q-col-gutter-md q-mb-xl">
              <div class="col-12 col-md-6" v-for="article in siteStore.featuredNews" :key="article.id">
                <q-card :class="cardClasses" class="full-height">
                  <q-card-section>
                    <div class="text-overline text-primary">{{ article.category.toUpperCase() }}</div>
                    <div class="text-h6 q-mb-sm">{{ article.title }}</div>
                    <div class="text-body2 q-mb-md" :class="greyTextClass">{{ article.summary }}</div>
                    <div class="text-caption" :class="greyTextClass">
                      By {{ article.author }} • {{ new Date(article.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) }}
                    </div>
                  </q-card-section>
                  <q-card-actions>
                    <q-btn flat color="primary" label="Read More" @click="showArticleDetail(article)" />
                  </q-card-actions>
                </q-card>
              </div>
            </div>
          </div>

          <!-- All News -->
          <div class="text-h5 q-mb-md">All News & Updates</div>
          <q-card :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <q-list separator>
                <q-item v-for="article in siteStore.newsItems" :key="article.id" clickable
                  @click="showArticleDetail(article)">
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ article.title }}</q-item-label>
                    <q-item-label caption>
                      {{ article.category.toUpperCase() }} •
                      {{ new Date(article.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) }} •
                      By {{ article.author }}
                    </q-item-label>
                    <q-item-label class="q-mt-sm text-body2">
                      {{ article.summary }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="chevron_right" color="grey" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Article Detail Dialog -->
    <q-dialog v-model="showDialog" position="right" full-height>
      <q-card :class="cardClasses" style="width: 500px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedArticle?.title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedArticle">
          <div class="text-overline text-primary q-mb-sm">{{ selectedArticle.category.toUpperCase() }}
          </div>
          <div class="text-caption q-mb-md" :class="greyTextClass">
            By {{ selectedArticle.author }} • {{ new
              Date(selectedArticle.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) }}
          </div>
          <div class="text-body1" style="white-space: pre-line;">{{ selectedArticle.content }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
