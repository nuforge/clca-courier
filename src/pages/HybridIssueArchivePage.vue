<template>
    <q-page padding>
        <div class="q-pa-md">
            <div class="row justify-center">
                <div class="col-12 col-md-10 col-lg-8">
                    <!-- Header Card -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <div class="text-h4 q-mb-md">
                                <q-icon name="mdi-bookshelf" class="q-mr-sm" />
                                Newsletter Archive
                            </div>
                            <p class="text-body1">
                                Browse through past issues of The Courier with our hybrid hosting approach.
                                Enjoy fast local access for viewing and high-quality downloads from our archive.
                            </p>

                            <!-- Service Statistics -->
                            <div v-if="hybridNewsletters.serviceStats.value" class="q-mt-md">
                                <div class="row q-gutter-md text-center">
                                    <div class="col">
                                        <div class="text-h6 text-primary">{{
                                            hybridNewsletters.serviceStats.value.totalNewsletters }}</div>
                                        <div class="text-caption">Total Issues</div>
                                    </div>
                                    <div class="col">
                                        <div class="text-h6 text-positive">{{
                                            hybridNewsletters.serviceStats.value.sourceCounts.hybrid }}</div>
                                        <div class="text-caption">Hybrid Sources</div>
                                    </div>
                                    <div class="col">
                                        <div class="text-h6 text-info">{{
                                            hybridNewsletters.serviceStats.value.sourceCounts.local }}</div>
                                        <div class="text-caption">Local Only</div>
                                    </div>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Search and Filters Card -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <!-- Search Toggle -->
                            <div class="row items-center q-mb-md">
                                <q-btn-toggle v-model="useAdvancedSearch" :options="[
                                    { label: 'Simple Search', value: false },
                                    { label: 'Advanced Search', value: true }
                                ]" color="primary" toggle-color="secondary" class="q-mr-md" />

                                <q-space />

                                <q-btn flat icon="refresh" label="Refresh" @click="hybridNewsletters.refresh"
                                    :loading="hybridNewsletters.loading.value" />
                            </div>

                            <!-- Advanced Search Component -->
                            <div v-if="useAdvancedSearch">
                                <div class="text-body2 text-grey-6 q-mb-md">
                                    Advanced search is available but requires conversion of newsletter format.
                                    Using simple search for now.
                                </div>
                                <!-- TODO: Create newsletter-compatible advanced search -->
                            </div>

                            <!-- Simple Search -->
                            <div v-else class="row q-gutter-md items-end">
                                <div class="col">
                                    <q-input v-model="searchQuery" placeholder="Search newsletters..." outlined
                                        clearable @clear="searchQuery = ''">
                                        <template v-slot:prepend>
                                            <q-icon name="search" />
                                        </template>
                                    </q-input>
                                </div>

                                <div class="col-auto">
                                    <q-select v-model="sortBy" :options="sortOptions" label="Sort by" outlined
                                        map-options emit-value style="min-width: 120px" />
                                </div>

                                <div class="col-auto">
                                    <q-btn-toggle v-model="sortOrder" :options="[
                                        { icon: 'keyboard_arrow_up', value: 'asc', slot: 'asc' },
                                        { icon: 'keyboard_arrow_down', value: 'desc', slot: 'desc' }
                                    ]" color="primary" />
                                </div>

                                <div class="col-auto">
                                    <q-btn-toggle v-model="viewMode" :options="[
                                        { icon: 'view_list', value: 'list' },
                                        { icon: 'view_module', value: 'grid' },
                                        { icon: 'calendar_view_month', value: 'year' }
                                    ]" color="primary" />
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Loading State -->
                    <div v-if="hybridNewsletters.loading.value" class="text-center q-pa-xl">
                        <q-spinner-grid color="primary" size="3em" />
                        <div class="q-mt-md text-body1">Loading newsletters...</div>
                    </div>

                    <!-- Error State -->
                    <q-banner v-else-if="hybridNewsletters.error.value" class="bg-negative text-white q-mb-md" rounded>
                        <template v-slot:avatar>
                            <q-icon name="error" />
                        </template>
                        <div>
                            <strong>Error Loading Newsletters</strong><br>
                            {{ hybridNewsletters.error.value }}
                        </div>
                        <template v-slot:action>
                            <q-btn flat label="Retry" @click="hybridNewsletters.refresh" />
                        </template>
                    </q-banner>

                    <!-- Newsletter Display -->
                    <div v-if="displayNewsletters.length > 0">
                        <!-- Year-grouped View -->
                        <div v-if="viewMode === 'year'">
                            <div v-for="(newsletters, year) in hybridNewsletters.newslettersByYear.value" :key="year"
                                class="q-mb-lg">
                                <div class="text-h5 q-mb-md text-primary">{{ year }}</div>
                                <div class="row q-gutter-md">
                                    <div v-for="newsletter in newsletters" :key="newsletter.id"
                                        class="col-12 col-md-6 col-lg-4">
                                        <HybridNewsletterCard :newsletter="newsletter" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Grid View -->
                        <div v-else-if="viewMode === 'grid'" class="row q-gutter-md">
                            <div v-for="newsletter in displayNewsletters" :key="newsletter.id"
                                class="col-12 col-md-6 col-lg-4">
                                <HybridNewsletterCard :newsletter="newsletter" />
                            </div>
                        </div>

                        <!-- List View -->
                        <div v-else class="q-gutter-md">
                            <div v-for="newsletter in displayNewsletters" :key="newsletter.id">
                                <HybridNewsletterCard :newsletter="newsletter" />
                            </div>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <q-card v-else flat :class="cardClasses">
                        <q-card-section class="text-center q-pa-xl">
                            <q-icon name="inbox" size="4rem" color="grey-5" />
                            <div class="text-h6 q-mt-md text-grey-6">
                                {{ searchQuery ? 'No newsletters match your search' : 'No newsletters available' }}
                            </div>
                            <div class="text-body2 text-grey-6 q-mt-sm">
                                {{ searchQuery ? 'Try adjusting your search terms' : 'Check back later for new issues'
                                }}
                            </div>
                            <q-btn v-if="searchQuery" flat label="Clear Search" color="primary"
                                @click="searchQuery = ''" class="q-mt-md" />
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import { useHybridNewsletters } from '../composables/useHybridNewsletters';
import HybridNewsletterCard from '../components/HybridNewsletterCard.vue';

