import type { NavigationItem } from '../types/navigation';
import { computed } from 'vue';
import { firebaseAuthService } from '../services/firebase-auth.service';

export const useNavigation = () => {
  const baseNavigationItems: NavigationItem[] = [
    {
      title: 'News & Updates',
      icon: 'mdi-newspaper',
      link: '/news',
    },
    {
      title: 'Classifieds & Ads',
      icon: 'mdi-bulletin-board',
      link: '/classifieds',
    },
    {
      title: 'Issue Archive',
      icon: 'mdi-bookshelf',
      link: '/archive',
    },
    {
      title: 'Interactive Map',
      icon: 'mdi-map',
      link: '/map',
    },
    {
      title: 'Contribute',
      icon: 'mdi-pencil',
      link: '/contribute',
    },
    {
      title: 'Contact',
      icon: 'mdi-phone',
      link: '/contact',
    },
    {
      title: 'About',
      icon: 'mdi-information',
      link: '/about',
    },
  ];

  const adminNavigationItem: NavigationItem = {
    title: 'Admin Dashboard',
    icon: 'mdi-shield-crown',
    link: '/admin',
  };

  // Computed navigation items that include admin if user is authenticated
  const navigationItems = computed(() => {
    const items = [...baseNavigationItems];

    // Add admin item if user is authenticated (for now, simple check)
    // In production, you'd check for actual admin role/permissions
    if (firebaseAuthService.getCurrentUser()) {
      items.push(adminNavigationItem);
    }

    return items;
  });

  return {
    navigationItems,
  };
};
