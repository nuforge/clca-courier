/**
 * Centralized Site Theme Configuration
 * Single source of truth for all colors, icons, and category definitions
 */

export interface ThemeConfig {
  colors: ColorScheme;
  contentTypes: ContentTypeConfig;
  categoryMappings: CategoryMappings;
  statusMappings: StatusMappings;
}

export interface ColorScheme {
  // Primary brand colors
  primary: string;
  secondary: string;
  accent: string;

  // Semantic colors
  positive: string;
  negative: string;
  warning: string;
  info: string;

  // Content type colors
  contentTypes: {
    article: string;
    event: string;
    announcement: string;
    classified: string;
    photo: string;
    newsletter: string;
  };

  // Status colors
  status: {
    draft: string;
    pending: string;
    approved: string;
    published: string;
    rejected: string;
    featured: string;
  };

  // Category colors (for subcategories)
  categories: {
    // News categories
    news: string;
    community: string;
    recreation: string;

    // Event categories
    meeting: string;
    social: string;
    maintenance: string;

    // Classified categories
    forSale: string;
    services: string;
    wanted: string;
    free: string;
    housing: string;
  };
}

export interface ContentTypeConfig {
  [key: string]: {
    icon: string;
    color: string;
    label: string;
    description: string;
    subcategories?: string[];
  };
}

export interface CategoryMappings {
  [contentType: string]: {
    [subcategory: string]: {
      icon: string;
      color: string;
      label: string;
    };
  };
}

export interface StatusMappings {
  [status: string]: {
    icon: string;
    color: string;
    label: string;
    description: string;
  };
}

/**
 * Default Site Theme Configuration
 * Easily editable through admin interface
 */
export const DEFAULT_SITE_THEME: ThemeConfig = {
  colors: {
    // Primary brand colors (Quasar defaults)
    primary: '#1976d2',
    secondary: '#26a69a',
    accent: '#9c27b0',

    // Semantic colors
    positive: '#21ba45',
    negative: '#c10015',
    warning: '#f2c037',
    info: '#31ccec',

    // Content type colors
    contentTypes: {
      article: '#1976d2',      // Blue - primary
      event: '#9c27b0',        // Purple - accent
      announcement: '#21ba45',  // Green - positive
      classified: '#ff9800',   // Orange
      photo: '#26a69a',        // Teal - secondary
      newsletter: '#1976d2',   // Blue - primary
    },

    // Status colors
    status: {
      draft: '#9e9e9e',        // Grey
      pending: '#2196f3',      // Blue
      approved: '#4caf50',     // Green
      published: '#21ba45',    // Positive green
      rejected: '#c10015',     // Negative red
      featured: '#ffc107',     // Amber
    },

    // Category colors
    categories: {
      // News categories
      news: '#1976d2',         // Blue
      community: '#26a69a',    // Teal
      recreation: '#00bcd4',   // Cyan

      // Event categories
      meeting: '#673ab7',      // Deep purple
      social: '#e91e63',       // Pink
      maintenance: '#795548',  // Brown

      // Classified categories
      forSale: '#4caf50',      // Green
      services: '#2196f3',     // Blue
      wanted: '#ff9800',       // Orange
      free: '#9c27b0',         // Purple
      housing: '#795548',      // Brown
    },
  },

  contentTypes: {
    article: {
      icon: 'mdi-newspaper-variant',
      color: 'contentTypes.article',
      label: 'Articles & Stories',
      description: 'In-depth articles, community stories, and feature content',
      subcategories: ['news', 'community', 'recreation'],
    },

    event: {
      icon: 'mdi-calendar-star',
      color: 'contentTypes.event',
      label: 'Events & Activities',
      description: 'Community events, meetings, and activities',
      subcategories: ['meeting', 'social', 'maintenance'],
    },

    announcement: {
      icon: 'mdi-bullhorn',
      color: 'contentTypes.announcement',
      label: 'Announcements',
      description: 'Official announcements and important notices',
      subcategories: ['news', 'community'],
    },

    classified: {
      icon: 'mdi-tag',
      color: 'contentTypes.classified',
      label: 'Classifieds',
      description: 'Marketplace items, services, and exchanges',
      subcategories: ['forSale', 'services', 'wanted', 'free', 'housing'],
    },

    photo: {
      icon: 'mdi-camera',
      color: 'contentTypes.photo',
      label: 'Photo Stories',
      description: 'Photo collections with captions and context',
      subcategories: ['community', 'recreation'],
    },

    newsletter: {
      icon: 'mdi-book-open-page-variant',
      color: 'contentTypes.newsletter',
      label: 'Newsletters',
      description: 'Official CLCA newsletter publications',
    },
  },

  categoryMappings: {
    article: {
      news: {
        icon: 'mdi-newspaper',
        color: 'categories.news',
        label: 'News',
      },
      community: {
        icon: 'mdi-account-group',
        color: 'categories.community',
        label: 'Community',
      },
      recreation: {
        icon: 'mdi-pool',
        color: 'categories.recreation',
        label: 'Recreation',
      },
    },

    event: {
      meeting: {
        icon: 'mdi-account-group',
        color: 'categories.meeting',
        label: 'Meeting',
      },
      social: {
        icon: 'mdi-party-popper',
        color: 'categories.social',
        label: 'Social Event',
      },
      maintenance: {
        icon: 'mdi-wrench',
        color: 'categories.maintenance',
        label: 'Maintenance',
      },
    },

    announcement: {
      news: {
        icon: 'mdi-newspaper',
        color: 'categories.news',
        label: 'News',
      },
      community: {
        icon: 'mdi-bullhorn',
        color: 'categories.community',
        label: 'Community',
      },
    },

    classified: {
      forSale: {
        icon: 'mdi-tag',
        color: 'categories.forSale',
        label: 'For Sale',
      },
      services: {
        icon: 'mdi-hammer-wrench',
        color: 'categories.services',
        label: 'Services',
      },
      wanted: {
        icon: 'mdi-magnify',
        color: 'categories.wanted',
        label: 'Wanted',
      },
      free: {
        icon: 'mdi-gift',
        color: 'categories.free',
        label: 'Free',
      },
      housing: {
        icon: 'mdi-home',
        color: 'categories.housing',
        label: 'Housing',
      },
    },

    photo: {
      community: {
        icon: 'mdi-camera-account',
        color: 'categories.community',
        label: 'Community Photos',
      },
      recreation: {
        icon: 'mdi-camera-outline',
        color: 'categories.recreation',
        label: 'Recreation Photos',
      },
    },
  },

  statusMappings: {
    draft: {
      icon: 'mdi-file-document-edit',
      color: 'status.draft',
      label: 'Draft',
      description: 'Content being worked on',
    },
    pending: {
      icon: 'mdi-clock-outline',
      color: 'status.pending',
      label: 'Pending Review',
      description: 'Submitted for admin review',
    },
    approved: {
      icon: 'mdi-check-circle',
      color: 'status.approved',
      label: 'Approved',
      description: 'Approved by admin, ready to publish',
    },
    published: {
      icon: 'mdi-earth',
      color: 'status.published',
      label: 'Published',
      description: 'Live and visible to public',
    },
    rejected: {
      icon: 'mdi-close-circle',
      color: 'status.rejected',
      label: 'Rejected',
      description: 'Not approved for publication',
    },
    featured: {
      icon: 'mdi-star',
      color: 'status.featured',
      label: 'Featured',
      description: 'Highlighted content',
    },
  },
};

