import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/news', component: () => import('pages/NewsUpdatesPage.vue') },
      { path: '/classifieds', component: () => import('pages/ClassifiedsPage.vue') },
      { path: '/archive', component: () => import('pages/FirebaseNewsletterArchivePage.vue') },
      { path: '/archive/:id', component: () => import('pages/FirebaseNewsletterDetailsPage.vue') },
      { path: '/archive/legacy', component: () => import('pages/AdvancedIssueArchivePage.vue') },
      { path: '/archive/:id(\\d+)', component: () => import('pages/IssueDetailsPageEnhanced.vue') },
      { path: '/contribute', component: () => import('pages/ContributePage.vue') },
      { path: '/contribute/submit', component: () => import('pages/SubmitContentPage.vue') },
      { path: '/contribute/article', component: () => import('pages/ArticleSubmissionPage.vue') },
      { path: '/contribute/photo', component: () => import('pages/PhotoSubmissionPage.vue') },
      { path: '/contribute/event', component: () => import('pages/EventAnnouncementPage.vue') },
      { path: '/contribute/ideas', component: () => import('pages/ShareIdeasPage.vue') },
      { path: '/contact', component: () => import('pages/ContactPage.vue') },
      { path: '/about', component: () => import('pages/AboutPage.vue') },
      { path: '/account', component: () => import('pages/AccountPage.vue') },
      { path: '/privacy', component: () => import('pages/PrivacyPolicyPage.vue') },
      { path: '/terms', component: () => import('pages/TermsOfServicePage.vue') },
      { path: '/accessibility', component: () => import('pages/AccessibilityPage.vue') },
      { path: '/map', component: () => import('pages/MapRefactoredPage.vue') }, // Use refactored version as main map
      { path: '/map-refactored', component: () => import('pages/MapRefactoredPage.vue') },
      // Demo and test routes - commented out for production cleanup but preserved for development
      { path: '/test/lightweight', component: () => import('pages/LightweightTestPage.vue') },
      {
        path: '/admin/pdf-extraction',
        component: () => import('pages/PdfTextExtractionToolPage.vue'),
      },
      {
        path: '/firebase-demo',
        component: () => import('pages/FirebaseDemoPage.vue'),
      },
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
