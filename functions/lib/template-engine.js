"use strict";
/**
 * Template Engine for CLCA Courier Newsletter Generation
 *
 * Provides template loading, caching, and compilation using Handlebars.
 * Supports template inheritance and professional newsletter layouts.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateCacheStats = exports.clearTemplateCache = exports.registerHandlebarsHelpers = exports.validateTemplate = exports.getAvailableTemplates = exports.loadTemplateWithInheritance = exports.loadTemplate = exports.TEMPLATE_MAPPING = void 0;
const Handlebars = __importStar(require("handlebars"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Template cache for performance optimization
const templateCache = new Map();
// Template mapping for different content types
exports.TEMPLATE_MAPPING = {
    'news': { template: 'article.html', layout: 'standard' },
    'event': { template: 'event.html', layout: 'compact' },
    'story': { template: 'fullpage.html', layout: 'featured' },
    'announcement': { template: 'announcement.html', layout: 'highlight' },
    'opinion': { template: 'editorial.html', layout: 'standard' }
};
/**
 * Load and compile a Handlebars template with caching
 */
const loadTemplate = (templateName) => {
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
exports.loadTemplate = loadTemplate;
/**
 * Load template with inheritance support
 */
const loadTemplateWithInheritance = (templateName) => {
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
exports.loadTemplateWithInheritance = loadTemplateWithInheritance;
/**
 * Get available templates
 */
const getAvailableTemplates = () => {
    const templatesDir = path.join(__dirname, 'templates');
    if (!fs.existsSync(templatesDir)) {
        return [];
    }
    return fs.readdirSync(templatesDir)
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
};
exports.getAvailableTemplates = getAvailableTemplates;
/**
 * Validate template exists
 */
const validateTemplate = (templateName) => {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
    return fs.existsSync(templatePath);
};
exports.validateTemplate = validateTemplate;
/**
 * Register Handlebars helpers
 */
const registerHandlebarsHelpers = () => {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date) => {
        if (!date)
            return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    });
    // Time formatting helper
    Handlebars.registerHelper('formatTime', (date) => {
        if (!date)
            return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    });
    // Conditional helper for featured content
    Handlebars.registerHelper('ifFeatured', function (options) {
        const context = this;
        if (context.featured === true || context.priority === 'high') {
            return options.fn(this);
        }
        return options.inverse(this);
    });
    // Content type helper
    Handlebars.registerHelper('contentTypeIcon', (contentType) => {
        const icons = {
            'news': '📰',
            'event': '📅',
            'story': '📖',
            'announcement': '📢',
            'opinion': '💭'
        };
        return icons[contentType] || '📄';
    });
};
exports.registerHandlebarsHelpers = registerHandlebarsHelpers;
/**
 * Clear template cache (useful for development)
 */
const clearTemplateCache = () => {
    templateCache.clear();
};
exports.clearTemplateCache = clearTemplateCache;
/**
 * Get template cache statistics
 */
const getTemplateCacheStats = () => {
    return {
        size: templateCache.size,
        templates: Array.from(templateCache.keys())
    };
};
exports.getTemplateCacheStats = getTemplateCacheStats;
//# sourceMappingURL=template-engine.js.map