/**
 * Helper function to resolve color references
 * Handles nested color references like 'contentTypes.article'
 */
export function resolveColor(colorRef: string, theme: ThemeConfig = DEFAULT_SITE_THEME): string {
  if (!colorRef.includes('.')) {
    return colorRef; // Direct color value
  }

  const parts = colorRef.split('.');

  // Handle specific known color paths
  if (parts.length === 2) {
    const [category, subcategory] = parts;

    if (category === 'contentTypes' && subcategory && subcategory in theme.colors.contentTypes) {
      return theme.colors.contentTypes[subcategory as keyof typeof theme.colors.contentTypes];
    }

    if (category === 'status' && subcategory && subcategory in theme.colors.status) {
      return theme.colors.status[subcategory as keyof typeof theme.colors.status];
    }

    if (category === 'categories' && subcategory && subcategory in theme.colors.categories) {
      return theme.colors.categories[subcategory as keyof typeof theme.colors.categories];
    }
  }

  // If no direct match found, log the issue and return fallback
  // Note: Using console.warn here since this is a config file and logger may cause circular imports
  console.warn(`Color reference not found: ${colorRef}`);
  return '#9e9e9e'; // Fallback grey
}/**
 * Get theme configuration for a content type
 */
export function getContentTypeTheme(type: string, theme: ThemeConfig = DEFAULT_SITE_THEME) {
  const config = theme.contentTypes[type];
  if (!config) {
    return {
      icon: 'mdi-file-document',
      color: '#9e9e9e',
      label: type.charAt(0).toUpperCase() + type.slice(1),
      description: 'Content type',
    };
  }

  return {
    ...config,
    color: resolveColor(config.color, theme),
  };
}

/**
 * Get theme configuration for a category
 */
export function getCategoryTheme(contentType: string, category: string, theme: ThemeConfig = DEFAULT_SITE_THEME) {
  const mapping = theme.categoryMappings[contentType]?.[category];
  if (!mapping) {
    return {
      icon: 'mdi-tag',
      color: '#9e9e9e',
      label: category.charAt(0).toUpperCase() + category.slice(1),
    };
  }

  return {
    ...mapping,
    color: resolveColor(mapping.color, theme),
  };
}

/**
 * Get theme configuration for a status
 */
export function getStatusTheme(status: string, theme: ThemeConfig = DEFAULT_SITE_THEME) {
  const config = theme.statusMappings[status];
  if (!config) {
    return {
      icon: 'mdi-help-circle',
      color: '#9e9e9e',
      label: status.charAt(0).toUpperCase() + status.slice(1),
      description: 'Content status',
    };
  }

  return {
    ...config,
    color: resolveColor(config.color, theme),
  };
}
