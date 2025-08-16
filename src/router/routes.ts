import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/news', component: () => import('pages/NewsUpdatesPage.vue') },
      { path: '/classifieds', component: () => import('pages/ClassifiedsPage.vue') },
      { path: '/archive', component: () => import('pages/IssueArchivePage.vue') },
      { path: '/archive/:id(\\d+)', component: () => import('pages/IssueDetailsPageEnhanced.vue') },
      { path: '/contribute', component: () => import('pages/ContributePage.vue') },
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
      { path: '/demo/google-drive', component: () => import('pages/GoogleDriveDemoPage.vue') },
      {
        path: '/google-drive-content',
        component: () => import('pages/GoogleDriveContentDashboard.vue'),
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
