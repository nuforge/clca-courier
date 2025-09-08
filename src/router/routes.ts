import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // Main public pages
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/community', component: () => import('pages/CommunityContentPage.vue') },
      { path: '/contact', component: () => import('pages/ContactPage.vue') },
      { path: '/about', component: () => import('pages/AboutPage.vue') },
      { path: '/map', component: () => import('pages/MapRefactoredPage.vue') },

      // Newsletter archive (Firebase-powered)
      { path: '/archive', component: () => import('pages/FirebaseNewsletterArchivePage.vue') },
      { path: '/archive/:id', component: () => import('pages/FirebaseNewsletterDetailsPage.vue') },

      // Contribution system
      { path: '/contribute', component: () => import('pages/ContributePage.vue') },
      { path: '/contribute/submit', component: () => import('pages/SubmitContentPage.vue') },
      { path: '/contribute/guide', component: () => import('pages/ContributeGuide.vue') },

      { path: '/dashboard', component: () => import('pages/DashboardPage.vue') },

      // User account
      { path: '/account', component: () => import('pages/AccountPage.vue') },

      // Legal pages
      { path: '/privacy', component: () => import('pages/PrivacyPolicyPage.vue') },
      { path: '/terms', component: () => import('pages/TermsOfServicePage.vue') },
      { path: '/accessibility', component: () => import('pages/AccessibilityPage.vue') },

      // Admin routes
      { path: '/admin', component: () => import('pages/NewsletterManagementPage.vue') },
      { path: '/admin/content', component: () => import('pages/ContentManagementPage.vue') },
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
