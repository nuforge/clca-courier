/**
 * English (US) Locale - Forms and Validation
 *
 * Form labels, validation messages, and input placeholders
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

export default {
  title: 'Title',
  description: 'Description',
  content: 'Content',
  email: 'Email',
  name: 'Name',
  subject: 'Subject',
  message: 'Message',
  category: 'Category',
  date: 'Date',
  time: 'Time',
  location: 'Location',
  tags: 'Tags',
  featured: 'Featured',
  published: 'Published',

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
