/**
 * UI Icons Constants
 * Centralized constants for non-content UI icons to ensure consistency
 * These are structural/functional icons, not content-themed icons
 */

export const UI_ICONS = {
  // Navigation
  menu: 'menu',
  chevronLeft: 'mdi-chevron-left',
  chevronRight: 'mdi-chevron-right',
  close: 'close',

  // Actions
  create: 'create',
  edit: 'mdi-pencil',
  delete: 'mdi-delete',
  save: 'mdi-content-save',
  saveAlert: 'mdi-content-save-alert',
  restore: 'mdi-restore',
  refresh: 'mdi-reload',
  upload: 'mdi-upload',
  download: 'mdi-download',
  copy: 'mdi-content-copy',
  checkAll: 'mdi-check-all',
  rejectAll: 'mdi-close-box-multiple',
  plus: 'mdi-plus',
  documentPlus: 'mdi-file-document-plus',
  bookPlus: 'mdi-book-plus',

  // Search & Filters
  search: 'search',
  searchOff: 'search_off',
  filter: 'mdi-filter',
  clear: 'clear',

  // Communication
  phone: 'phone',
  email: 'email',

  // States & Feedback
  loading: 'mdi-loading',
  check: 'mdi-check',
  checkCircle: 'mdi-check-circle',
  warning: 'mdi-alert',
  error: 'mdi-close-circle',
  info: 'mdi-information',

  // Authentication
  login: 'mdi-google',
  logout: 'mdi-logout',
  account: 'mdi-account',
  accountGroup: 'mdi-account-group',
  accountCog: 'mdi-account-cog',
  accountPlus: 'mdi-account-plus',
  accountKey: 'mdi-account-key',

  // Theme Editor UI
  palette: 'mdi-palette',
  paletteOutline: 'mdi-palette-outline',
  eye: 'mdi-eye',
  fileMultiple: 'mdi-file-document-multiple',
  tagMultiple: 'mdi-tag-multiple',
  circleOutline: 'mdi-circle-outline',
  colorFill: 'mdi-format-color-fill',

  // Calendar & Time
  calendar: 'mdi-calendar',
  calendarToday: 'mdi-calendar-today',
  clock: 'mdi-clock',
  timeline: 'mdi-timeline-clock',

  // Files & Documents
  filePdf: 'mdi-file-pdf-box',

  // Print Workflow
  print: 'mdi-printer',
  printQueue: 'mdi-printer-pos',
  claim: 'mdi-hand-okay',
  claimed: 'mdi-hand-okay',
  complete: 'mdi-check-circle',
  quantity: 'mdi-counter',
  date: 'mdi-calendar-clock',

  // Settings
  cog: 'mdi-cog',
  tools: 'mdi-tools',
  globe: 'mdi-earth',
  language: 'mdi-translate',

  // Misc
  help: 'mdi-help-circle',
  target: 'mdi-target',
  shield: 'mdi-shield-crown',

  // Brand integrations
  canva: 'canva-icon', // Custom Canva icon component identifier
  canvaType: 'canva-type', // Canva type logo identifier
} as const;

export type UIIconKey = keyof typeof UI_ICONS;
export type UIIconValue = typeof UI_ICONS[UIIconKey];

/**
 * Get a UI icon by key with fallback
 */
export function getUIIcon(key: UIIconKey, fallback: string = 'mdi-help-circle'): string {
  return UI_ICONS[key] || fallback;
}

/**
 * Icon categories for different UI contexts
 */
export const ICON_CATEGORIES = {
  navigation: ['menu', 'chevronLeft', 'chevronRight', 'close'] as const,
  actions: ['create', 'edit', 'delete', 'save', 'saveAlert', 'restore', 'refresh', 'upload', 'download', 'copy', 'checkAll', 'rejectAll', 'plus', 'documentPlus', 'bookPlus'] as const,
  search: ['search', 'searchOff', 'filter', 'clear'] as const,
  communication: ['phone', 'email'] as const,
  feedback: ['loading', 'check', 'warning', 'error', 'info'] as const,
  auth: ['login', 'logout', 'account', 'accountGroup', 'accountCog', 'accountPlus', 'accountKey'] as const,
  themeEditor: ['palette', 'paletteOutline', 'eye', 'fileMultiple', 'tagMultiple', 'circleOutline', 'colorFill'] as const,
} as const;
