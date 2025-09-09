/**
 * Spanish (ES) Locale - Forms and Validation
 *
 * Form labels, validation messages, and input placeholders
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

export default {
  title: 'Título',
  description: 'Descripción',
  content: 'Contenido',
  email: 'Correo Electrónico',
  name: 'Nombre',
  subject: 'Asunto',
  message: 'Mensaje',
  category: 'Categoría',
  date: 'Fecha',
  time: 'Hora',
  location: 'Ubicación',
  tags: 'Etiquetas',
  featured: 'Destacado',
  published: 'Publicado',

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
