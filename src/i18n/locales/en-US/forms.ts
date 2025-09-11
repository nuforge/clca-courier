/**
 * English (US) Locale - Forms and Validation
 *
 * Form labels, validation messages, and input placeholders
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

export default {
  title: {
    label: 'Title',
    hint: 'Enter a clear, descriptive title for your content',
    required: 'Title is required',
    minLength: 'Title must be at least 3 characters',
    maxLength: 'Title cannot exceed 200 characters'
  },
  description: {
    label: 'Description',
    hint: 'Provide detailed information about your content',
    required: 'Description is required',
    minLength: 'Description must be at least 10 characters',
    maxLength: 'Description cannot exceed 2000 characters'
  },
  contentType: {
    label: 'Content Type'
  },
  status: {
    label: 'Status'
  },
  required: 'This field is required',

  // Legacy fields for compatibility
  content: 'Content',
  email: 'Email',
  name: 'Name',
  author: 'Author',
  subject: 'Subject',
  message: 'Message',
  category: 'Category',
  date: 'Date',
  time: 'Time',
  location: 'Location',
  tags: 'Tags',
  featured: 'Featured',
  published: 'Published',
  year: 'Year',
  month: 'Month',

  validation: {
    required: '{field} is required',
    emailInvalid: 'Please enter a valid email address',
    minLength: '{field} must be at least {min} characters',
    maxLength: '{field} must not exceed {max} characters',
    invalidFormat: '{field} format is invalid',
    passwordsDontMatch: 'Passwords do not match'
  },

  placeholders: {
    email: 'Enter your email address',
    password: 'Enter your password',
    search: 'Search...',
    title: 'Enter a title',
    description: 'Enter a description'
  }
};
