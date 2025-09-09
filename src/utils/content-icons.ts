/**
 * Standardized Content Icons & Categories System
 * Centralized mapping for consistent icons, colors, and labels across the entire application
 */

export interface ContentIconConfig {
  icon: string;
  color: string;
  label: string;
  description?: string;
}

// Content Type Icons - Main categories for submission/organization
export const CONTENT_TYPE_ICONS: Record<string, ContentIconConfig> = {
  // Core Content Types
  article: {
    icon: 'mdi-newspaper-variant',
    color: 'primary',
    label: 'Articles & Stories',
    description: 'In-depth articles, community stories, and feature content'
  },

  photo: {
    icon: 'mdi-camera',
    color: 'secondary',
    label: 'Photo Stories',
    description: 'Photo collections with captions and context'
  },

  event: {
    icon: 'mdi-calendar-plus',
    color: 'accent',
    label: 'Events & Activities',
    description: 'Community events, meetings, and activities'
  },

  announcement: {
    icon: 'mdi-bullhorn',
    color: 'positive',
    label: 'Community News',
    description: 'Important announcements and community updates'
  },

  classified: {
    icon: 'mdi-tag',
    color: 'orange',
    label: 'Classifieds',
    description: 'Items for sale, services, and marketplace content'
  },

  project: {
    icon: 'mdi-engineering',
    color: 'info',
    label: 'Projects',
    description: 'Community projects and engineering updates'
  },

  photo_story: {
    icon: 'mdi-photo-library',
    color: 'teal',
    label: 'Photo Story',
    description: 'Visual storytelling with multiple photos'
  }
};

// Classified Categories - Specific subcategories for marketplace items
export const CLASSIFIED_CATEGORY_ICONS: Record<string, ContentIconConfig> = {
  'for-sale': {
    icon: 'mdi-tag',
    color: 'green',
    label: 'For Sale',
    description: 'Items available for purchase'
  },

  'for_sale': {
    icon: 'mdi-tag',
    color: 'green',
    label: 'For Sale',
    description: 'Items available for purchase'
  },

  services: {
    icon: 'mdi-tools',
    color: 'blue',
    label: 'Services',
    description: 'Professional and personal services offered'
  },

  wanted: {
    icon: 'mdi-magnify',
    color: 'orange',
    label: 'Wanted',
    description: 'Items or services being sought'
  },

  free: {
    icon: 'mdi-gift',
    color: 'purple',
    label: 'Free',
    description: 'Items being given away at no cost'
  },

  housing: {
    icon: 'mdi-home',
    color: 'brown',
    label: 'Housing',
    description: 'Rental properties and housing-related items'
  }
};

// News Categories - Subcategories for news and announcements
export const NEWS_CATEGORY_ICONS: Record<string, ContentIconConfig> = {
  news: {
    icon: 'mdi-newspaper',
    color: 'primary',
    label: 'News',
    description: 'General community news and updates'
  },

  announcement: {
    icon: 'mdi-bullhorn',
    color: 'positive',
    label: 'Announcement',
    description: 'Official announcements and notices'
  },

  event: {
    icon: 'mdi-calendar-event',
    color: 'accent',
    label: 'Event',
    description: 'Community events and activities'
  }
};

// Content Status Icons - For workflow and status indicators
export const CONTENT_STATUS_ICONS: Record<string, ContentIconConfig> = {
  draft: {
    icon: 'mdi-file-document-edit',
    color: 'grey',
    label: 'Draft',
    description: 'Content being worked on'
  },

  submitted: {
    icon: 'mdi-send',
    color: 'blue',
    label: 'Submitted',
    description: 'Submitted for review'
  },

  pending: {
    icon: 'mdi-clock-outline',
    color: 'orange',
    label: 'Pending',
    description: 'Awaiting review or approval'
  },

  approved: {
    icon: 'mdi-check-circle',
    color: 'green',
    label: 'Approved',
    description: 'Approved for publication'
  },

  published: {
    icon: 'mdi-publish',
    color: 'positive',
    label: 'Published',
    description: 'Currently published and visible'
  },

  rejected: {
    icon: 'mdi-close-circle',
    color: 'red',
    label: 'Rejected',
    description: 'Not approved for publication'
  }
};

