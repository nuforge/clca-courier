<!-- Example usage of Brand Icons in Vue/Quasar -->
<template>
    <div class="q-pa-md">
        <h5>Brand Icons Example</h5>

        <div class="q-gutter-md">
            <!-- Discord -->
            <q-btn @click="openDiscord" flat round color="primary">
                <DiscordIcon :size="24" />
            </q-btn>

            <!-- GitHub -->
            <q-btn @click="openGithub" flat round color="primary">
                <GithubIcon :size="24" />
            </q-btn>

            <!-- Twitter/X -->
            <q-btn @click="openTwitter" flat round color="primary">
                <TwitterIcon :size="24" />
            </q-btn>

            <!-- Facebook -->
            <q-btn @click="openFacebook" flat round color="primary">
                <FacebookIcon :size="24" />
            </q-btn>

            <!-- Instagram -->
            <q-btn @click="openInstagram" flat round color="primary">
                <InstagramIcon :size="24" />
            </q-btn>

            <!-- LinkedIn -->
            <q-btn @click="openLinkedin" flat round color="primary">
                <LinkedinIcon :size="24" />
            </q-btn>
        </div>

        <!-- Custom colored examples -->
        <div class="q-mt-lg">
            <h6>Custom Colors & Sizes</h6>
            <div class="q-gutter-md">
                <DiscordIcon :size="32" color="#5865F2" />
                <GithubIcon :size="32" color="#333" />
                <TwitterIcon :size="32" color="#000" />
                <FacebookIcon :size="32" color="#1877F2" />
                <InstagramIcon :size="32" color="#E4405F" />
                <LinkedinIcon :size="32" color="#0A66C2" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    DiscordIcon,
    GithubIcon,
    TwitterIcon,
    FacebookIcon,
    InstagramIcon,
    LinkedinIcon
} from '../components/BrandIcons'

function openDiscord() {
    window.open('https://discord.gg/your-server', '_blank')
}

function openGithub() {
    window.open('https://github.com/your-repo', '_blank')
}

function openTwitter() {
    window.open('https://x.com/your-handle', '_blank')
}

function openFacebook() {
    window.open('https://facebook.com/your-page', '_blank')
}

function openInstagram() {
    window.open('https://instagram.com/your-handle', '_blank')
}

function openLinkedin() {
    window.open('https://linkedin.com/company/your-company', '_blank')
}
</script>
