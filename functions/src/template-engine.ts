/**
 * Template Engine for CLCA Courier Newsletter Generation
 *
 * Provides template loading, caching, and compilation using Handlebars.
 * Supports template inheritance and professional newsletter layouts.
 */

import * as Handlebars from 'handlebars';
import type { TemplateDelegate } from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

// Template cache for performance optimization
const templateCache = new Map<string, {
  compiled: TemplateDelegate;
  lastModified: number;
  source: string;
}>();

// Template mapping for different content types
export const TEMPLATE_MAPPING = {
  'news': { template: 'article.html', layout: 'standard' },
  'event': { template: 'event.html', layout: 'compact' },
  'story': { template: 'fullpage.html', layout: 'featured' },
  'announcement': { template: 'announcement.html', layout: 'highlight' },
  'opinion': { template: 'editorial.html', layout: 'standard' }
} as const;

/**
 * Load and compile a Handlebars template with caching
 */
export const loadTemplate = (templateName: string): TemplateDelegate => {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);

  // Check if template file exists
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}.html`);
  }

  const stats = fs.statSync(templatePath);
  const lastModified = stats.mtime.getTime();

  // Check cache first
  const cached = templateCache.get(templateName);
  if (cached && cached.lastModified >= lastModified) {
    return cached.compiled;
  }

  // Load and compile template
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const compiled = Handlebars.compile(templateSource);

  // Cache the compiled template
  templateCache.set(templateName, {
    compiled,
    lastModified,
    source: templateSource
  });

  return compiled;
};

/**
 * Load template with inheritance support
 */
export const loadTemplateWithInheritance = (templateName: string): string => {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
  let templateSource = fs.readFileSync(templatePath, 'utf8');

  // Handle {{> base}} includes
  templateSource = templateSource.replace(/\{\{>\s*(\w+)\s*\}\}/g, (match, includeName) => {
    const includePath = path.join(__dirname, 'templates', `${includeName}.html`);
    if (fs.existsSync(includePath)) {
      return fs.readFileSync(includePath, 'utf8');
    }
    return match; // Keep original if include not found
  });

  return templateSource;
};

/**
 * Get available templates
 */
export const getAvailableTemplates = (): string[] => {
  const templatesDir = path.join(__dirname, 'templates');
  if (!fs.existsSync(templatesDir)) {
    return [];
  }

  return fs.readdirSync(templatesDir)
    .filter(file => file.endsWith('.html'))
    .map(file => file.replace('.html', ''));
};

/**
 * Validate template exists
 */
export const validateTemplate = (templateName: string): boolean => {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
  return fs.existsSync(templatePath);
};

/**
 * Register Handlebars helpers
 */
export const registerHandlebarsHelpers = (): void => {
  // Date formatting helper
  Handlebars.registerHelper('formatDate', (date: unknown) => {
    if (!date) return '';
    const d = (date as any).toDate ? (date as any).toDate() : new Date(date as string);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // Time formatting helper
  Handlebars.registerHelper('formatTime', (date: unknown) => {
    if (!date) return '';
    const d = (date as any).toDate ? (date as any).toDate() : new Date(date as string);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  });

  // Conditional helper for featured content
  Handlebars.registerHelper('ifFeatured', function(this: unknown, options: Handlebars.HelperOptions) {
    const context = this as Record<string, unknown>;
    if (context.featured === true || context.priority === 'high') {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  // Content type helper
  Handlebars.registerHelper('contentTypeIcon', (contentType: string) => {
    const icons: Record<string, string> = {
      'news': '📰',
      'event': '📅',
      'story': '📖',
      'announcement': '📢',
      'opinion': '💭'
    };
    return icons[contentType] || '📄';
  });
};

/**
 * Clear template cache (useful for development)
 */
export const clearTemplateCache = (): void => {
  templateCache.clear();
};

/**
 * Get template cache statistics
 */
export const getTemplateCacheStats = () => {
  return {
    size: templateCache.size,
    templates: Array.from(templateCache.keys())
  };
};
