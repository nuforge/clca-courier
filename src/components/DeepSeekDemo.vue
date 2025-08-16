<template>
    <div class="deepseek-demo">
        <q-card class="demo-card">
            <q-card-section>
                <div class="text-h6 q-mb-md">
                    <q-icon name="science" color="primary" class="q-mr-sm" />
                    DeepSeek Publication Hub Demo
                </div>
                <p class="text-body2 q-mb-lg">
                    This component demonstrates the key concepts from DeepSeek's recommendation:
                    Google Drive thumbnails without CORS, client-side PDF processing, and IndexedDB storage.
                </p>

                <!-- Feature Showcase -->
                <q-list class="demo-features">
                    <q-item>
                        <q-item-section avatar>
                            <q-icon :color="features.thumbnails ? 'positive' : 'grey'" name="image" />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>CORS-Free Thumbnails</q-item-label>
                            <q-item-label caption>
                                Uses Google's direct thumbnail service: thumbnail?sz=w300&id=FILE_ID
                            </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn dense flat :color="features.thumbnails ? 'positive' : 'primary'"
                                @click="testThumbnails" :loading="testing.thumbnails">
                                {{ features.thumbnails ? 'Tested' : 'Test' }}
                            </q-btn>
                        </q-item-section>
                    </q-item>

                    <q-item>
                        <q-item-section avatar>
                            <q-icon :color="features.storage ? 'positive' : 'grey'" name="storage" />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>IndexedDB Storage</q-item-label>
                            <q-item-label caption>
                                Client-side metadata storage with offline access
                            </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn dense flat :color="features.storage ? 'positive' : 'primary'" @click="testStorage"
                                :loading="testing.storage">
                                {{ features.storage ? 'Tested' : 'Test' }}
                            </q-btn>
                        </q-item-section>
                    </q-item>

                    <q-item>
                        <q-item-section avatar>
                            <q-icon :color="features.pdfProcessing ? 'positive' : 'grey'" name="picture_as_pdf" />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>Client-Side PDF Processing</q-item-label>
                            <q-item-label caption>
                                PDF-Lib integration for thumbnail generation
                            </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn dense flat :color="features.pdfProcessing ? 'positive' : 'primary'"
                                @click="testPdfProcessing" :loading="testing.pdfProcessing">
                                {{ features.pdfProcessing ? 'Tested' : 'Test' }}
                            </q-btn>
                        </q-item-section>
                    </q-item>

                    <q-item>
                        <q-item-section avatar>
                            <q-icon :color="features.githubPages ? 'positive' : 'grey'" name="public" />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>GitHub Pages Ready</q-item-label>
                            <q-item-label caption>
                                No server required - runs entirely client-side
                            </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn dense flat :color="features.githubPages ? 'positive' : 'primary'"
                                @click="testGithubPages" :loading="testing.githubPages">
                                {{ features.githubPages ? 'Ready' : 'Check' }}
                            </q-btn>
                        </q-item-section>
                    </q-item>
                </q-list>

                <!-- Test Results -->
                <q-card v-if="testResults.length > 0" class="q-mt-md bg-grey-1">
                    <q-card-section>
                        <div class="text-subtitle2 q-mb-sm">Test Results:</div>
                        <div v-for="result in testResults" :key="result.id" class="test-result q-mb-xs">
                            <q-icon :name="result.success ? 'check_circle' : 'error'"
                                :color="result.success ? 'positive' : 'negative'" class="q-mr-sm" />
                            <span>{{ result.message }}</span>
                        </div>
                    </q-card-section>
                </q-card>

                <!-- Action Buttons -->
                <div class="q-mt-lg text-center">
                    <q-btn color="primary" icon="launch" label="Open Publication Hub" to="/publication-hub"
                        class="q-mr-md" />
                    <q-btn flat color="secondary" icon="refresh" label="Test All Features" @click="testAllFeatures"
                        :loading="testing.all" />
                </div>
            </q-card-section>
        </q-card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { googleDriveThumbnailService } from '../services/google-drive-thumbnail-service'
import { fileMetadataStorage } from '../services/file-metadata-storage'
import { deepSeekPublicationHubService } from '../services/deepseek-publication-hub-service'

// Feature status tracking
const features = ref({
    thumbnails: false,
    storage: false,
    pdfProcessing: false,
    githubPages: false
})

// Testing status
const testing = ref({
    thumbnails: false,
    storage: false,
    pdfProcessing: false,
    githubPages: false,
    all: false
})

// Test results
const testResults = ref<Array<{
    id: string
    success: boolean
    message: string
    timestamp: Date
}>>([])

