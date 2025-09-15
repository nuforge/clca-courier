import { vi } from 'vitest'

/**
 * Quasar Mock for Vitest Testing
 * Based on: https://blog.albert.do/quasar-mock-vitest/
 *
 * This mock provides all the Quasar properties used in components
 * including screen size, language, theme, notifications, and more.
 */
export default {
  // Screen size detection
  screen: {
    gt: {
      xs: true,
      sm: true,
      md: true,
      lg: true,
      xl: true
    },
    lt: {
      xs: false,
      sm: false,
      md: false,
      lg: false,
      xl: false
    },
    xs: false,
    sm: true,
    md: true,
    lg: true,
    xl: true
  },

  // Dark mode detection
  dark: {
    isActive: false
  },

  // Icon set configuration
  iconSet: {
    arrow: { dropdown: 'arrow_drop_down' },
    chevron: { left: 'chevron_left', right: 'chevron_right' },
    close: { icon: 'close' },
    menu: { icon: 'menu' },
    search: { icon: 'search' },
    clear: { icon: 'clear' },
    edit: { icon: 'edit' },
    delete: { icon: 'delete' },
    save: { icon: 'save' },
    cancel: { icon: 'cancel' },
    add: { icon: 'add' },
    remove: { icon: 'remove' },
    refresh: { icon: 'refresh' },
    upload: { icon: 'cloud_upload' },
    download: { icon: 'cloud_download' }
  },

  // Language and localization
  lang: {
    label: {
      collapse: vi.fn(),
      expand: vi.fn(),
      "clear": "Clear",
      "ok": "OK",
      "cancel": "Cancel",
      "close": "Close",
      "set": vi.fn(),
      "select": "Select",
      "reset": "Reset",
      "remove": "Remove",
      "update": "Update",
      "create": "Create",
      "search": "Search",
      "filter": "Filter",
      "refresh": "Refresh",
      "save": "Save",
      "delete": "Delete",
      "edit": "Edit",
      "add": "Add",
      "upload": "Upload",
      "download": "Download"
    }
  },

  // Notification system
  notify: {
    mounted: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    dismiss: vi.fn()
  },

  // Loading system
  loading: {
    show: vi.fn(),
    hide: vi.fn(),
    isActive: false
  },

  // Dialog system
  dialog: {
    create: vi.fn(),
    update: vi.fn(),
    dismiss: vi.fn()
  },

  // Local storage
  localStorage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
    getAllKeys: vi.fn(),
    isEmpty: vi.fn(),
    getLength: vi.fn()
  },

  // Session storage
  sessionStorage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
    getAllKeys: vi.fn(),
    isEmpty: vi.fn(),
    getLength: vi.fn()
  },

  // Platform detection
  platform: {
    is: {
      electron: false,
      cordova: false,
      capacitor: false,
      bex: false,
      chrome: true,
      firefox: false,
      safari: false,
      edge: false,
      opera: false,
      win: false,
      mac: false,
      linux: false,
      android: false,
      ios: false
    },
    has: {
      touch: false,
      webStorage: true
    }
  },

  // Date utilities
  date: {
    formatDate: vi.fn((date) => date?.toString() || ''),
    formatTime: vi.fn((date) => date?.toString() || ''),
    formatDateTime: vi.fn((date) => date?.toString() || ''),
    addToDate: vi.fn((date, change) => date),
    subtractFromDate: vi.fn((date, change) => date),
    isSameDate: vi.fn(() => false),
    isBetweenDates: vi.fn(() => false),
    getDateDiff: vi.fn(() => 0),
    startOfDate: vi.fn((date) => date),
    endOfDate: vi.fn((date) => date)
  },

  // Color utilities
  colors: {
    lighten: vi.fn((color, percent) => color),
    darken: vi.fn((color, percent) => color),
    hexToRgb: vi.fn((hex) => ({ r: 0, g: 0, b: 0 })),
    rgbToHex: vi.fn((r, g, b) => '#000000'),
    changeAlpha: vi.fn((color, alpha) => color)
  }
}
