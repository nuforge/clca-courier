<template>
    <q-page padding>
        <div class="q-pa-md">
            <div class="row justify-center">
                <div class="col-12 col-md-10 col-lg-8">
                    <q-card flat bordered class="q-mb-md">
                        <q-card-section>
                            <div class="text-h4 q-mb-md">
                                <q-icon name="mdi-archive" class="q-mr-sm" />
                                Issue Archive
                            </div>
                            <p class="text-body1">
                                Browse through past issues of The Courier. Access previous newsletters, announcements,
                                and community updates from our archive.
                            </p>
                        </q-card-section>
                    </q-card>

                    <q-card flat bordered>
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Available Issues</div>
                            <q-separator class="q-mb-md" />

                            <div class="row q-gutter-md">
                                <div class="col-12 col-sm-6 col-md-4" v-for="issue in archivedIssues" :key="issue.id">
                                    <q-card flat bordered class="cursor-pointer" @click="openIssue(issue)">
                                        <q-card-section class="text-center">
                                            <q-icon name="mdi-file-document" size="3em" color="primary"
                                                class="q-mb-sm" />
                                            <div class="text-weight-medium">{{ issue.title }}</div>
                                            <div class="text-caption text-grey-6">{{ issue.date }}</div>
                                            <div class="text-caption q-mt-sm">{{ issue.pages }} pages</div>
                                        </q-card-section>
                                    </q-card>
                                </div>
                            </div>

                            <div class="text-center q-mt-lg" v-if="archivedIssues.length === 0">
                                <q-icon name="mdi-archive-outline" size="4em" color="grey-5" />
                                <div class="text-grey-6 q-mt-md">No archived issues available yet</div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

interface ArchivedIssue {
    id: number
    title: string
    date: string
    pages: number
    url?: string
}

const archivedIssues = ref<ArchivedIssue[]>([
    {
        id: 1,
        title: 'Summer 2025 Edition',
        date: 'July 2025',
        pages: 12
    },
    {
        id: 2,
        title: 'Spring 2025 Edition',
        date: 'April 2025',
        pages: 10
    },
    {
        id: 3,
        title: 'Winter 2024 Edition',
        date: 'December 2024',
        pages: 8
    }
])

function openIssue(issue: ArchivedIssue) {
    $q.notify({
        message: `Opening ${issue.title}`,
        caption: 'Archive feature coming soon!',
        icon: 'mdi-information'
    })
}
</script>
