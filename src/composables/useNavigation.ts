import type { NavigationItem } from '../types/navigation';
import { computed, ref, onMounted } from 'vue';
import { firebaseAuthService } from '../services/firebase-auth.service';
import { firestoreService } from '../services/firebase-firestore.service';

export const useNavigation = () => {
  const isAuthenticatedUser = ref(false);
  const hasAdminProfile = ref(false);

  // Check authentication and admin status
  const checkAuthAndAdminStatus = async () => {
    const user = firebaseAuthService.getCurrentUser();
    isAuthenticatedUser.value = !!user;

    if (user) {
      try {
        const profile = await firestoreService.getUserProfile(user.uid);
        hasAdminProfile.value = !!(profile && profile.role === 'admin');
      } catch {
        hasAdminProfile.value = false;
      }
    } else {
      hasAdminProfile.value = false;
    }
  };

  // Listen to auth state changes
  onMounted(() => {
    void checkAuthAndAdminStatus();

    // Set up auth state listener
    firebaseAuthService.onAuthStateChange(() => {
      void checkAuthAndAdminStatus();
    });
  });

  const baseNavigationItems: NavigationItem[] = [
    {
      title: 'Community Content',
      icon: 'mdi-newspaper',
      link: '/community',
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
      title: 'About & Contact',
      icon: 'mdi-information',
      link: '/about',
    },
  ];

  // Computed navigation items that include admin if user is authenticated
  const navigationItems = computed(() => {
    const items = [...baseNavigationItems];

    // Add admin item if user is authenticated
    if (isAuthenticatedUser.value) {
      if (hasAdminProfile.value) {
        // User has admin profile - show admin dashboard
        items.push({
          title: 'Admin Dashboard',
          icon: 'mdi-shield-crown',
          link: '/admin',
        });
      } else {
        // User is authenticated but no admin profile - show setup
        items.push({
          title: 'Admin Setup',
          icon: 'mdi-shield-plus',
          link: '/admin/setup',
        });
      }
    }

    return items;
  });

  return {
    navigationItems,
    refreshNavigation: checkAuthAndAdminStatus,
  };
};
