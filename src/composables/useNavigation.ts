import { type NavigationItem } from '../components/NavigationItem.vue';

export const useNavigation = () => {
  const navigationItems: NavigationItem[] = [
    {
      title: 'Home',
      icon: 'mdi-home',
      link: '/',
    },
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

  return {
    navigationItems,
  };
};
