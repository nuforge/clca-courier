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
    newsletter: 'Boletín'
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
