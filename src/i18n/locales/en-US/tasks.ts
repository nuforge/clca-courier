/**
 * English translations for Task Management System
 * Volunteer workflow interface translations
 */

export default {
  // Task categories
  category: {
    review: 'Review',
    layout: 'Layout',
    'fact-check': 'Fact Check',
    approve: 'Approve',
    print: 'Print'
  },

  // Task status
  status: {
    unclaimed: 'Unclaimed',
    claimed: 'Claimed',
    'in-progress': 'In Progress',
    completed: 'Completed'
  },

  // Task priority
  priority: {
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  },

  // Task card
  card: {
    content_by: 'Content by',
    estimated_time: 'Estimated time',
    due_date: 'Due date',
    assigned_to: 'Assigned to',
    instructions: 'Instructions',
    created: 'Created',
    updated: 'Updated',
    due_in: 'Due in {time}',
    overdue_by: 'Overdue by {time}'
  },

  // Task actions
  actions: {
    claim: 'Claim Task',
    start: 'Start',
    complete: 'Complete',
    view_content: 'View Content',
    manage: 'Manage',
    claim_task_aria: 'Claim task: {title}',
    start_task_aria: 'Start task: {title}',
    complete_task_aria: 'Complete task: {title}',
    view_content_aria: 'View content: {title}',
    manage_task_aria: 'Manage task: {title}'
  },

  // Task management
  manage: {
    title: 'Manage Task',
    reassign: 'Reassign Task',
    select_user: 'Select user',
    status: 'Status',
    select_status: 'Select status'
  },

  // Task list
  list: {
    search_placeholder: 'Search tasks...',
    status_filter: 'Status',
    category_filter: 'Category',
    priority_filter: 'Priority',
    sort_by: 'Sort by',
    active_filters: 'Active filters',
    total_tasks: 'Total Tasks',
    unclaimed: 'Unclaimed',
    in_progress: 'In Progress',
    completed: 'Completed',
    loading: 'Loading tasks...',
    no_tasks: 'No Tasks Found',
    no_tasks_filtered: 'No tasks match your filters',
    no_tasks_available: 'No tasks available',
    sort: {
      created_desc: 'Created (Newest)',
      created_asc: 'Created (Oldest)',
      due_date: 'Due Date',
      priority: 'Priority',
      category: 'Category',
      status: 'Status'
    }
  },

  // Volunteer dashboard
  volunteer: {
    dashboard_title: 'Volunteer Dashboard',
    dashboard_subtitle: 'Manage your editorial tasks and track your contributions',
    active_tasks: 'Active Tasks',
    completed_tasks: 'Completed Tasks',
    available_tasks: 'Available Tasks',
    my_skills: 'My Skills',
    quick_actions: 'Quick Actions',
    browse_tasks: 'Browse All Tasks',
    update_skills: 'Update Skills',
    view_progress: 'View Progress',
    no_active_tasks: 'No Active Tasks',
    no_active_tasks_desc: 'You don\'t have any active tasks. Browse available tasks to get started.',
    find_tasks: 'Find Tasks',
    no_recommended_tasks: 'No Recommended Tasks',
    no_recommended_tasks_desc: 'No tasks match your skills right now. Check back later or browse all tasks.',
    browse_all_tasks: 'Browse All Tasks',
    recommended_for_you: 'Recommended for You',
    all_available: 'All Available Tasks',
    my_tasks: 'My Tasks',
    completed: 'Completed',

    // Skills management
    manage_skills: 'Manage Skills',
    skills_desc: 'Update your skills and availability for better task matching',
    current_skills: 'Current Skills',
    add_skill: 'Add Skill',
    select_skill: 'Select a skill',
    skill_added: 'Skill "{skill}" added',
    skill_removed: 'Skill "{skill}" removed',
    skill_add_failed: 'Failed to add skill',
    skill_remove_failed: 'Failed to remove skill',

    // Availability
    availability: 'Availability',
    availability_regular: 'Regular (Available most days)',
    availability_occasional: 'Occasional (Available some days)',
    availability_on_call: 'On-call (Available when needed)',
    availability_updated: 'Availability updated',
    availability_update_failed: 'Failed to update availability',

    // Progress tracking
    progress_title: 'Your Progress',
    total_completed: 'Total Completed',
    avg_completion: 'Avg. Completion Time',
    tasks_by_category: 'Tasks by Category',
    recent_activity: 'Recent Activity',

    // Browse dialog
    all_tasks: 'All Tasks',
    browse_desc: 'Browse and claim available editorial tasks'
  },

  // Notifications
  notifications: {
    task_claimed: 'Task claimed successfully',
    claim_failed: 'Failed to claim task',
    status_updated_to_claimed: 'Task claimed',
    status_updated_to_in_progress: 'Task started',
    status_updated_to_completed: 'Task completed',
    status_update_failed: 'Failed to update task status',
    load_failed: 'Failed to load tasks',
    load_users_failed: 'Failed to load users',
    task_updated: 'Task updated successfully',
    task_update_failed: 'Failed to update task'
  },

  // Real-time monitoring
  realTimeMonitor: {
    title: 'Real-Time Task Monitor',
    connected: 'Connected',
    connecting: 'Connecting',
    disconnected: 'Disconnected',
    pauseRefresh: 'Pause Auto Refresh',
    startRefresh: 'Start Auto Refresh',
    manualRefresh: 'Manual Refresh',
    overview: 'Task Overview',
    totalTasks: 'Total Tasks',
    unassigned: 'Unassigned',
    overdue: 'Overdue',
    approaching: 'Approaching Deadline',
    statusDistribution: 'Status Distribution',
    volunteerWorkload: 'Volunteer Workload',
    activeTasks: 'active tasks',
    completed: 'completed',
    active: 'active',
    avgTime: 'avg time',
    noVolunteers: 'No volunteers with active tasks',
    recentTasks: 'Recent Tasks',
    recentActivity: 'Recent Activity',
    noActivity: 'No recent activity',
    by: 'by',
    retry: 'Retry',
    refreshSuccess: 'Data refreshed successfully',
    refreshError: 'Failed to refresh data',
    connectionError: 'Failed to connect to real-time updates',
    taskCompleted: '{category} task completed',
    taskAssigned: '{category} task assigned',
    taskCreated: '{category} task created'
  },

  // Deadline management
  deadlines: {
    approaching: 'Approaching Deadline',
    overdue: 'Overdue',
    onTrack: 'On Track',
    critical: 'Critical',
    requestExtension: 'Request Extension',
    extensionRequested: 'Extension requested',
    extensionApproved: 'Extension approved',
    extensionRejected: 'Extension rejected',
    reason: 'Reason for extension',
    newDeadline: 'New deadline',
    currentDeadline: 'Current deadline',
    extensionReason: 'Please provide a reason for the deadline extension',
    submitExtension: 'Submit Extension Request',
    cancelExtension: 'Cancel',
    extensionSuccess: 'Extension request submitted successfully',
    extensionError: 'Failed to submit extension request',
    invalidDeadline: 'New deadline must be after current deadline',
    reasonRequired: 'Extension reason is required'
  },

  // Notification types
  notificationTypes: {
    task_assigned: 'Task Assigned',
    task_reassigned: 'Task Reassigned',
    task_completed: 'Task Completed',
    task_claimed: 'Task Claimed',
    task_unclaimed: 'Task Available',
    deadline_approaching: 'Deadline Approaching',
    task_overdue: 'Task Overdue',
    task_escalated: 'Task Escalated',
    tasks_reassigned: 'Tasks Reassigned',
    content_published: 'Content Published',
    system_announcement: 'System Announcement',
    welcome: 'Welcome',
    skill_request: 'Skills Needed'
  }
};

