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
    photo: 'Historia Fotográfica',
    unknown: 'Desconocido'
  },

  difficulty: {
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil'
  },

  byAuthor: 'por {author}',

  features: {
    date: {
      label: 'Fecha del Evento',
      description: 'Añade información de fecha y hora a tu contenido',
      allDay: 'Todo el Día',
      startDate: 'Fecha de Inicio',
      startTime: 'Hora de Inicio',
      endDate: 'Fecha de Finalización',
      endTime: 'Hora de Finalización',
      hasEndDate: 'Este evento tiene fecha/hora de finalización',
      endAfterStart: 'La fecha de finalización debe ser posterior a la de inicio',
      invalidDate: 'Fecha inválida',
      validationError: 'Por favor establece una fecha de inicio válida para este evento'
    },
    task: {
      label: 'Tarea',
      description: 'Añade detalles de tarea para voluntarios de la comunidad',
      category: 'Categoría de Tarea',
      quantity: '{qty} {unit} necesarios',
      quantityRange: 'La cantidad debe estar entre 1 y 999',
      unit: 'Unidad',
      status: 'Estado de Tarea',
      statusHelp: 'Las tareas comienzan como no reclamadas y pueden ser reclamadas por miembros de la comunidad',
      claim: 'Reclamar',
      claimedBy: 'Reclamado por {user}',
      incompleteTask: 'Por favor completa todos los detalles de la tarea',
      previewFormat: '{qty} {unit} necesarios para {category}',
      validationError: 'Por favor completa la categoría de tarea, cantidad y unidad'
    },
    location: {
      label: 'Ubicación',
      description: 'Añade información de ubicación a tu contenido',
      name: 'Nombre de Ubicación',
      nameHint: 'Opcional: Un nombre amigable para esta ubicación',
      address: 'Dirección',
      addressHint: 'La dirección o descripción de la ubicación',
      coordinates: 'Coordenadas (Opcional)',
      coordinatesHelp: 'Añade coordenadas precisas para mapeo',
      coordinatesDisplay: 'Lat: {lat}, Lng: {lng}',
      latitude: 'Latitud',
      longitude: 'Longitud',
      invalidLatitude: 'La latitud debe estar entre -90 y 90',
      invalidLongitude: 'La longitud debe estar entre -180 y 180',
      getCurrentLocation: 'Usar Ubicación Actual',
      geolocationNotSupported: 'La geolocalización no es compatible con este navegador',
      locationObtained: 'Ubicación obtenida exitosamente',
      locationError: 'Error al obtener la ubicación actual',
      incompleteLocation: 'Por favor ingresa al menos una dirección'
    }
  },

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
      },
      photo: {
        description: 'Comparte historias fotográficas y contenido visual'
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
  backToGuide: 'Volver a la Guía',

  // Calendar-specific content
  calendar: {
    title: 'Calendario Comunitario',
    subtitle: 'Mantente al día con eventos y actividades de la comunidad',
    noEvents: 'No hay eventos programados',
    noEventsForDate: 'No hay eventos programados para esta fecha',
    noEventsForMonth: 'No hay eventos programados para este mes',
    upcomingEvents: 'Próximos Eventos',
    allUpcomingEvents: 'Todos los Próximos Eventos',
    eventsOnDate: 'Eventos el {date}',
    viewAllUpcoming: 'Ver Todos los Próximos',
    today: 'Hoy',
    allDay: 'Todo el Día',
    eventDetails: 'Detalles del Evento',
    exportToCalendar: 'Exportar al Calendario',
    shareEvent: 'Compartir Evento',
    copyDetails: 'Copiar Detalles',
    contactOrganizer: 'Contactar Organizador',
    viewOnMap: 'Ver en Mapa',
    eventExported: 'Evento exportado al calendario',
    eventShared: 'Detalles del evento copiados al portapapeles',
    eventCopied: 'Detalles del evento copiados al portapapeles',
    eventCopyFailed: 'Error al copiar detalles del evento',
    filters: {
      eventTypes: 'Tipos de Eventos',
      featuredOnly: 'Solo Destacados',
      clearFilters: 'Limpiar Filtros',
      applyFilters: 'Aplicar Filtros'
    },
    navigation: {
      previousMonth: 'Mes Anterior',
      nextMonth: 'Mes Siguiente',
      goToToday: 'Ir a Hoy'
    },
    recurrence: {
      none: 'Sin Repetición',
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
      yearly: 'Anual',
      everyNDays: 'Cada {n} días',
      everyNWeeks: 'Cada {n} semanas',
      everyNMonths: 'Cada {n} meses',
      everyNYears: 'Cada {n} años'
    }
  }
};
