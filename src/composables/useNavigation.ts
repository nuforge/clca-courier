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
      title: 'Contribute',
      icon: 'mdi-pencil',
      link: '/contribute',
    },
    {
      title: 'About & Contact',
      icon: 'mdi-comment-question',
      link: '/about',
    },
  ];

  // Navigation items without admin items (admin items are now in bottom section)
  const navigationItems = computed(() => {
    const items = [...baseNavigationItems];
    // Admin items moved to bottom section in AppNavigation.vue
    return items;
  });

  return {
    navigationItems,
    refreshNavigation: checkAuthAndAdminStatus,
  };
};
