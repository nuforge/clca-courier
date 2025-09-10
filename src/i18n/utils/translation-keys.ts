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
    AUTO_REFRESH: 'common.autoRefresh',
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
    NONE: 'common.none',
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
    AUTHOR: 'forms.author',
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
    SUBMITTED: 'content.submitted',
    ATTACHMENTS: 'content.attachments',
    REVIEW_NOTES: 'content.reviewNotes',
    REJECT_CONTENT: 'content.rejectContent',
    REJECTION_REASON: 'content.rejectionReason',
    NEED_HELP: 'content.needHelp',
    CONTENT_GUIDELINES: 'content.contentGuidelines',
    GUIDELINES_DESCRIPTION: 'content.guidelinesDescription',
    VIEW_GUIDELINES: 'content.viewGuidelines',
    IMAGE_HOSTING: 'content.imageHosting',
    IMAGE_HOSTING_DESCRIPTION: 'content.imageHostingDescription',
    IMAGE_GUIDE: 'content.imageGuide',
    GET_SUPPORT: 'content.getSupport',
    SUPPORT_DESCRIPTION: 'content.supportDescription',
    ACTIONS: {
      APPROVE: 'content.actions.approve',
      REJECT: 'content.actions.reject',
      PUBLISH: 'content.actions.publish',
      UNPUBLISH: 'content.actions.unpublish',
      FEATURE: 'content.actions.feature',
      UNFEATURE: 'content.actions.unfeature'
    }
  },

  // Canva Integration
  CANVA: {
    DESIGN_CREATED: 'canva.designCreated',
    EXPORT_PENDING: 'canva.exportPending',
    EXPORT_COMPLETE: 'canva.exportComplete',
    OPEN_DESIGN: 'canva.openDesign',
    CREATE_DESIGN: 'canva.createDesign',
    EXPORT_FOR_PRINT: 'canva.exportForPrint',
    DESIGN_ATTACHED: 'canva.designAttached',
    AUTH_REQUIRED: 'canva.authRequired',
    AUTH_FAILED: 'canva.authFailed',
    EXPORT_FAILED: 'canva.exportFailed',
    CONNECTION_ERROR: 'canva.connectionError',
    CREATE_WITH_CANVA: 'canva.createWithCanva',
    EDIT_IN_CANVA: 'canva.editInCanva',
    DOWNLOAD_DESIGN: 'canva.downloadDesign',
    PROCESSING: 'canva.processing',
    READY_FOR_DOWNLOAD: 'canva.readyForDownload'
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
    APPROVED: 'success.approved',
    CONTENT_SUBMITTED: 'success.contentSubmitted'
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
  },

  // Pages - About & Contact
  ABOUT: {
    TITLE: 'about.title',
    SUBTITLE: 'about.subtitle',
    DESCRIPTION: 'about.description',
    QUICK_CONTACT: 'about.quickContact',
    OUR_MISSION: 'about.ourMission',
    MISSION_DESCRIPTION: 'about.missionDescription',
    WHAT_WE_DO: 'about.whatWeDo',
    WHAT_WE_DO_DESCRIPTION: 'about.whatWeDoDescription',
    HOW_TO_HELP: 'about.howToHelp',
    HOW_TO_HELP_DESCRIPTION: 'about.howToHelpDescription',
    VOLUNTEER: 'about.volunteer',
    CONTRIBUTE: 'about.contribute',
    CONTACT_SECTION: 'about.contactSection',
    CONTACT_DESCRIPTION: 'about.contactDescription',
    CONTACT_INFO: 'about.contactInfo',
    CONTACT_INFO_DESCRIPTION: 'about.contactInfoDescription',
    CONTACT_FORM: 'about.contactForm',
    CONTACT_FORM_DESCRIPTION: 'about.contactFormDescription',
    SUBJECT_OPTIONS: {
      GENERAL: 'about.subjectOptions.general',
      ARTICLE: 'about.subjectOptions.article',
      PHOTO: 'about.subjectOptions.photo',
      EVENT: 'about.subjectOptions.event',
      ADVERTISING: 'about.subjectOptions.advertising',
      TECHNICAL: 'about.subjectOptions.technical',
      FEEDBACK: 'about.subjectOptions.feedback',
      OTHER: 'about.subjectOptions.other'
    }
  },

  // Pages - Contribute
  CONTRIBUTE: {
    TITLE: 'contribute.title',
    SUBTITLE: 'contribute.subtitle',
    SELECT_TYPE: 'contribute.selectType',
    CONTENT_TYPES: {
      NEWS: {
        TITLE: 'contribute.contentTypes.news.title',
        DESCRIPTION: 'contribute.contentTypes.news.description',
        ICON: 'contribute.contentTypes.news.icon'
      },
      PHOTOS: {
        TITLE: 'contribute.contentTypes.photos.title',
        DESCRIPTION: 'contribute.contentTypes.photos.description',
        ICON: 'contribute.contentTypes.photos.icon'
      },
      EVENTS: {
        TITLE: 'contribute.contentTypes.events.title',
        DESCRIPTION: 'contribute.contentTypes.events.description',
        ICON: 'contribute.contentTypes.events.icon'
      },
      ANNOUNCEMENTS: {
        TITLE: 'contribute.contentTypes.announcements.title',
        DESCRIPTION: 'contribute.contentTypes.announcements.description',
        ICON: 'contribute.contentTypes.announcements.icon'
      },
      CLASSIFIEDS: {
        TITLE: 'contribute.contentTypes.classifieds.title',
        DESCRIPTION: 'contribute.contentTypes.classifieds.description',
        ICON: 'contribute.contentTypes.classifieds.icon'
      }
    },
    REQUIREMENTS: 'contribute.requirements',
    PREPARE_CONTENT: 'contribute.prepareContent',
    PREPARATION_CHECKLIST: 'contribute.preparationChecklist',
    CHECK_CONTENT: 'contribute.checkContent',
    CHECK_IMAGES: 'contribute.checkImages',
    CHECK_DETAILS: 'contribute.checkDetails',
    QUICK_SUBMIT: 'contribute.quickSubmit',
    PROCEED_TO_FORM: 'contribute.proceedToForm',
    BACK_TO_SELECTION: 'contribute.backToSelection',
    HELP_RESOURCES: 'contribute.helpResources',
    PROCESS_STEPS: {
      SELECT: {
        TITLE: 'contribute.processSteps.select.title',
        DESCRIPTION: 'contribute.processSteps.select.description'
      },
      PREPARE: {
        TITLE: 'contribute.processSteps.prepare.title',
        DESCRIPTION: 'contribute.processSteps.prepare.description'
      },
      SUBMIT: {
        TITLE: 'contribute.processSteps.submit.title',
        DESCRIPTION: 'contribute.processSteps.submit.description'
      },
      REVIEW: {
        TITLE: 'contribute.processSteps.review.title',
        DESCRIPTION: 'contribute.processSteps.review.description'
      },
      PUBLISH: {
        TITLE: 'contribute.processSteps.publish.title',
        DESCRIPTION: 'contribute.processSteps.publish.description'
      }
    }
  },

  // Pages - Contribute Guide
  CONTRIBUTE_GUIDE: {
    TITLE: 'contributeGuide.title',
    SUBTITLE: 'contributeGuide.subtitle',
    OVERVIEW: 'contributeGuide.overview',
    PROCESS: 'contributeGuide.process',
    GUIDELINES: 'contributeGuide.guidelines',
    QUALITY_STANDARDS: 'contributeGuide.qualityStandards',
    FAQ: 'contributeGuide.faq',
    POSITIVE_GUIDELINES: 'contributeGuide.positiveGuidelines',
    NEGATIVE_GUIDELINES: 'contributeGuide.negativeGuidelines',
    REVIEW_PHASES: 'contributeGuide.reviewPhases'
  },

  // Pages - Settings
  SETTINGS_PAGE: {
    TITLE: 'settingsPage.title',
    SUBTITLE: 'settingsPage.subtitle',
    THEME_SETTINGS: 'settingsPage.themeSettings',
    THEME_DESCRIPTION: 'settingsPage.themeDescription',
    LIGHT_THEME: 'settingsPage.lightTheme',
    DARK_THEME: 'settingsPage.darkTheme',
    AUTO_THEME: 'settingsPage.autoTheme',
    NOTIFICATION_SETTINGS: 'settingsPage.notificationSettings',
    NOTIFICATION_DESCRIPTION: 'settingsPage.notificationDescription',
    EMAIL_NOTIFICATIONS: 'settingsPage.emailNotifications',
    PUSH_NOTIFICATIONS: 'settingsPage.pushNotifications',
    NEWSLETTER_UPDATES: 'settingsPage.newsletterUpdates',
    CONTENT_UPDATES: 'settingsPage.contentUpdates',
    DISPLAY_SETTINGS: 'settingsPage.displaySettings',
    DISPLAY_DESCRIPTION: 'settingsPage.displayDescription',
    COMPACT_MODE: 'settingsPage.compactMode',
    SHOW_TIMESTAMPS: 'settingsPage.showTimestamps',
    ANIMATE_TRANSITIONS: 'settingsPage.animateTransitions',
    PDF_SETTINGS: 'settingsPage.pdfSettings',
    PDF_DESCRIPTION: 'settingsPage.pdfDescription',
    DEFAULT_ZOOM: 'settingsPage.defaultZoom',
    PREFERRED_VIEWER: 'settingsPage.preferredViewer',
    PDFTRON_VIEWER: 'settingsPage.pdftronViewer',
    PDFJS_VIEWER: 'settingsPage.pdfjsViewer',
    BACKUP_SETTINGS: 'settingsPage.backupSettings',
    BACKUP_DESCRIPTION: 'settingsPage.backupDescription',
    EXPORT_SETTINGS: 'settingsPage.exportSettings',
    IMPORT_SETTINGS: 'settingsPage.importSettings',
    RESET_ALL: 'settingsPage.resetAll',
    RESET_CONFIRMATION: 'settingsPage.resetConfirmation',
    RESET_WARNING: 'settingsPage.resetWarning',
    LANGUAGE_SETTINGS: 'settingsPage.languageSettings',
    LANGUAGE_DESCRIPTION: 'settingsPage.languageDescription',
    CURRENT_LANGUAGE: 'settingsPage.currentLanguage',
    SELECT_LANGUAGE: 'settingsPage.selectLanguage'
  },

  // Pages - Privacy Policy
  PRIVACY: {
    TITLE: 'privacy.title',
    SUBTITLE: 'privacy.subtitle',
    LAST_UPDATED: 'privacy.lastUpdated',
    INTRODUCTION: 'privacy.introduction',
    INFO_COLLECTION: 'privacy.infoCollection',
    PERSONAL_INFO: 'privacy.personalInfo',
    NON_PERSONAL_INFO: 'privacy.nonPersonalInfo',
    INFO_USAGE: 'privacy.infoUsage',
    INFO_SHARING: 'privacy.infoSharing',
    DATA_SECURITY: 'privacy.dataSecurity',
    COOKIES: 'privacy.cookies',
    YOUR_RIGHTS: 'privacy.yourRights',
    CHILDREN_PRIVACY: 'privacy.childrenPrivacy',
    UPDATES: 'privacy.updates',
    CONTACT_INFO: 'privacy.contactInfo'
  },

  // Pages - Terms of Service
  TERMS: {
    TITLE: 'terms.title',
    SUBTITLE: 'terms.subtitle',
    LAST_UPDATED: 'terms.lastUpdated',
    INTRODUCTION: 'terms.introduction',
    SERVICE_DESCRIPTION: 'terms.serviceDescription',
    USER_ACCOUNTS: 'terms.userAccounts',
    USER_CONTENT: 'terms.userContent',
    PROHIBITED_USES: 'terms.prohibitedUses',
    INTELLECTUAL_PROPERTY: 'terms.intellectualProperty',
    PRIVACY_REFERENCE: 'terms.privacyReference',
    DISCLAIMERS: 'terms.disclaimers',
    COMMUNITY_STANDARDS: 'terms.communityStandards',
    TERMINATION: 'terms.termination',
    CHANGES_TO_TERMS: 'terms.changesToTerms',
    GOVERNING_LAW: 'terms.governingLaw',
    CONTACT_INFO: 'terms.contactInfo'
  },

  // Pages - Accessibility
  ACCESSIBILITY: {
    TITLE: 'accessibility.title',
    SUBTITLE: 'accessibility.subtitle',
    COMMITMENT: 'accessibility.commitment',
    STANDARDS: 'accessibility.standards',
    FEATURES: 'accessibility.features',
    ASSISTIVE_TECH: 'accessibility.assistiveTech',
    BROWSER_SUPPORT: 'accessibility.browserSupport',
    PDF_ACCESSIBILITY: 'accessibility.pdfAccessibility',
    KNOWN_ISSUES: 'accessibility.knownIssues',
    USER_INSTRUCTIONS: 'accessibility.userInstructions',
    THIRD_PARTY: 'accessibility.thirdParty',
    FEEDBACK_SUPPORT: 'accessibility.feedbackSupport',
    LEGAL_INFO: 'accessibility.legalInfo',
    CONTACT_INFO: 'accessibility.contactInfo'
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
