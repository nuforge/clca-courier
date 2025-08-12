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
      { path: '/contribute', component: () => import('pages/ContributePage.vue') },
      { path: '/contact', component: () => import('pages/ContactPage.vue') },
      { path: '/about', component: () => import('pages/AboutPage.vue') },
      { path: '/account', component: () => import('pages/AccountPage.vue') },
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