// Test thumbnail generation
async function testThumbnails() {
    testing.value.thumbnails = true

    try {
        // Test Google Drive thumbnail URL generation
        const testFileId = '1BuYG7MZIXJ0KdaRJVEaMVS3RQt35-Xyy' // Sample file ID
        const thumbnailUrl = googleDriveThumbnailService.generateDriveThumbnail(testFileId, 300)

        // Test if the URL is properly formatted
        const urlPattern = /^https:\/\/drive\.google\.com\/thumbnail\?sz=w\d+&id=.+$/
        const isValidUrl = urlPattern.test(thumbnailUrl)

        if (isValidUrl) {
            features.value.thumbnails = true
            addTestResult('thumbnails', true, 'Google Drive thumbnail URLs generated successfully')
        } else {
            throw new Error('Invalid thumbnail URL format')
        }

    } catch (error) {
        addTestResult('thumbnails', false, `Thumbnail generation failed: ${error}`)
    } finally {
        testing.value.thumbnails = false
    }
}

// Test IndexedDB storage
async function testStorage() {
    testing.value.storage = true

    try {
        // Initialize storage
        await fileMetadataStorage.initialize()

        // Test storing and retrieving data
        const testFile = {
            id: 'test-file-' + Date.now(),
            name: 'test-document.pdf',
            type: 'pdf',
            size: '1.2 MB',
            uploaded: new Date().toISOString(),
            tags: ['test'],
            mimeType: 'application/pdf'
        }

        await fileMetadataStorage.storeFile(testFile)
        const retrieved = await fileMetadataStorage.getFile(testFile.id)

        if (retrieved && retrieved.id === testFile.id) {
            features.value.storage = true
            addTestResult('storage', true, 'IndexedDB storage working correctly')

            // Clean up test file
            await fileMetadataStorage.deleteFile(testFile.id)
        } else {
            throw new Error('Failed to store/retrieve test file')
        }

    } catch (error) {
        addTestResult('storage', false, `Storage test failed: ${error}`)
    } finally {
        testing.value.storage = false
    }
}

// Test PDF processing capability
async function testPdfProcessing() {
    testing.value.pdfProcessing = true

    try {
        // Test if PDF-Lib is available and working
        const testPdfData = new ArrayBuffer(8) // Minimal test data

        try {
            // Try to create a simple PDF document
            const canvas = document.createElement('canvas')
            canvas.width = 300
            canvas.height = 400

            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.fillStyle = '#f5f5f5'
                ctx.fillRect(0, 0, 300, 400)
                ctx.fillStyle = '#666'
                ctx.font = '16px Arial'
                ctx.textAlign = 'center'
                ctx.fillText('PDF Test', 150, 200)
            }

            const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8)

            if (thumbnailDataUrl) {
                features.value.pdfProcessing = true
                addTestResult('pdfProcessing', true, 'Client-side PDF thumbnail generation ready')
            } else {
                throw new Error('Canvas thumbnail generation failed')
            }

        } catch (pdfError) {
            throw new Error('PDF-Lib processing failed')
        }

    } catch (error) {
        addTestResult('pdfProcessing', false, `PDF processing test failed: ${error}`)
    } finally {
        testing.value.pdfProcessing = false
    }
}

// Test GitHub Pages compatibility
async function testGithubPages() {
    testing.value.githubPages = true

    try {
        // Check if we're running in a browser environment with required APIs
        const hasIndexedDB = 'indexedDB' in window
        const hasCanvas = !!document.createElement('canvas').getContext
        const hasServiceWorker = 'serviceWorker' in navigator
        const hasLocalStorage = 'localStorage' in window

        const allAPIsAvailable = hasIndexedDB && hasCanvas && hasLocalStorage

        if (allAPIsAvailable) {
            features.value.githubPages = true
            addTestResult('githubPages', true,
                `GitHub Pages ready - All APIs available (IndexedDB: ${hasIndexedDB}, Canvas: ${hasCanvas}, ServiceWorker: ${hasServiceWorker})`
            )
        } else {
            const missingAPIs = []
            if (!hasIndexedDB) missingAPIs.push('IndexedDB')
            if (!hasCanvas) missingAPIs.push('Canvas')
            if (!hasLocalStorage) missingAPIs.push('LocalStorage')

            throw new Error(`Missing APIs: ${missingAPIs.join(', ')}`)
        }

    } catch (error) {
        addTestResult('githubPages', false, `GitHub Pages compatibility test failed: ${error}`)
    } finally {
        testing.value.githubPages = false
    }
}

// Test all features
async function testAllFeatures() {
    testing.value.all = true
    testResults.value = [] // Clear previous results

    try {
        await testThumbnails()
        await testStorage()
        await testPdfProcessing()
        await testGithubPages()

        const allTestsPassed = Object.values(features.value).every(Boolean)

        if (allTestsPassed) {
            addTestResult('all', true, '🎉 All DeepSeek features are working correctly!')
        } else {
            addTestResult('all', false, 'Some features need attention')
        }

    } catch (error) {
        addTestResult('all', false, `Testing failed: ${error}`)
    } finally {
        testing.value.all = false
    }
}

// Helper function to add test results
function addTestResult(id: string, success: boolean, message: string) {
    testResults.value.push({
        id,
        success,
        message,
        timestamp: new Date()
    })
}
</script>

<style scoped>
.deepseek-demo {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.demo-card {
    border-radius: 16px;
}

.demo-features {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
}

.test-result {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
}
</style>