const siteStore = useSiteStore();
const hybridNewsletters = useHybridNewsletters();

// UI state
const viewMode = ref<'list' | 'grid' | 'year'>('grid');
const sortBy = ref<'date' | 'title' | 'pages' | 'contentType'>('date');
const sortOrder = ref<'asc' | 'desc'>('desc');
const searchQuery = ref('');
const useAdvancedSearch = ref(false);

// Computed properties
const cardClasses = computed(() => {
    if (siteStore.isDarkMode) {
        return 'bg-dark text-white q-dark';
    } else {
        return 'bg-white text-dark';
    }
});

// Filtered and sorted newsletters for simple search
const filteredNewsletters = computed(() => {
    let newsletters = hybridNewsletters.newsletters.value;

    // Apply search filter
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        newsletters = newsletters.filter(newsletter =>
            newsletter.title.toLowerCase().includes(query) ||
            newsletter.filename.toLowerCase().includes(query) ||
            (newsletter.topics && newsletter.topics.some(topic =>
                topic.toLowerCase().includes(query)
            )) ||
            (newsletter.tags && newsletter.tags.some(tag =>
                tag.toLowerCase().includes(query)
            ))
        );
    }

    // Apply sorting
    newsletters = [...newsletters].sort((a, b) => {
        let comparison = 0;

        switch (sortBy.value) {
            case 'date':
                comparison = new Date(a.publishDate || a.date).getTime() -
                    new Date(b.publishDate || b.date).getTime();
                break;
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'pages':
                comparison = a.pages - b.pages;
                break;
            case 'contentType':
                comparison = (a.contentType || 'newsletter').localeCompare(b.contentType || 'newsletter');
                break;
        }

        return sortOrder.value === 'desc' ? -comparison : comparison;
    });

    return newsletters;
});

const displayNewsletters = computed(() => {
    return useAdvancedSearch.value ? [] : filteredNewsletters.value;
});

// Sort options
const sortOptions = [
    { label: 'Date', value: 'date' },
    { label: 'Title', value: 'title' },
    { label: 'Pages', value: 'pages' },
    { label: 'Type', value: 'contentType' }
];

// Lifecycle
onMounted(async () => {
    await hybridNewsletters.loadNewsletters();
});
</script>

<style scoped>
.q-page {
    min-height: calc(100vh - 50px);
}
</style>
