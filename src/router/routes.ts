import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // Main public pages
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/community', component: () => import('pages/CommunityContentPage.vue') },
      { path: '/calendar', component: () => import('pages/CommunityCalendarPage.vue') },
      { path: '/about', component: () => import('pages/AboutContactPage.vue') },
      { path: '/contact', redirect: '/about' }, // Redirect old contact route to about page
      { path: '/map', component: () => import('pages/InteractiveMapPage.vue') },

      // Newsletter archive
      { path: '/archive', component: () => import('pages/NewsletterArchivePage.vue') },
      { path: '/archive/:id', component: () => import('pages/NewsletterDetailsPage.vue') },

      // Contribution system
      { path: '/contribute', component: () => import('pages/ContributePage.vue') },
      { path: '/contribute/submit', component: () => import('pages/SubmitContentPage.vue') },
      { path: '/contribute/newsletter', component: () => import('pages/NewsletterSubmissionPage.vue') },
      { path: '/contribute/guide', redirect: '/contribute/guide-modern' },
      { path: '/contribute/guide-modern', component: () => import('pages/ContributeGuideModern.vue') },

      // Canva integration
      { path: '/canva/callback', component: () => import('pages/CanvaCallbackPage.vue') },

      { path: '/dashboard', component: () => import('pages/DashboardPage.vue') },

      // User settings
      { path: '/settings', component: () => import('pages/SettingsPage.vue') },
      { path: '/account', redirect: '/settings' }, // Redirect old account route to settings

      // Legal pages
      { path: '/privacy', component: () => import('pages/PrivacyPolicyPage.vue') },
      { path: '/terms', component: () => import('pages/TermsOfServicePage.vue') },
      { path: '/accessibility', component: () => import('pages/AccessibilityPage.vue') },

      // Admin routes
      { path: '/admin', component: () => import('pages/AdminDashboardPage.vue') },
      { path: '/admin/dashboard', redirect: '/admin' },
      { path: '/admin/content', component: () => import('pages/ContentManagementPage.vue') },
      { path: '/admin/newsletters', component: () => import('pages/NewsletterManagementPage.vue') },
      { path: '/admin/theme', component: () => import('pages/ThemeEditorPage.vue') },
      { path: '/admin/test-content-v2', component: () => import('pages/TestContentV2Page.vue') },
      { path: '/admin/canva-demo', component: () => import('pages/CanvaDemoPage.vue') },

      // Print workflow
      { path: '/content/print-queue', component: () => import('pages/PrintQueuePage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
