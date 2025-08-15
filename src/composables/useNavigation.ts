import type { NavigationItem } from '../types/navigation';

export const useNavigation = () => {
  const navigationItems: NavigationItem[] = [
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
    {
      title: 'Content Dashboard',
      icon: 'mdi-cloud-outline',
      link: '/content/dashboard',
    },
    {
      title: 'Google Drive Demo',
      icon: 'mdi-google-drive',
      link: '/demo/google-drive-content',
    },
  ];

  return {
    navigationItems,
  };
};
