/**
 * Spanish (ES) Locale - Content Management
 *
 * Content types, statuses, categories, and management actions
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

export default {
  status: {
    pending: 'Pendiente',
    approved: 'Aprobado',
    published: 'Publicado',
    rejected: 'Rechazado',
    draft: 'Borrador'
  },

  types: {
    news: 'Noticias',
    event: 'Evento',
    announcement: 'Anuncio',
    classified: 'Clasificado',
    newsletter: 'Boletín',
    task: 'Tarea',
    article: 'Artículo'
  },

  contentType: {
    event: 'Evento',
    task: 'Tarea',
    announcement: 'Anuncio',
    classified: 'Clasificado',
    article: 'Artículo',
    news: 'Noticias',
    unknown: 'Desconocido'
  },

  byAuthor: 'por {author}',

  categories: {
    general: 'General',
    community: 'Comunidad',
    events: 'Eventos',
    announcements: 'Anuncios',
    forSale: 'En Venta',
    wanted: 'Se Busca',
    services: 'Servicios',
    free: 'Gratis'
  },

  actions: {
    approve: 'Aprobar',
    reject: 'Rechazar',
    publish: 'Publicar',
    unpublish: 'Despublicar',
    feature: 'Destacar',
    unfeature: 'Quitar Destaque',
    approveSuccess: 'Contenido aprobado exitosamente',
    approveError: 'Error al aprobar contenido'
  },

  print: {
    autoExportSuccess: 'Contenido aprobado y diseño exportado para impresión',
    autoExportFailed: 'Contenido aprobado, pero falló la exportación del diseño. Puedes reintentar la exportación manualmente.',
    printReady: 'Listo para Imprimir',
    claimed: 'Reclamado para Impresión',
    completed: 'Impresión Completada',
    claimJob: 'Reclamar Trabajo de Impresión',
    completeJob: 'Marcar como Completado',
    printQueue: 'Cola de Impresión',
    noPrintJobs: 'No hay trabajos de impresión disponibles',
    quantity: 'Cantidad de Impresión',
    queueDescription: 'Ver y reclamar contenido listo para impresión',
    noPrintJobsDescription: 'No hay contenido actualmente listo para impresión',
    myClaimedJobs: 'Mis Trabajos de Impresión Reclamados',
    claimedAt: 'Reclamado:',
    jobClaimed: 'Trabajo de impresión reclamado exitosamente',
    claimError: 'Error al reclamar trabajo de impresión',
    jobCompleted: 'Trabajo de impresión marcado como completado',
    completeError: 'Error al completar trabajo de impresión'
  },

  // Content Submission Workflow
  submission: {
    steps: {
      contentType: {
        title: 'Tipo de Contenido',
        subtitle: '¿Qué tipo de contenido te gustaría crear?',
        description: 'Elige el tipo de contenido que mejor coincida con lo que quieres compartir con la comunidad.'
      },
      basicInfo: {
        title: 'Información Básica',
        subtitle: 'Cuéntanos sobre tu contenido',
        description: 'Proporciona el título y descripción de tu contenido.',
        requiredFeatures: 'Este tipo de contenido requiere:'
      },
      features: {
        title: 'Características y Detalles',
        subtitle: 'Añade características específicas a tu contenido',
        description: 'Configura características adicionales basadas en tu tipo de contenido.',
        required: 'Características Requeridas',
        optional: 'Características Opcionales'
      },
      preview: {
        title: 'Vista Previa y Envío',
        subtitle: 'Revisa tu contenido antes de enviarlo',
        description: 'Verifica cómo aparecerá tu contenido y envíalo para revisión.',
        contentPreview: 'Vista Previa del Contenido',
        summary: 'Resumen del Envío',
        features: 'Características',
        notesTitle: 'Notas Importantes',
        note1: 'Tu contenido será revisado por nuestro equipo antes de la publicación',
        note2: 'Recibirás una notificación cuando tu contenido sea aprobado',
        note3: 'El contenido publicado aparecerá en el feed de la comunidad'
      }
    },
    contentTypes: {
      news: {
        description: 'Comparte noticias y actualizaciones de la comunidad'
      },
      event: {
        description: 'Anuncia próximos eventos de la comunidad'
      },
      announcement: {
        description: 'Anuncios importantes de la comunidad'
      },
      classified: {
        description: 'Compra, vende o intercambia artículos con vecinos'
      },
      task: {
        description: 'Solicita ayuda o voluntarios para tareas comunitarias'
      },
      article: {
        description: 'Comparte artículos y contenido educativo'
      }
    },
    autoSave: {
      saving: 'Guardando borrador...',
      saved: 'Borrador guardado'
    },
    success: {
      submitted: '¡Contenido enviado exitosamente! Será revisado antes de la publicación.'
    },
    errors: {
      invalidContent: 'Por favor completa todos los campos requeridos',
      submitFailed: 'Error al enviar contenido. Por favor intenta de nuevo.'
    }
  },

  management: 'Gestión de Contenido',
  managementDescription: 'Revisar, aprobar y gestionar contenido enviado por usuarios para publicación',
  submitted: 'Enviado',
  attachments: 'Adjuntos',
  reviewNotes: 'Notas de Revisión',
  rejectContent: 'Rechazar Contenido',
  rejectionReason: 'Razón para el rechazo (opcional)',
  needHelp: '¿Necesitas Ayuda?',
  contentGuidelines: 'Pautas de Contenido',
  guidelinesDescription: 'Aprende sobre nuestros estándares de contenido y mejores prácticas para envíos.',
  viewGuidelines: 'Ver Pautas',
  imageHosting: 'Alojamiento de Imágenes',
  imageHostingDescription: 'Mejores prácticas para alojar imágenes externamente para mantener costos bajos.',
  imageGuide: 'Guía de Imágenes',
  getSupport: 'Obtener Soporte',
  supportDescription: 'Contacta a nuestro equipo editorial si necesitas ayuda con tu envío.',
  quickUpload: 'Modo de Subida Rápida',
  quickUploadDescription: 'Envío simplificado para compartir rápidamente',
  guidedSubmission: 'Proceso de Envío Guiado',
  guidedSubmissionDescription: 'Estás siguiendo nuestra guía paso a paso para obtener los mejores resultados',
  backToGuide: 'Volver a la Guía'
};
