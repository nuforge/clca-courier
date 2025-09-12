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
    photo: 'Photo Story',
    unknown: 'Unknown'
  },

  difficulty: {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard'
  },

  byAuthor: 'by {author}',

  features: {
    date: {
      label: 'Event Date',
      description: 'Add date and time information to your content',
      allDay: 'All Day',
      startDate: 'Start Date',
      startTime: 'Start Time',
      endDate: 'End Date',
      endTime: 'End Time',
      hasEndDate: 'This event has an end date/time',
      endAfterStart: 'End date must be after start date',
      invalidDate: 'Invalid date',
      validationError: 'Please set a valid start date for this event'
    },
    task: {
      label: 'Task',
      description: 'Add task details for community volunteers',
      category: 'Task Category',
      quantity: '{qty} {unit} needed',
      quantityRange: 'Quantity must be between 1 and 999',
      unit: 'Unit',
      status: 'Task Status',
      statusHelp: 'Tasks start as unclaimed and can be claimed by community members',
      claim: 'Claim',
      claimedBy: 'Claimed by {user}',
      incompleteTask: 'Please complete all task details',
      previewFormat: '{qty} {unit} needed for {category}',
      validationError: 'Please complete the task category, quantity, and unit',
      categories: {
        setup: 'Event Setup',
        printing: 'Printing & Distribution',
        cleanup: 'Cleanup & Breakdown',
        delivery: 'Delivery & Transport',
        coordination: 'Coordination & Management',
        supplies: 'Supplies & Materials',
        technical: 'Technical Support',
        other: 'Other'
      },
      units: {
        people: 'people',
        hours: 'hours',
        items: 'items',
        copies: 'copies',
        sets: 'sets',
        tables: 'tables',
        chairs: 'chairs',
        boxes: 'boxes'
      },
      statusOptions: {
        unclaimed: 'Available',
        claimed: 'Claimed',
        completed: 'Completed'
      }
    },
    location: {
      label: 'Location',
      description: 'Add location information to your content',
      name: 'Location Name',
      nameHint: 'Optional: A friendly name for this location',
      address: 'Address',
      addressHint: 'The street address or location description',
      coordinates: 'Coordinates (Optional)',
      coordinatesHelp: 'Add precise coordinates for mapping',
      coordinatesDisplay: 'Lat: {lat}, Lng: {lng}',
      latitude: 'Latitude',
      longitude: 'Longitude',
      invalidLatitude: 'Latitude must be between -90 and 90',
      invalidLongitude: 'Longitude must be between -180 and 180',
      getCurrentLocation: 'Use Current Location',
      geolocationNotSupported: 'Geolocation is not supported by this browser',
      locationObtained: 'Location obtained successfully',
      locationError: 'Failed to get current location',
      incompleteLocation: 'Please enter at least an address',
      validationError: 'Please enter a valid address for this location'
    },
    canva: {
      label: 'Canva Design',
      description: 'Integrate with Canva designs for visual content',
      designId: 'Design ID',
      designIdHint: 'The Canva design ID or paste the full URL',
      editUrl: 'Edit URL',
      editUrlHint: 'The Canva edit link for this design',
      exportUrl: 'Export URL (Optional)',
      exportUrlHint: 'Direct link to download the completed design',
      invalidUrl: 'Please enter a valid URL',
      notCanvaUrl: 'This doesn\'t appear to be a Canva URL',
      openDesign: 'Open Design in Canva',
      openExport: 'Open Export URL',
      incompleteIntegration: 'Please complete the Canva integration details',
      previewFormat: 'Canva Design: {designId}',
      editInCanva: 'Edit in Canva',
      downloadDesign: 'Download Design',
      helpTitle: 'How to use Canva Integration',
      help1: 'Create or open your design in Canva',
      help2: 'Copy the design ID from the URL or paste the full URL',
      help3: 'Share the edit link so others can collaborate',
      validationError: 'Please provide a valid Canva design ID or URL'
    },
    general: {
      validationError: 'Please complete the required information for this feature'
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

  // Content Submission Workflow
  submission: {
    title: 'Submit Content',
    subtitle: 'Share your story with the community',
    description: 'Contribute news, events, photos, and more to help keep our community connected.',
    steps: {
      contentType: {
        title: 'Content Type',
        subtitle: 'What type of content would you like to create?',
        description: 'Choose the content type that best matches what you want to share with the community.',
        validationError: 'Please select a content type to continue'
      },
      basicInfo: {
        title: 'Basic Information',
        subtitle: 'Tell us about your content',
        description: 'Provide the title and description for your content.',
        requiredFeatures: 'This content type requires:',
        allValid: 'All required information is provided',
        multipleIssues: '{count} issues need attention: {issues}'
      },
      features: {
        title: 'Features & Details',
        subtitle: 'Add specific features to your content',
        description: 'Configure additional features based on your content type.',
        required: 'Required Features',
        optional: 'Optional Features',
        allValid: 'All required features are configured correctly',
        multipleIssues: '{count} features need attention: {issues}'
      },
      preview: {
        title: 'Preview & Submit',
        subtitle: 'Review your content before submitting',
        description: 'Check how your content will appear and submit for review.',
        contentPreview: 'Content Preview',
        summary: 'Submission Summary',
        features: 'Features',
        notesTitle: 'Important Notes',
        note1: 'Your content will be reviewed by our team before publication',
        note2: 'You will receive a notification when your content is approved',
        note3: 'Published content will appear in the community feed',
        validationError: 'Please complete all required information before submitting'
      }
    },
    contentTypes: {
      news: {
        description: 'Share community news and updates'
      },
      event: {
        description: 'Announce upcoming community events'
      },
      announcement: {
        description: 'Important community announcements'
      },
      classified: {
        description: 'Buy, sell, or trade items with neighbors'
      },
      task: {
        description: 'Request help or volunteers for community tasks'
      },
      article: {
        description: 'Share articles and educational content'
      },
      photo: {
        description: 'Share photo stories and visual content'
      }
    },
    autoSave: {
      saving: 'Saving draft...',
      saved: 'Draft saved'
    },
    success: {
      submitted: 'Content submitted successfully! It will be reviewed before publication.'
    },
    errors: {
      invalidContent: 'Please complete all required fields',
      submitFailed: 'Failed to submit content. Please try again.'
    }
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
