/**
 * English (US) Locale - Content Management
 *
 * Content types, statuses, categories, and management actions
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

export default {
  status: {
    pending: 'Pending',
    approved: 'Approved',
    published: 'Published',
    rejected: 'Rejected',
    draft: 'Draft'
  },

  types: {
    news: 'News',
    event: 'Event',
    announcement: 'Announcement',
    classified: 'Classified',
    newsletter: 'Newsletter',
    task: 'Task',
    article: 'Article'
  },

  contentType: {
    event: 'Event',
    task: 'Task',
    announcement: 'Announcement',
    classified: 'Classified',
    article: 'Article',
    news: 'News',
    unknown: 'Unknown'
  },

  byAuthor: 'by {author}',

  features: {
    date: {
      label: 'Event Date',
      allDay: 'All Day'
    },
    task: {
      label: 'Task',
      quantity: '{qty} {unit} needed',
      claim: 'Claim',
      claimedBy: 'Claimed by {user}',
      status: {
        unclaimed: 'Available',
        claimed: 'Claimed',
        completed: 'Completed'
      }
    },
    location: {
      coordinates: 'Lat: {lat}, Lng: {lng}'
    },
    canva: {
      label: 'Canva Design',
      designId: 'Design ID: {id}',
      edit: 'Edit',
      export: 'Export'
    }
  },

  categories: {
    general: 'General',
    community: 'Community',
    events: 'Events',
    announcements: 'Announcements',
    forSale: 'For Sale',
    wanted: 'Wanted',
    services: 'Services',
    free: 'Free'
  },

  actions: {
    approve: 'Approve',
    reject: 'Reject',
    publish: 'Publish',
    unpublish: 'Unpublish',
    feature: 'Feature',
    unfeature: 'Remove Feature',
    approveSuccess: 'Content approved successfully',
    approveError: 'Failed to approve content'
  },

  print: {
    autoExportSuccess: 'Content approved and design exported for printing',
    autoExportFailed: 'Content approved, but design export failed. You can retry export manually.',
    printReady: 'Ready for Print',
    claimed: 'Claimed for Printing',
    completed: 'Print Completed',
    claimJob: 'Claim Print Job',
    completeJob: 'Mark as Completed',
    printQueue: 'Print Queue',
    noPrintJobs: 'No print jobs available',
    quantity: 'Print Quantity',
    queueDescription: 'View and claim content ready for printing',
    noPrintJobsDescription: 'No content is currently ready for printing',
    myClaimedJobs: 'My Claimed Print Jobs',
    claimedAt: 'Claimed:',
    jobClaimed: 'Print job claimed successfully',
    claimError: 'Failed to claim print job',
    jobCompleted: 'Print job marked as completed',
    completeError: 'Failed to complete print job'
  },

  management: 'Content Management',
  managementDescription: 'Review, approve, and manage user-submitted content for publication',
  submitted: 'Submitted',
  attachments: 'Attachments',
  reviewNotes: 'Review Notes',
  rejectContent: 'Reject Content',
  rejectionReason: 'Reason for rejection (optional)',
  needHelp: 'Need Help?',
  contentGuidelines: 'Content Guidelines',
  guidelinesDescription: 'Learn about our content standards and best practices for submissions.',
  viewGuidelines: 'View Guidelines',
  imageHosting: 'Image Hosting',
  imageHostingDescription: 'Best practices for hosting images externally to keep costs low.',
  imageGuide: 'Image Guide',
  getSupport: 'Get Support',
  supportDescription: 'Contact our editorial team if you need assistance with your submission.',
  quickUpload: 'Quick Upload Mode',
  quickUploadDescription: 'Streamlined submission for quick sharing',
  guidedSubmission: 'Guided Submission Process',
  guidedSubmissionDescription: "You're following our step-by-step guide for the best results",
  backToGuide: 'Back to Guide'
};
