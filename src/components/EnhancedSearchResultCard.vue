<template>
    <q-card :class="cardClasses" class="enhanced-search-result-card cursor-pointer" @click="$emit('click', result)"
        v-ripple>
        <!-- Relevance Score Badge -->
        <div v-if="result.score > 0" class="relevance-badge">
            <q-badge color="primary" :label="scoreLabel" />
        </div>

        <q-card-section>
            <!-- Title with highlighting -->
            <div class="text-h6 q-mb-sm">
                <div v-if="result.highlights?.title" v-html="result.highlights.title" class="highlighted-title"></div>
                <div v-else>{{ result.title }}</div>
            </div>

            <!-- Basic info row -->
            <div class="row items-center q-gutter-sm q-mb-sm text-caption text-grey-6">
                <div class="flex items-center">
                    <q-icon name="mdi-calendar" size="xs" class="q-mr-xs" />
                    {{ formatDate(result.date) }}
                </div>
                <div class="flex items-center">
                    <q-icon name="mdi-file-pdf-box" size="xs" class="q-mr-xs" />
                    {{ result.pages }} pages
                </div>
                <div v-if="result.fileSize" class="flex items-center">
                    <q-icon name="mdi-file" size="xs" class="q-mr-xs" />
                    {{ result.fileSize }}
                </div>
            </div>

            <!-- Description with highlighting -->
            <div v-if="result.description" class="text-body2 q-mb-sm text-grey-7">
                <div v-if="result.highlights?.description" v-html="result.highlights.description"
                    class="highlighted-description"></div>
                <div v-else>{{ truncatedDescription }}</div>
            </div>

            <!-- Content highlights -->
            <div v-if="result.highlights?.content && result.highlights.content.length > 0"
                class="content-highlights q-mb-sm">
                <div class="text-caption text-grey-6 q-mb-xs">
                    <q-icon name="mdi-text-search" size="xs" class="q-mr-xs" />
                    Content matches:
                </div>
                <div class="content-snippets">
                    <div v-for="(snippet, index) in result.highlights.content.slice(0, 2)" :key="index"
                        class="content-snippet text-body2" v-html="snippet"></div>
                    <div v-if="result.highlights.content.length > 2" class="text-caption text-grey-6">
                        +{{ result.highlights.content.length - 2 }} more matches
                    </div>
                </div>
            </div>

            <!-- Matched terms -->
            <div v-if="result.matchedTerms.length > 0" class="matched-terms">
                <q-chip v-for="term in result.matchedTerms.slice(0, 3)" :key="term" size="sm" color="primary"
                    text-color="white" class="q-mr-xs q-mb-xs">
                    {{ term }}
                </q-chip>
                <span v-if="result.matchedTerms.length > 3" class="text-caption text-grey-6">
                    +{{ result.matchedTerms.length - 3 }} more
                </span>
            </div>
        </q-card-section>

        <!-- Actions -->
        <q-card-actions align="right">
            <q-btn flat dense color="primary" icon="mdi-eye" label="View" @click.stop="$emit('click', result)" />
            <q-btn flat dense color="grey-6" icon="mdi-refresh" @click.stop="$emit('regenerate-thumbnail', result)">
                <q-tooltip>Regenerate Thumbnail</q-tooltip>
            </q-btn>
        </q-card-actions>
    </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import type { SearchResult } from '../composables/useAdvancedSearch'

// Props
interface Props {
    result: SearchResult
    searchTerms: string[]
}

const props = defineProps<Props>()

// Emits
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emit = defineEmits<{
    'click': [result: SearchResult]
    'regenerate-thumbnail': [result: SearchResult]
}>()

// Store
const siteStore = useSiteStore()

// Computed
const cardClasses = computed(() => {
    const base = 'transition-all duration-200'
    const theme = siteStore.isDarkMode
        ? 'bg-dark text-white q-dark'
        : 'bg-white text-dark'

    return `${base} ${theme} hover:shadow-md`
})

const scoreLabel = computed(() => {
    const score = props.result.score
    if (score >= 50) return 'Excellent'
    if (score >= 20) return 'Good'
    if (score >= 10) return 'Fair'
    return 'Low'
})

const truncatedDescription = computed(() => {
    if (!props.result.description) return ''
    if (props.result.description.length <= 120) return props.result.description
    return props.result.description.substring(0, 120) + '...'
})

// Methods
function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}
</script>

<style scoped>
.enhanced-search-result-card {
    position: relative;
    border-left: 4px solid transparent;
    transition: all 0.2s ease;
}

.enhanced-search-result-card:hover {
    border-left-color: var(--q-primary);
    transform: translateY(-2px);
}

.relevance-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;
}

.content-highlights {
    background: rgba(0, 0, 0, 0.03);
    border-radius: 4px;
    padding: 8px;
}

.q-dark .content-highlights {
    background: rgba(255, 255, 255, 0.05);
}

.content-snippet {
    margin-bottom: 4px;
    line-height: 1.4;
}

.content-snippet:last-child {
    margin-bottom: 0;
}

:deep(mark) {
    background-color: #fff3cd;
    color: #856404;
    padding: 1px 3px;
    border-radius: 2px;
    font-weight: 500;
}

:deep(.q-dark mark) {
    background-color: #664d03;
    color: #ffecb3;
}

.matched-terms {
    margin-top: 8px;
}

.highlighted-title :deep(mark) {
    font-weight: 600;
}

.highlighted-description :deep(mark) {
    font-weight: 500;
}
</style>
