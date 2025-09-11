/**
 * Spanish (ES) Locale - Forms and Validation
 *
 * Form labels, validation messages, and input placeholders
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

export default {
  title: {
    label: 'Título',
    hint: 'Ingrese un título claro y descriptivo para su contenido',
    required: 'El título es requerido',
    minLength: 'El título debe tener al menos 3 caracteres',
    maxLength: 'El título no puede exceder 200 caracteres'
  },
  description: {
    label: 'Descripción',
    hint: 'Proporcione información detallada sobre su contenido',
    required: 'La descripción es requerida',
    minLength: 'La descripción debe tener al menos 10 caracteres',
    maxLength: 'La descripción no puede exceder 2000 caracteres'
  },
  contentType: {
    label: 'Tipo de Contenido'
  },
  status: {
    label: 'Estado'
  },
  required: 'Este campo es requerido',

  // Legacy fields for compatibility
  content: 'Contenido',
  email: 'Correo Electrónico',
  name: 'Nombre',
  author: 'Autor',
  subject: 'Asunto',
  message: 'Mensaje',
  category: 'Categoría',
  date: 'Fecha',
  time: 'Hora',
  location: 'Ubicación',
  tags: 'Etiquetas',
  featured: 'Destacado',
  published: 'Publicado',
  year: 'Año',
  month: 'Mes',

  validation: {
    required: '{field} es requerido',
    emailInvalid: 'Por favor ingrese una dirección de correo válida',
    minLength: '{field} debe tener al menos {min} caracteres',
    maxLength: '{field} no debe exceder {max} caracteres',
    invalidFormat: 'El formato de {field} es inválido',
    passwordsDontMatch: 'Las contraseñas no coinciden'
  },

  placeholders: {
    email: 'Ingrese su dirección de correo',
    password: 'Ingrese su contraseña',
    search: 'Buscar...',
    title: 'Ingrese un título',
    description: 'Ingrese una descripción'
  }
};
