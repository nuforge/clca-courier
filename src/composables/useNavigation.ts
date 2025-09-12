import type { NavigationItem } from '../types/navigation';
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { firebaseAuthService } from '../services/firebase-auth.service';
import { firestoreService } from '../services/firebase-firestore.service';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';

export const useNavigation = () => {
  const { t } = useI18n();
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

  const baseNavigationItems = computed((): NavigationItem[] => [
    {
      title: t(TRANSLATION_KEYS.NAVIGATION.COMMUNITY),
      icon: 'mdi-newspaper',
      link: '/community',
    },
    {
      title: t(TRANSLATION_KEYS.NAVIGATION.CALENDAR),
      icon: 'mdi-calendar-month',
      link: '/calendar',
    },
    {
      title: t(TRANSLATION_KEYS.NAVIGATION.ARCHIVE),
      icon: 'mdi-bookshelf',
      link: '/archive',
    },
    {
      title: t(TRANSLATION_KEYS.NAVIGATION.CONTRIBUTE),
      icon: 'mdi-pencil',
      link: '/contribute',
    },
    {
      title: t(TRANSLATION_KEYS.NAVIGATION.ABOUT),
      icon: 'mdi-comment-question',
      link: '/about',
    },
  ]);

  // Development/Testing items for authenticated users
  const developmentItems = computed((): NavigationItem[] => {
    if (!isAuthenticatedUser.value) return [];

    return [
      // Test page removed - was causing 404 errors
    ];
  });

  // Navigation items without admin items (admin items are now in bottom section)
  const navigationItems = computed(() => {
    const items = [...baseNavigationItems.value];

    // Add development items for authenticated users
    if (isAuthenticatedUser.value) {
      items.push(...developmentItems.value);
    }

    return items;
  });

  return {
    navigationItems,
    refreshNavigation: checkAuthAndAdminStatus,
  };
};
