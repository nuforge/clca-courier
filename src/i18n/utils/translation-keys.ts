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
    // Core Actions
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
    TOGGLE: 'common.toggle',
    RETRY: 'common.retry',
    CLEAR_SELECTION: 'common.clearSelection',
    BY: 'common.by',
    BACK_TO_TOP: 'common.backToTop',

    // Extended Actions (Phase 1 Consolidation)
    ACTIONS: {
      SAVE: 'common.actions.save',
      SAVE_CHANGES: 'common.actions.saveChanges',
      SAVE_SETTINGS: 'common.actions.saveSettings',
      SAVE_THEME: 'common.actions.saveTheme',
      CANCEL: 'common.actions.cancel',
      SUBMIT: 'common.actions.submit',
      SUBMIT_IDEAS: 'common.actions.submitIdeas',
      SUBMIT_CONTENT: 'common.actions.submitContent',
      EDIT: 'common.actions.edit',
      DELETE: 'common.actions.delete',
      REMOVE: 'common.actions.remove',
      CONTINUE: 'common.actions.continue',
      BACK: 'common.actions.back',
      NEXT: 'common.actions.next',
      PREVIOUS: 'common.actions.previous',
      RESET: 'common.actions.reset',
      RESET_TO_DEFAULTS: 'common.actions.resetToDefaults',
      CONFIRM: 'common.actions.confirm',
      VIEW: 'common.actions.view',
      OPEN: 'common.actions.open',
      CLOSE: 'common.actions.close',
      COPY: 'common.actions.copy',
      COPY_TO_CLIPBOARD: 'common.actions.copyToClipboard',
      CLEAR: 'common.actions.clear',
      CLEAR_LOCAL_STORAGE: 'common.actions.clearLocalStorage',
      EXPORT: 'common.actions.export',
      EXPORT_SETTINGS: 'common.actions.exportSettings',
      IMPORT: 'common.actions.import',
      IMPORT_SETTINGS: 'common.actions.importSettings',
      UPDATE: 'common.actions.update',
      MODIFY: 'common.actions.modify',
      APPROVE: 'common.actions.approve',
      REJECT: 'common.actions.reject',
      PUBLISH: 'common.actions.publish',
      UNPUBLISH: 'common.actions.unpublish'
    },

    // Status and States (Phase 3 preparation)
    STATUS: {
      PENDING: 'common.status.pending',
      APPROVED: 'common.status.approved',
      PUBLISHED: 'common.status.published',
      REJECTED: 'common.status.rejected',
      DRAFT: 'common.status.draft',
      ACTIVE: 'common.status.active',
      INACTIVE: 'common.status.inactive',
      LOADING: 'common.status.loading',
      PROCESSING: 'common.status.processing',
      COMPLETED: 'common.status.completed',
      FAILED: 'common.status.failed',
      SUCCESS: 'common.status.success',
      ERROR: 'common.status.error',
      WARNING: 'common.status.warning'
    },

    // Accessibility Labels
    ACCESSIBILITY: {
      CLOSE_DIALOG: 'common.accessibility.closeDialog',
      OPEN_MENU: 'common.accessibility.openMenu',
      TOGGLE_THEME: 'common.accessibility.toggleTheme',
      EXPAND_SECTION: 'common.accessibility.expandSection',
      COLLAPSE_SECTION: 'common.accessibility.collapseSection',
      CLAIM_TASK: 'common.accessibility.claimTask',
      NAVIGATE_BACK: 'common.accessibility.navigateBack',
      NAVIGATE_FORWARD: 'common.accessibility.navigateForward'
    }
  },

  // Forms and Validation
  FORMS: {
    // Legacy Form Fields (maintained for compatibility)
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

    // Standardized Common Fields (Phase 2 Consolidation)
    COMMON_FIELDS: {
      NAME: 'forms.commonFields.name',
      YOUR_NAME: 'forms.commonFields.yourName',
      FULL_NAME: 'forms.commonFields.fullName',
      EMAIL: 'forms.commonFields.email',
      EMAIL_ADDRESS: 'forms.commonFields.emailAddress',
      TITLE: 'forms.commonFields.title',
      DESCRIPTION: 'forms.commonFields.description',
      DETAILED_DESCRIPTION: 'forms.commonFields.detailedDescription',
      CATEGORY: 'forms.commonFields.category',
      CONTENT_CATEGORY: 'forms.commonFields.contentCategory',
      IDEA_CATEGORY: 'forms.commonFields.ideaCategory',
      PHOTO_CATEGORY: 'forms.commonFields.photoCategory',
      DATE: 'forms.commonFields.date',
      DATE_TAKEN: 'forms.commonFields.dateTaken',
      TIME: 'forms.commonFields.time',
      LOCATION: 'forms.commonFields.location',
      PHOTO_LOCATION: 'forms.commonFields.photoLocation',
      PRIORITY: 'forms.commonFields.priority',
      PRIORITY_LEVEL: 'forms.commonFields.priorityLevel',
      PHONE: 'forms.commonFields.phone',
      PHONE_NUMBER: 'forms.commonFields.phoneNumber',
      MESSAGE: 'forms.commonFields.message',
      ADDITIONAL_INFO: 'forms.commonFields.additionalInfo',
      PHOTO_TITLE: 'forms.commonFields.photoTitle',
      IDEA_TITLE: 'forms.commonFields.ideaTitle'
    },

    // Form Labels and Hints
    LABELS: {
      REQUIRED: 'forms.labels.required',
      OPTIONAL: 'forms.labels.optional',
      SELECT_OPTION: 'forms.labels.selectOption',
      CHOOSE_FILE: 'forms.labels.chooseFile',
      UPLOAD_IMAGE: 'forms.labels.uploadImage'
    },

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
      PHOTO: 'content.types.photo',
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
      UNFEATURE: 'content.actions.unfeature',
      APPROVE_SUCCESS: 'content.actions.approveSuccess',
      APPROVE_ERROR: 'content.actions.approveError'
    },
    PRINT: {
      AUTO_EXPORT_SUCCESS: 'content.print.autoExportSuccess',
      AUTO_EXPORT_FAILED: 'content.print.autoExportFailed',
      PRINT_READY: 'content.print.printReady',
      CLAIMED: 'content.print.claimed',
      COMPLETED: 'content.print.completed',
      CLAIM_JOB: 'content.print.claimJob',
      COMPLETE_JOB: 'content.print.completeJob',
      PRINT_QUEUE: 'content.print.printQueue',
      NO_PRINT_JOBS: 'content.print.noPrintJobs',
      QUANTITY: 'content.print.quantity'
    },

    // Calendar-specific content
    CALENDAR: {
      TITLE: 'content.calendar.title',
      SUBTITLE: 'content.calendar.subtitle',
      NO_EVENTS: 'content.calendar.noEvents',
      NO_EVENTS_FOR_DATE: 'content.calendar.noEventsForDate',
      NO_EVENTS_FOR_MONTH: 'content.calendar.noEventsForMonth',
      UPCOMING_EVENTS: 'content.calendar.upcomingEvents',
      ALL_UPCOMING_EVENTS: 'content.calendar.allUpcomingEvents',
      EVENTS_ON_DATE: 'content.calendar.eventsOnDate',
      VIEW_ALL_UPCOMING: 'content.calendar.viewAllUpcoming',
      TODAY: 'content.calendar.today',
      ALL_DAY: 'content.calendar.allDay',
      EVENT_DETAILS: 'content.calendar.eventDetails',
      EXPORT_TO_CALENDAR: 'content.calendar.exportToCalendar',
      SHARE_EVENT: 'content.calendar.shareEvent',
      COPY_DETAILS: 'content.calendar.copyDetails',
      CONTACT_ORGANIZER: 'content.calendar.contactOrganizer',
      VIEW_ON_MAP: 'content.calendar.viewOnMap',
      EVENT_EXPORTED: 'content.calendar.eventExported',
      EVENT_SHARED: 'content.calendar.eventShared',
      EVENT_COPIED: 'content.calendar.eventCopied',
      EVENT_COPY_FAILED: 'content.calendar.eventCopyFailed',
      FILTERS: {
        EVENT_TYPES: 'content.calendar.filters.eventTypes',
        FEATURED_ONLY: 'content.calendar.filters.featuredOnly',
        CLEAR_FILTERS: 'content.calendar.filters.clearFilters',
        APPLY_FILTERS: 'content.calendar.filters.applyFilters'
      },
      NAVIGATION: {
        PREVIOUS_MONTH: 'content.calendar.navigation.previousMonth',
        NEXT_MONTH: 'content.calendar.navigation.nextMonth',
        GO_TO_TODAY: 'content.calendar.navigation.goToToday'
      },
      RECURRENCE: {
        NONE: 'content.calendar.recurrence.none',
        DAILY: 'content.calendar.recurrence.daily',
        WEEKLY: 'content.calendar.recurrence.weekly',
        MONTHLY: 'content.calendar.recurrence.monthly',
        YEARLY: 'content.calendar.recurrence.yearly',
        EVERY_N_DAYS: 'content.calendar.recurrence.everyNDays',
        EVERY_N_WEEKS: 'content.calendar.recurrence.everyNWeeks',
        EVERY_N_MONTHS: 'content.calendar.recurrence.everyNMonths',
        EVERY_N_YEARS: 'content.calendar.recurrence.everyNYears'
      }
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
    READY_FOR_DOWNLOAD: 'canva.readyForDownload',
    // Template Selection
    SELECT_TEMPLATE: 'canva.selectTemplate',
    SELECT_TEMPLATE_DESCRIPTION: 'canva.selectTemplateDescription',
    LOADING_TEMPLATES: 'canva.loadingTemplates',
    NO_TEMPLATES_AVAILABLE: 'canva.noTemplatesAvailable',
    TEMPLATE_INACTIVE: 'canva.templateInactive',
    TEMPLATE_INACTIVE_WARNING: 'canva.templateInactiveWarning',
    TEMPLATE_SELECTED: 'canva.templateSelected',
    NO_DESCRIPTION: 'canva.noDescription',
    MAPPED_FIELDS: 'canva.mappedFields',
    FIELD_MAPPING_DETAILS: 'canva.fieldMappingDetails',
    LOAD_TEMPLATES_ERROR: 'canva.loadTemplatesError',
    DESIGN_CREATING: 'canva.designCreating',
    // Page Integration
    DESIGN_WITH_TEMPLATES: 'canva.designWithTemplates',
    TEMPLATES_AVAILABLE_MESSAGE: 'canva.templatesAvailableMessage',
    LEARN_MORE: 'canva.learnMore',
    // OAuth specific keys
    OAUTH_INITIATED: 'canva.oauthInitiated',
    OAUTH_SUCCESS: 'canva.oauthSuccess',
    OAUTH_CANCELLED: 'canva.oauthCancelled',
    OAUTH_ERROR: 'canva.oauthError',
    CONNECTING_TO_CANVA: 'canva.connectingToCanva',
    CONNECTED_TO_CANVA: 'canva.connectedToCanva',
    SIGN_OUT_SUCCESS: 'canva.signOutSuccess'
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

  // Home/Index Page
  HOME: {
    HERO: {
      TITLE: 'pages.home.hero.title',
      SUBTITLE: 'pages.home.hero.subtitle',
      LATEST_NEWS: 'pages.home.hero.latestNews',
      CONTRIBUTE: 'pages.home.hero.contribute'
    },
    QUICK_LINKS: {
      SECTION_TITLE: 'pages.home.quickLinks.sectionTitle',
      NEWS_UPDATES: {
        TITLE: 'pages.home.quickLinks.newsUpdates.title',
        DESCRIPTION: 'pages.home.quickLinks.newsUpdates.description'
      },
      CLASSIFIEDS_ADS: {
        TITLE: 'pages.home.quickLinks.classifiedsAds.title',
        DESCRIPTION: 'pages.home.quickLinks.classifiedsAds.description'
      },
      COMMUNITY_CALENDAR: {
        TITLE: 'pages.home.quickLinks.communityCalendar.title',
        DESCRIPTION: 'pages.home.quickLinks.communityCalendar.description'
      },
      ISSUE_ARCHIVE: {
        TITLE: 'pages.home.quickLinks.issueArchive.title',
        DESCRIPTION: 'pages.home.quickLinks.issueArchive.description'
      },
      CONTRIBUTE: {
        TITLE: 'pages.home.quickLinks.contribute.title',
        DESCRIPTION: 'pages.home.quickLinks.contribute.description'
      },
      ABOUT_CONTACT: {
        TITLE: 'pages.home.quickLinks.aboutContact.title',
        DESCRIPTION: 'pages.home.quickLinks.aboutContact.description'
      }
    },
    CONTENT_PREVIEW: {
      LATEST_CONTENT: 'pages.home.contentPreview.latestContent',
      UPCOMING_EVENTS: 'pages.home.contentPreview.upcomingEvents',
      DATE_TBD: 'pages.home.contentPreview.dateTbd',
      LATEST_UPDATES: 'pages.home.contentPreview.latestUpdates',
      RECENT_CLASSIFIEDS: 'pages.home.contentPreview.recentClassifieds',
      VIEW_ALL_EVENTS: 'pages.home.contentPreview.viewAllEvents',
      BROWSE_CLASSIFIEDS: 'pages.home.contentPreview.browseClassifieds',
      NO_CONTENT_AVAILABLE: 'pages.home.contentPreview.noContentAvailable'
    },
    COMMUNITY_STATS: {
      TITLE: 'pages.home.communityStats.title',
      HOUSEHOLDS: 'pages.home.communityStats.households',
      LAKES: 'pages.home.communityStats.lakes',
      YEARS: 'pages.home.communityStats.years',
      ISSUES_PER_YEAR: 'pages.home.communityStats.issuesPerYear'
    }
  },

  // Community Content Page
  COMMUNITY: {
    TITLE: 'pages.community.title',
    SUBTITLE: 'pages.community.subtitle',
    FILTERS: {
      ALL_CATEGORIES: 'pages.community.filters.allCategories',
      SEARCH: 'pages.community.filters.search',
      CLEAR_FILTERS: 'pages.community.filters.clearFilters',
      SORT_NEWEST_FIRST: 'pages.community.filters.sortNewestFirst',
      SORT_OLDEST_FIRST: 'pages.community.filters.sortOldestFirst'
    },
    VIEW_MODES: {
      LIST: 'pages.community.viewModes.list',
      CARD: 'pages.community.viewModes.card'
    },
    SECTIONS: {
      FEATURED_CONTENT: 'pages.community.sections.featuredContent',
      ALL_CONTENT: 'pages.community.sections.allContent',
      NO_CONTENT: 'pages.community.sections.noContent',
      NO_CONTENT_DESCRIPTION: 'pages.community.sections.noContentDescription'
    }
  },

  // Theme Editor Page
  THEME_EDITOR: {
    TITLE: 'pages.themeEditor.title',
    SUBTITLE: 'pages.themeEditor.subtitle',
    ACTIONS: {
      UNSAVED_CHANGES: 'pages.themeEditor.actions.unsavedChanges',
      RESET_TO_DEFAULTS: 'pages.themeEditor.actions.resetToDefaults',
      SAVE_THEME: 'pages.themeEditor.actions.saveTheme',
      COPY_TO_CLIPBOARD: 'pages.themeEditor.actions.copyToClipboard',
      CLEAR_LOCAL_STORAGE: 'pages.themeEditor.actions.clearLocalStorage'
    },
    TABS: {
      CONTENT_TYPES: 'pages.themeEditor.tabs.contentTypes',
      CATEGORIES: 'pages.themeEditor.tabs.categories',
      COLORS: 'pages.themeEditor.tabs.colors',
      STATUS: 'pages.themeEditor.tabs.status'
    },
    FIELDS: {
      DISPLAY_LABEL: 'pages.themeEditor.fields.displayLabel',
      ICON: 'pages.themeEditor.fields.icon',
      ICON_HINT: 'pages.themeEditor.fields.iconHint',
      COLOR: 'pages.themeEditor.fields.color',
      DESCRIPTION: 'pages.themeEditor.fields.description',
      LABEL: 'pages.themeEditor.fields.label'
    },
    SECTIONS: {
      CATEGORY_MAPPINGS: 'pages.themeEditor.sections.categoryMappings',
      CATEGORIES: 'pages.themeEditor.sections.categories',
      DEBUG_INFO: 'pages.themeEditor.sections.debugInfo',
      DEBUG_INFO_NOT_AVAILABLE: 'pages.themeEditor.sections.debugInfoNotAvailable'
    },
    COLORS: {
      PRIMARY: 'pages.themeEditor.colors.primary',
      SECONDARY: 'pages.themeEditor.colors.secondary',
      ACCENT: 'pages.themeEditor.colors.accent',
      POSITIVE: 'pages.themeEditor.colors.positive',
      NEGATIVE: 'pages.themeEditor.colors.negative',
      WARNING: 'pages.themeEditor.colors.warning'
    },
    NOTIFICATIONS: {
      THEME_SAVED: 'pages.themeEditor.notifications.themeSaved',
      THEME_SAVE_FAILED: 'pages.themeEditor.notifications.themeSaveFailed',
      THEME_RESET: 'pages.themeEditor.notifications.themeReset',
      DEBUG_COPIED: 'pages.themeEditor.notifications.debugCopied',
      DEBUG_COPY_FAILED: 'pages.themeEditor.notifications.debugCopyFailed',
      LOCAL_STORAGE_CLEARED: 'pages.themeEditor.notifications.localStorageCleared'
    },
    CONFIRMATIONS: {
      RESET_TITLE: 'pages.themeEditor.confirmations.resetTitle',
      RESET_MESSAGE: 'pages.themeEditor.confirmations.resetMessage'
    }
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
    TITLE: 'pages.about.title',
    SUBTITLE: 'pages.about.subtitle',
    DESCRIPTION: 'pages.about.description',
    QUICK_CONTACT: 'pages.about.quickContact',
    OUR_MISSION: 'pages.about.ourMission',
    MISSION_DESCRIPTION: 'pages.about.missionDescription',
    WHAT_WE_DO: 'pages.about.whatWeDo',
    WHAT_WE_DO_DESCRIPTION: 'pages.about.whatWeDoDescription',
    WHAT_WE_COVER: 'pages.about.whatWeCover',
    COVERAGE: {
      COMMUNITY_EVENTS: {
        TITLE: 'pages.about.coverage.communityEvents.title',
        DESCRIPTION: 'pages.about.coverage.communityEvents.description'
      },
      LOCAL_NEWS: {
        TITLE: 'pages.about.coverage.localNews.title',
        DESCRIPTION: 'pages.about.coverage.localNews.description'
      },
      LAKE_ACTIVITIES: {
        TITLE: 'pages.about.coverage.lakeActivities.title',
        DESCRIPTION: 'pages.about.coverage.lakeActivities.description'
      },
      RESIDENT_SPOTLIGHTS: {
        TITLE: 'pages.about.coverage.residentSpotlights.title',
        DESCRIPTION: 'pages.about.coverage.residentSpotlights.description'
      }
    },
    HOW_TO_HELP: 'pages.about.howToHelp',
    HOW_TO_HELP_DESCRIPTION: 'pages.about.howToHelpDescription',
    VOLUNTEER: 'pages.about.volunteer',
    CONTRIBUTE: 'pages.about.contribute',
    CONTACT_SECTION: 'pages.about.contactSection',
    CONTACT_DESCRIPTION: 'pages.about.contactDescription',
    CONTACT_INFO: 'pages.about.contactInfo',
    CONTACT_INFO_DESCRIPTION: 'pages.about.contactInfoDescription',
    CONTACT_FORM: 'pages.about.contactForm',
    CONTACT_FORM_DESCRIPTION: 'pages.about.contactFormDescription',
    SUBJECT_OPTIONS: {
      GENERAL: 'pages.about.subjectOptions.general',
      ARTICLE: 'pages.about.subjectOptions.article',
      PHOTO: 'pages.about.subjectOptions.photo',
      EVENT: 'pages.about.subjectOptions.event',
      ADVERTISING: 'pages.about.subjectOptions.advertising',
      TECHNICAL: 'pages.about.subjectOptions.technical',
      FEEDBACK: 'pages.about.subjectOptions.feedback',
      OTHER: 'pages.about.subjectOptions.other'
    },
    COMMUNITY_STATS: {
      TITLE: 'pages.about.communityStats.title',
      HOUSEHOLDS: 'pages.about.communityStats.households',
      BEAUTIFUL_LAKES: 'pages.about.communityStats.beautifulLakes',
      ISSUES_PER_YEAR: 'pages.about.communityStats.issuesPerYear',
      YEARS_PUBLISHING: 'pages.about.communityStats.yearsPublishing'
    },
    GET_INVOLVED: {
      TITLE: 'pages.about.getInvolved.title',
      DESCRIPTION: 'pages.about.getInvolved.description',
      VOLUNTEER_BUTTON: 'pages.about.getInvolved.volunteerButton',
      CONTRIBUTE_BUTTON: 'pages.about.getInvolved.contributeButton'
    },
    CONTACT_FORM_DETAILS: {
      TITLE: 'pages.about.contactFormDetails.title',
      NAME_LABEL: 'pages.about.contactFormDetails.nameLabel',
      EMAIL_LABEL: 'pages.about.contactFormDetails.emailLabel',
      SUBJECT_LABEL: 'pages.about.contactFormDetails.subjectLabel',
      MESSAGE_LABEL: 'pages.about.contactFormDetails.messageLabel',
      SEND_BUTTON: 'pages.about.contactFormDetails.sendButton',
      NAME_REQUIRED: 'pages.about.contactFormDetails.nameRequired',
      EMAIL_REQUIRED: 'pages.about.contactFormDetails.emailRequired',
      SUBJECT_REQUIRED: 'pages.about.contactFormDetails.subjectRequired',
      MESSAGE_REQUIRED: 'pages.about.contactFormDetails.messageRequired'
    },
    CONTACT_INFO_DETAILS: {
      EMAIL: 'pages.about.contactInfoDetails.email',
      PHONE: 'pages.about.contactInfoDetails.phone',
      ADDRESS: 'pages.about.contactInfoDetails.address',
      OFFICE_HOURS: 'pages.about.contactInfoDetails.officeHours',
      EMAIL_VALUE: 'pages.about.contactInfoDetails.emailValue',
      PHONE_VALUE: 'pages.about.contactInfoDetails.phoneValue',
      ADDRESS_VALUE: 'pages.about.contactInfoDetails.addressValue',
      OFFICE_HOURS_VALUE: 'pages.about.contactInfoDetails.officeHoursValue'
    },
    EDITORIAL_TEAM: {
      TITLE: 'pages.about.editorialTeam.title',
      EDITOR_IN_CHIEF: 'pages.about.editorialTeam.editorInChief',
      PHOTOGRAPHY_EDITOR: 'pages.about.editorialTeam.photographyEditor',
      COMMUNITY_REPORTER: 'pages.about.editorialTeam.communityReporter'
    }
  },

  // Pages - Contribute
  CONTRIBUTE: {
    TITLE: 'pages.contribute.title',
    SUBTITLE: 'pages.contribute.subtitle',
    SELECT_TYPE: 'pages.contribute.selectType',
    CONTENT_TYPES: {
      NEWS: {
        TITLE: 'pages.contribute.contentTypes.news.title',
        DESCRIPTION: 'pages.contribute.contentTypes.news.description',
        ICON: 'pages.contribute.contentTypes.news.icon'
      },
      PHOTOS: {
        TITLE: 'pages.contribute.contentTypes.photos.title',
        DESCRIPTION: 'pages.contribute.contentTypes.photos.description',
        ICON: 'pages.contribute.contentTypes.photos.icon'
      },
      EVENTS: {
        TITLE: 'pages.contribute.contentTypes.events.title',
        DESCRIPTION: 'pages.contribute.contentTypes.events.description',
        ICON: 'pages.contribute.contentTypes.events.icon'
      },
      ANNOUNCEMENTS: {
        TITLE: 'pages.contribute.contentTypes.announcements.title',
        DESCRIPTION: 'pages.contribute.contentTypes.announcements.description',
        ICON: 'pages.contribute.contentTypes.announcements.icon'
      },
      CLASSIFIEDS: {
        TITLE: 'pages.contribute.contentTypes.classifieds.title',
        DESCRIPTION: 'pages.contribute.contentTypes.classifieds.description',
        ICON: 'pages.contribute.contentTypes.classifieds.icon'
      }
    },
    REQUIREMENTS: 'pages.contribute.requirements',
    PREPARE_CONTENT: 'pages.contribute.prepareContent',
    PREPARATION_CHECKLIST: 'pages.contribute.preparationChecklist',
    CHECK_CONTENT: 'pages.contribute.checkContent',
    CHECK_IMAGES: 'pages.contribute.checkImages',
    CHECK_DETAILS: 'pages.contribute.checkDetails',
    QUICK_SUBMIT: 'pages.contribute.quickSubmit',
    PROCEED_TO_FORM: 'pages.contribute.proceedToForm',
    BACK_TO_SELECTION: 'pages.contribute.backToSelection',
    HELP_RESOURCES: 'pages.contribute.helpResources',
    PROCESS_STEPS: {
      SELECT: {
        TITLE: 'pages.contribute.processSteps.select.title',
        DESCRIPTION: 'pages.contribute.processSteps.select.description'
      },
      PREPARE: {
        TITLE: 'pages.contribute.processSteps.prepare.title',
        DESCRIPTION: 'pages.contribute.processSteps.prepare.description'
      },
      SUBMIT: {
        TITLE: 'pages.contribute.processSteps.submit.title',
        DESCRIPTION: 'pages.contribute.processSteps.submit.description'
      },
      REVIEW: {
        TITLE: 'pages.contribute.processSteps.review.title',
        DESCRIPTION: 'pages.contribute.processSteps.review.description'
      },
      PUBLISH: {
        TITLE: 'pages.contribute.processSteps.publish.title',
        DESCRIPTION: 'pages.contribute.processSteps.publish.description'
      }
    }
  },

  // Pages - Contribute Guide
  CONTRIBUTE_GUIDE: {
    TITLE: 'pages.contributeGuide.title',
    SUBTITLE: 'pages.contributeGuide.subtitle',
    OVERVIEW: 'pages.contributeGuide.overview',
    PROCESS: 'pages.contributeGuide.process',
    GUIDELINES: 'pages.contributeGuide.guidelines',
    QUALITY_STANDARDS: 'pages.contributeGuide.qualityStandards',
    FAQ: 'pages.contributeGuide.faq',
    POSITIVE_GUIDELINES: 'pages.contributeGuide.positiveGuidelines',
    NEGATIVE_GUIDELINES: 'pages.contributeGuide.negativeGuidelines',
    REVIEW_PHASES: 'pages.contributeGuide.reviewPhases'
  },

  // Pages - Settings
  SETTINGS_PAGE: {
    TITLE: 'pages.settingsPage.title',
    SUBTITLE: 'pages.settingsPage.subtitle',
    THEME_SETTINGS: 'pages.settingsPage.themeSettings',
    THEME_DESCRIPTION: 'pages.settingsPage.themeDescription',
    LIGHT_THEME: 'pages.settingsPage.lightTheme',
    DARK_THEME: 'pages.settingsPage.darkTheme',
    AUTO_THEME: 'pages.settingsPage.autoTheme',
    NOTIFICATION_SETTINGS: 'pages.settingsPage.notificationSettings',
    NOTIFICATION_DESCRIPTION: 'pages.settingsPage.notificationDescription',
    EMAIL_NOTIFICATIONS: 'pages.settingsPage.emailNotifications',
    PUSH_NOTIFICATIONS: 'pages.settingsPage.pushNotifications',
    NEWSLETTER_UPDATES: 'pages.settingsPage.newsletterUpdates',
    CONTENT_UPDATES: 'pages.settingsPage.contentUpdates',
    DISPLAY_SETTINGS: 'pages.settingsPage.displaySettings',
    DISPLAY_DESCRIPTION: 'pages.settingsPage.displayDescription',
    COMPACT_MODE: 'pages.settingsPage.compactMode',
    SHOW_TIMESTAMPS: 'pages.settingsPage.showTimestamps',
    ANIMATE_TRANSITIONS: 'pages.settingsPage.animateTransitions',
    PDF_SETTINGS: 'pages.settingsPage.pdfSettings',
    PDF_DESCRIPTION: 'pages.settingsPage.pdfDescription',
    DEFAULT_ZOOM: 'pages.settingsPage.defaultZoom',
    PREFERRED_VIEWER: 'pages.settingsPage.preferredViewer',
    PDFTRON_VIEWER: 'pages.settingsPage.pdftronViewer',
    PDFJS_VIEWER: 'pages.settingsPage.pdfjsViewer',
    BACKUP_SETTINGS: 'pages.settingsPage.backupSettings',
    BACKUP_DESCRIPTION: 'pages.settingsPage.backupDescription',
    EXPORT_SETTINGS: 'pages.settingsPage.exportSettings',
    IMPORT_SETTINGS: 'pages.settingsPage.importSettings',
    RESET_ALL: 'pages.settingsPage.resetAll',
    RESET_CONFIRMATION: 'pages.settingsPage.resetConfirmation',
    RESET_WARNING: 'pages.settingsPage.resetWarning',
    LANGUAGE_SETTINGS: 'pages.settingsPage.languageSettings',
    LANGUAGE_DESCRIPTION: 'pages.settingsPage.languageDescription',
    CURRENT_LANGUAGE: 'pages.settingsPage.currentLanguage',
    SELECT_LANGUAGE: 'pages.settingsPage.selectLanguage'
  },

  // Pages - Privacy Policy
  PRIVACY: {
    TITLE: 'pages.privacy.title',
    SUBTITLE: 'pages.privacy.subtitle',
    LAST_UPDATED: 'pages.privacy.lastUpdated',
    INTRODUCTION: 'pages.privacy.introduction',
    INFO_COLLECTION: 'pages.privacy.infoCollection',
    PERSONAL_INFO: 'pages.privacy.personalInfo',
    NON_PERSONAL_INFO: 'pages.privacy.nonPersonalInfo',
    INFO_USAGE: 'pages.privacy.infoUsage',
    INFO_SHARING: 'pages.privacy.infoSharing',
    DATA_SECURITY: 'pages.privacy.dataSecurity',
    COOKIES: 'pages.privacy.cookies',
    YOUR_RIGHTS: 'pages.privacy.yourRights',
    CHILDREN_PRIVACY: 'pages.privacy.childrenPrivacy',
    UPDATES: 'pages.privacy.updates',
    CONTACT_INFO: 'pages.privacy.contactInfo'
  },

  // Pages - Terms of Service
  TERMS: {
    TITLE: 'pages.terms.title',
    SUBTITLE: 'pages.terms.subtitle',
    LAST_UPDATED: 'pages.terms.lastUpdated',
    INTRODUCTION: 'pages.terms.introduction',
    SERVICE_DESCRIPTION: 'pages.terms.serviceDescription',
    USER_ACCOUNTS: 'pages.terms.userAccounts',
    USER_CONTENT: 'pages.terms.userContent',
    PROHIBITED_USES: 'pages.terms.prohibitedUses',
    INTELLECTUAL_PROPERTY: 'pages.terms.intellectualProperty',
    PRIVACY_REFERENCE: 'pages.terms.privacyReference',
    DISCLAIMERS: 'pages.terms.disclaimers',
    COMMUNITY_STANDARDS: 'pages.terms.communityStandards',
    TERMINATION: 'pages.terms.termination',
    CHANGES_TO_TERMS: 'pages.terms.changesToTerms',
    GOVERNING_LAW: 'pages.terms.governingLaw',
    CONTACT_INFO: 'pages.terms.contactInfo'
  },

  // Pages - Accessibility
  ACCESSIBILITY: {
    TITLE: 'pages.accessibility.title',
    SUBTITLE: 'pages.accessibility.subtitle',
    COMMITMENT: 'pages.accessibility.commitment',
    STANDARDS: 'pages.accessibility.standards',
    FEATURES: 'pages.accessibility.features',
    ASSISTIVE_TECH: 'pages.accessibility.assistiveTech',
    BROWSER_SUPPORT: 'pages.accessibility.browserSupport',
    PDF_ACCESSIBILITY: 'pages.accessibility.pdfAccessibility',
    KNOWN_ISSUES: 'pages.accessibility.knownIssues',
    USER_INSTRUCTIONS: 'pages.accessibility.userInstructions',
    THIRD_PARTY: 'pages.accessibility.thirdParty',
    FEEDBACK_SUPPORT: 'pages.accessibility.feedbackSupport',
    LEGAL_INFO: 'pages.accessibility.legalInfo',
    CONTACT_INFO: 'pages.accessibility.contactInfo'
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
