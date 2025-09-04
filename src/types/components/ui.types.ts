/**
 * General UI Component Types
 * Common interfaces for UI components and interactions
 */

/**
 * Generic component props for consistent API
 */
export interface BaseComponentProps {
  id?: string;
  class?: string | string[] | Record<string, boolean>;
  style?: string | Record<string, string>;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Card component configuration
 */
export interface CardConfig extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  image?: string;
  actions?: CardAction[];
  elevated?: boolean;
  bordered?: boolean;
  flat?: boolean;
}

/**
 * Card action button
 */
export interface CardAction {
  label: string;
  icon?: string;
  color?: string;
  handler: () => void;
  disabled?: boolean;
}

/**
 * Modal/Dialog configuration
 */
export interface ModalConfig {
  title?: string;
  message?: string;
  persistent?: boolean;
  maximized?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
  position?: 'standard' | 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Button configuration
 */
export interface ButtonConfig extends BaseComponentProps {
  label?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'filled' | 'outlined' | 'text' | 'tonal';
  rounded?: boolean;
  fab?: boolean;
}

/**
 * Form field configuration
 */
export interface FormFieldConfig extends BaseComponentProps {
  label?: string;
  hint?: string;
  errorMessage?: string;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
}

/**
 * Table column definition
 */
export interface TableColumn {
  name: string;
  label: string;
  field?: string | ((row: unknown) => unknown);
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  classes?: string;
  headerClasses?: string;
  format?: (value: unknown) => string;
}

/**
 * Table configuration
 */
export interface TableConfig {
  columns: TableColumn[];
  rowKey: string;
  loading?: boolean;
  noDataLabel?: string;
  loadingLabel?: string;
  pagination?: TablePagination;
  selection?: 'single' | 'multiple' | 'none';
}

/**
 * Table pagination
 */
export interface TablePagination {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
  sortBy?: string;
  descending?: boolean;
}

/**
 * Search input configuration
 */
export interface SearchConfig extends FormFieldConfig {
  debounce?: number;
  clearable?: boolean;
  suggestions?: string[];
  filterFunction?: (value: string, items: unknown[]) => unknown[];
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  type: 'positive' | 'negative' | 'warning' | 'info';
  message: string;
  caption?: string;
  timeout?: number;
  actions?: NotificationAction[];
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

/**
 * Notification action
 */
export interface NotificationAction {
  label: string;
  color?: string;
  handler: () => void;
}

/**
 * Loading state configuration
 */
export interface LoadingState {
  show: boolean;
  message?: string;
  progress?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Validation rule for forms
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: unknown) => string | boolean;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  positive: string;
  negative: string;
  warning: string;
  info: string;
  dark: string;
  background: string;
}

/**
 * Responsive breakpoint configuration
 */
export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  iterations?: number;
}
