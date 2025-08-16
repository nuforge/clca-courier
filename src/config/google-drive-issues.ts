// src/config/google-drive-issues.ts
// Pre-configured list of known Google Drive PDF files
// NO API CALLS - NO OAUTH - JUST DIRECT PUBLIC ACCESS
// Update this list when new issues are added to the drive

export interface GoogleDriveIssueConfig {
  id: string;
  filename: string;
  title: string;
  date: string;
  directLink: string;
  thumbnailUrl: string;
  pdfUrl: string;
}

// REPLACE THESE WITH YOUR ACTUAL GOOGLE DRIVE FILE IDS
// To get file ID: Right-click file in Google Drive > "Get link" > Copy the ID from the URL
export const knownGoogleDriveIssues: GoogleDriveIssueConfig[] = [
  {
    id: 'REPLACE_WITH_ACTUAL_FILE_ID_1',
    filename: 'Courier - 2025.06 - June.pdf',
    title: 'June 2025',
    date: '2025-06-01',
    directLink: 'https://drive.google.com/file/d/REPLACE_WITH_ACTUAL_FILE_ID_1/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=REPLACE_WITH_ACTUAL_FILE_ID_1&sz=w400',
    pdfUrl: 'https://drive.google.com/uc?export=view&id=REPLACE_WITH_ACTUAL_FILE_ID_1',
  },
  {
    id: 'REPLACE_WITH_ACTUAL_FILE_ID_2',
    filename: 'PICNIC 8.2025.pdf',
    title: 'Picnic August 2025',
    date: '2025-08-01',
    directLink: 'https://drive.google.com/file/d/REPLACE_WITH_ACTUAL_FILE_ID_2/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=REPLACE_WITH_ACTUAL_FILE_ID_2&sz=w400',
    pdfUrl: 'https://drive.google.com/uc?export=view&id=REPLACE_WITH_ACTUAL_FILE_ID_2',
  },
  {
    id: 'REPLACE_WITH_ACTUAL_FILE_ID_3',
    filename: 'Conashaugh Winter 2022 Web.pdf',
    title: 'Winter 2022',
    date: '2022-12-01',
    directLink: 'https://drive.google.com/file/d/REPLACE_WITH_ACTUAL_FILE_ID_3/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=REPLACE_WITH_ACTUAL_FILE_ID_3&sz=w400',
    pdfUrl: 'https://drive.google.com/uc?export=view&id=REPLACE_WITH_ACTUAL_FILE_ID_3',
  },
  // Add more issues here with their actual Google Drive file IDs
];
