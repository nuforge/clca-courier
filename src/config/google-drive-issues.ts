// src/config/google-drive-issues.ts
// Pre-configured list of known Google Drive PDF files
// Update this list when new issues are added to the drive

export interface GoogleDriveIssueConfig {
  id: string;
  filename: string;
  title: string;
  date: string;
  directLink?: string;
}

export const knownGoogleDriveIssues: GoogleDriveIssueConfig[] = [
  {
    id: '1',
    filename: 'Courier - 2025.06 - June.pdf',
    title: 'June 2025',
    date: '2025-06-01',
    directLink: 'https://drive.google.com/file/d/[FILE_ID]/view',
  },
  {
    id: '2',
    filename: 'PICNIC 8.2025.pdf',
    title: 'Picnic August 2025',
    date: '2025-08-01',
    directLink: 'https://drive.google.com/file/d/[FILE_ID]/view',
  },
  {
    id: '3',
    filename: 'Conashaugh Winter 2022 Web.pdf',
    title: 'Winter 2022',
    date: '2022-12-01',
    directLink: 'https://drive.google.com/file/d/[FILE_ID]/view',
  },
  // Add more issues as needed
];
