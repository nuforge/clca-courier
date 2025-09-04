/**
 * Navigation and Routing Types
 * Consolidated from navigation.ts and router configurations
 */

/**
 * Navigation menu item
 */
export interface NavigationItem {
  title: string;
  icon: string;
  link: string;
  badge?: string | number;
  disabled?: boolean;
  children?: NavigationItem[];
}

/**
 * Breadcrumb item for navigation trails
 */
export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: string;
  disabled?: boolean;
}

/**
 * Route metadata for enhanced navigation
 */
export interface RouteMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  requiresAuth?: boolean;
  layout?: string;
  breadcrumbs?: BreadcrumbItem[];
}

/**
 * Navigation state
 */
export interface NavigationState {
  isMenuOpen: boolean;
  isMobileMenuOpen: boolean;
  currentRoute: string;
  breadcrumbs: BreadcrumbItem[];
}

/**
 * Menu configuration
 */
export interface MenuConfig {
  items: NavigationItem[];
  showIcons: boolean;
  showBadges: boolean;
  collapsible: boolean;
  defaultCollapsed: boolean;
}