// Community-Specific Categories - CLCA-specific content types
export const COMMUNITY_CATEGORY_ICONS: Record<string, ContentIconConfig> = {
  community: {
    icon: 'mdi-account-group',
    color: 'primary',
    label: 'Community',
    description: 'General community content and discussions'
  },

  recreation: {
    icon: 'mdi-pool',
    color: 'cyan',
    label: 'Recreation',
    description: 'Lake activities, sports, and recreational content'
  },

  'lake-activities': {
    icon: 'mdi-waves',
    color: 'blue',
    label: 'Lake Activities',
    description: 'Water-based activities and lake-related content'
  },

  'volunteer-opportunities': {
    icon: 'mdi-hand-heart',
    color: 'pink',
    label: 'Volunteer Opportunities',
    description: 'Community volunteer and service opportunities'
  },

  'neighborhood-watch': {
    icon: 'mdi-shield-account',
    color: 'deep-orange',
    label: 'Neighborhood Watch',
    description: 'Safety and security-related community content'
  }
};

// Utility Functions

/**
 * Get icon configuration for any content type, category, or status
 */
export function getContentIcon(
  type: string,
  fallback: ContentIconConfig = { icon: 'mdi-file-document', color: 'grey', label: 'Content' }
): ContentIconConfig {
  // Check all icon collections in priority order
  return (
    CONTENT_TYPE_ICONS[type] ||
    CLASSIFIED_CATEGORY_ICONS[type] ||
    NEWS_CATEGORY_ICONS[type] ||
    CONTENT_STATUS_ICONS[type] ||
    COMMUNITY_CATEGORY_ICONS[type] ||
    fallback
  );
}

/**
 * Get icon configuration specifically for classified categories
 */
export function getClassifiedCategoryIcon(category: string): ContentIconConfig {
  return getContentIcon(category, {
    icon: 'mdi-tag',
    color: 'grey',
    label: category.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  });
}

/**
 * Get icon configuration specifically for news categories
 */
export function getNewsCategoryIcon(category: string): ContentIconConfig {
  return getContentIcon(category, {
    icon: 'mdi-newspaper',
    color: 'primary',
    label: category.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  });
}

/**
 * Get icon configuration specifically for content types
 */
export function getContentTypeIcon(type: string): ContentIconConfig {
  return getContentIcon(type, {
    icon: 'mdi-file-document',
    color: 'grey',
    label: type.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  });
}

/**
 * Get icon configuration specifically for content status
 */
export function getContentStatusIcon(status: string): ContentIconConfig {
  return getContentIcon(status, {
    icon: 'mdi-help-circle',
    color: 'grey',
    label: status.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  });
}

/**
 * Get all available categories for a specific content area
 */
export function getAvailableCategories(area: 'classified' | 'news' | 'content-type' | 'community' | 'all' = 'all'): string[] {
  switch (area) {
    case 'classified':
      return Object.keys(CLASSIFIED_CATEGORY_ICONS);
    case 'news':
      return Object.keys(NEWS_CATEGORY_ICONS);
    case 'content-type':
      return Object.keys(CONTENT_TYPE_ICONS);
    case 'community':
      return Object.keys(COMMUNITY_CATEGORY_ICONS);
    case 'all':
    default:
      return [
        ...Object.keys(CONTENT_TYPE_ICONS),
        ...Object.keys(CLASSIFIED_CATEGORY_ICONS),
        ...Object.keys(NEWS_CATEGORY_ICONS),
        ...Object.keys(COMMUNITY_CATEGORY_ICONS)
      ];
  }
}

/**
 * Format category/type name for display
 */
export function formatCategoryName(category: string): string {
  return category
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Export all icon collections for direct access if needed
export {
  CONTENT_TYPE_ICONS as ContentTypes,
  CLASSIFIED_CATEGORY_ICONS as ClassifiedCategories,
  NEWS_CATEGORY_ICONS as NewsCategories,
  CONTENT_STATUS_ICONS as ContentStatus,
  COMMUNITY_CATEGORY_ICONS as CommunityCategories
};
