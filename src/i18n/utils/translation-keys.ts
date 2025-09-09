/**
 * Type-safe translation key constants
 *
 * Provides centralized, type-safe access to all translation keys
 * following the established architectural patterns.
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

export const TRANSLATION_KEYS = {
  // Navigation and Menu Items
  NAVIGATION: {
    HOME: 'navigation.home',
    COMMUNITY: 'navigation.community',
    CALENDAR: 'navigation.calendar',
    ARCHIVE: 'navigation.archive',
    MAP: 'navigation.map',
    ADMIN: 'navigation.admin',
    SETTINGS: 'navigation.settings',
    ABOUT: 'navigation.about',
    CONTACT: 'navigation.contact',
    CONTRIBUTE: 'navigation.contribute',
    NEWS: 'navigation.news',
    DASHBOARD: 'navigation.dashboard'
  },

  // Common UI Elements
  COMMON: {
    SAVE: 'common.save',
    CANCEL: 'common.cancel',
    DELETE: 'common.delete',
    EDIT: 'common.edit',
    CLOSE: 'common.close',
    OPEN: 'common.open',
    REFRESH: 'common.refresh',
    SEARCH: 'common.search',
    FILTER: 'common.filter',
    CLEAR: 'common.clear',
    RESET: 'common.reset',
    SUBMIT: 'common.submit',
    LOADING: 'common.loading',
    ERROR: 'common.error',
    SUCCESS: 'common.success',
    WARNING: 'common.warning',
    INFO: 'common.info',
    YES: 'common.yes',
    NO: 'common.no',
    OK: 'common.ok',
    BACK: 'common.back',
    NEXT: 'common.next',
    PREVIOUS: 'common.previous',
    CONTINUE: 'common.continue',
    CONFIRM: 'common.confirm',
    VIEW: 'common.view',
    DOWNLOAD: 'common.download',
    UPLOAD: 'common.upload',
    SHARE: 'common.share',
    COPY: 'common.copy',
    PRINT: 'common.print',
    EXPAND: 'common.expand',
    COLLAPSE: 'common.collapse',
    TOGGLE: 'common.toggle'
  },

  // Forms and Validation
  FORMS: {
    TITLE: 'forms.title',
    DESCRIPTION: 'forms.description',
    CONTENT: 'forms.content',
    EMAIL: 'forms.email',
    NAME: 'forms.name',
    SUBJECT: 'forms.subject',
    MESSAGE: 'forms.message',
    CATEGORY: 'forms.category',
    DATE: 'forms.date',
    TIME: 'forms.time',
    LOCATION: 'forms.location',
    TAGS: 'forms.tags',
    FEATURED: 'forms.featured',
    PUBLISHED: 'forms.published',
    VALIDATION: {
      REQUIRED: 'forms.validation.required',
      EMAIL_INVALID: 'forms.validation.emailInvalid',
      MIN_LENGTH: 'forms.validation.minLength',
      MAX_LENGTH: 'forms.validation.maxLength',
      INVALID_FORMAT: 'forms.validation.invalidFormat',
      PASSWORDS_DONT_MATCH: 'forms.validation.passwordsDontMatch'
    },
    PLACEHOLDERS: {
      EMAIL: 'forms.placeholders.email',
      PASSWORD: 'forms.placeholders.password',
      SEARCH: 'forms.placeholders.search',
      TITLE: 'forms.placeholders.title',
      DESCRIPTION: 'forms.placeholders.description'
    }
  },

  // Content Management
  CONTENT: {
    STATUS: {
      PENDING: 'content.status.pending',
      APPROVED: 'content.status.approved',
      PUBLISHED: 'content.status.published',
      REJECTED: 'content.status.rejected',
      DRAFT: 'content.status.draft'
    },
    TYPES: {
      NEWS: 'content.types.news',
      EVENT: 'content.types.event',
      ANNOUNCEMENT: 'content.types.announcement',
      CLASSIFIED: 'content.types.classified',
      NEWSLETTER: 'content.types.newsletter'
    },
    CATEGORIES: {
      GENERAL: 'content.categories.general',
      COMMUNITY: 'content.categories.community',
      EVENTS: 'content.categories.events',
      ANNOUNCEMENTS: 'content.categories.announcements',
      FOR_SALE: 'content.categories.forSale',
      WANTED: 'content.categories.wanted',
      SERVICES: 'content.categories.services',
      FREE: 'content.categories.free'
    },
    ACTIONS: {
      APPROVE: 'content.actions.approve',
      REJECT: 'content.actions.reject',
      PUBLISH: 'content.actions.publish',
      UNPUBLISH: 'content.actions.unpublish',
      FEATURE: 'content.actions.feature',
      UNFEATURE: 'content.actions.unfeature'
    }
  },

  // Newsletter Specific
  NEWSLETTER: {
    ARCHIVE: 'newsletter.archive',
    ISSUE: 'newsletter.issue',
    PUBLICATION_DATE: 'newsletter.publicationDate',
    PAGE_COUNT: 'newsletter.pageCount',
    WORD_COUNT: 'newsletter.wordCount',
    DOWNLOAD: 'newsletter.download',
    VIEW: 'newsletter.view',
    SEARCH_CONTENT: 'newsletter.searchContent',
    FILTER_BY_MONTH: 'newsletter.filterByMonth',
    FILTER_BY_YEAR: 'newsletter.filterByYear',
    ALL_MONTHS: 'newsletter.allMonths',
    ALL_YEARS: 'newsletter.allYears',
    LATEST_ISSUE: 'newsletter.latestIssue',
    PREVIOUS_ISSUES: 'newsletter.previousIssues'
  },

  // Authentication
  AUTH: {
    SIGN_IN: 'auth.signIn',
    SIGN_OUT: 'auth.signOut',
    SIGN_UP: 'auth.signUp',
    FORGOT_PASSWORD: 'auth.forgotPassword',
    RESET_PASSWORD: 'auth.resetPassword',
    PROFILE: 'auth.profile',
    ACCOUNT: 'auth.account',
    WELCOME: 'auth.welcome',
    WELCOME_BACK: 'auth.welcomeBack',
    SIGN_IN_WITH_GOOGLE: 'auth.signInWithGoogle',
    SIGN_IN_WITH_FACEBOOK: 'auth.signInWithFacebook',
    SIGN_IN_WITH_TWITTER: 'auth.signInWithTwitter',
    SIGN_IN_WITH_GITHUB: 'auth.signInWithGithub'
  },

  // Date and Time
  DATES: {
    TODAY: 'dates.today',
    YESTERDAY: 'dates.yesterday',
    TOMORROW: 'dates.tomorrow',
    THIS_WEEK: 'dates.thisWeek',
    LAST_WEEK: 'dates.lastWeek',
    THIS_MONTH: 'dates.thisMonth',
    LAST_MONTH: 'dates.lastMonth',
    THIS_YEAR: 'dates.thisYear',
    LAST_YEAR: 'dates.lastYear',
    MONTHS: {
      JANUARY: 'dates.months.january',
      FEBRUARY: 'dates.months.february',
      MARCH: 'dates.months.march',
      APRIL: 'dates.months.april',
      MAY: 'dates.months.may',
      JUNE: 'dates.months.june',
      JULY: 'dates.months.july',
      AUGUST: 'dates.months.august',
      SEPTEMBER: 'dates.months.september',
      OCTOBER: 'dates.months.october',
      NOVEMBER: 'dates.months.november',
      DECEMBER: 'dates.months.december'
    }
  },

  // Search and Filtering
  SEARCH: {
    SEARCH: 'search.search',
    RESULTS: 'search.results',
    NO_RESULTS: 'search.noResults',
    SEARCHING: 'search.searching',
    CLEAR_SEARCH: 'search.clearSearch',
    ADVANCED_SEARCH: 'search.advancedSearch',
    FILTERS: 'search.filters',
    SORT_BY: 'search.sortBy',
    SORT_DATE_DESC: 'search.sortDateDesc',
    SORT_DATE_ASC: 'search.sortDateAsc',
    SORT_TITLE_ASC: 'search.sortTitleAsc',
    SORT_TITLE_DESC: 'search.sortTitleDesc'
  },

  // Errors and Messages
  ERRORS: {
    GENERIC: 'errors.generic',
    NETWORK: 'errors.network',
    NOT_FOUND: 'errors.notFound',
    UNAUTHORIZED: 'errors.unauthorized',
    FORBIDDEN: 'errors.forbidden',
    SERVER_ERROR: 'errors.serverError',
    VALIDATION: 'errors.validation',
    FILE_TOO_LARGE: 'errors.fileTooLarge',
    INVALID_FILE_TYPE: 'errors.invalidFileType',
    UPLOAD_FAILED: 'errors.uploadFailed'
  },

  // Success Messages
  SUCCESS: {
    SAVED: 'success.saved',
    DELETED: 'success.deleted',
    UPDATED: 'success.updated',
    CREATED: 'success.created',
    UPLOADED: 'success.uploaded',
    SENT: 'success.sent',
    PUBLISHED: 'success.published',
    APPROVED: 'success.approved'
  },

  // Settings and Preferences
  SETTINGS: {
    TITLE: 'settings.title',
    LANGUAGE: 'settings.language',
    THEME: 'settings.theme',
    NOTIFICATIONS: 'settings.notifications',
    PRIVACY: 'settings.privacy',
    ACCESSIBILITY: 'settings.accessibility',
    ACCOUNT: 'settings.account',
    PREFERENCES: 'settings.preferences',
    SAVE_SETTINGS: 'settings.saveSettings',
    RESET_SETTINGS: 'settings.resetSettings'
  },

  // Footer and Legal
  FOOTER: {
    COPYRIGHT: 'footer.copyright',
    PRIVACY_POLICY: 'footer.privacyPolicy',
    TERMS_OF_SERVICE: 'footer.termsOfService',
    CONTACT_US: 'footer.contactUs',
    ABOUT_CLCA: 'footer.aboutClca'
  }
} as const;

// Export type for TypeScript support
export type TranslationKeyPath = typeof TRANSLATION_KEYS;

// Helper type to extract nested translation keys
export type NestedKeyOf<ObjectType extends Record<string, unknown>> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends Record<string, unknown>
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationKeyPath>;
