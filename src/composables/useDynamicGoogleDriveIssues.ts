// DYNAMIC Google Drive file fetching using specific file IDs
// NO OAUTH - Uses public API with API key for file metadata
import { ref } from 'vue';
import type { IssueWithGoogleDrive } from '../types/google-drive-content';

interface GoogleDriveFileMetadata {
  id: string;
  name: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  webViewLink?: string;
}

export function useDynamicGoogleDriveIssues() {
  const issues = ref<IssueWithGoogleDrive[]>([]);
  const loading = ref(false);
  const error = ref('');

  // Extract file IDs from your provided URLs
  const fileIds = [
    '107_FDC35rRfmJiLpL6comNT0mM22Kxn1',
    '15Y9_lz14SZWvkXiWgUK_tD1DkRdgsdnE',
    '17gTFvzguWWhjATTgUgxbAT37pkNgle0c',
    '18o1R8Zxg1P7FNGzfMJlYlhcKxc7DQcZV',
    '19Kq9nkKP0MHe5e40P4G6QBYY_srTLNrq',
    '1AAk22qxpoyDpupNC3KgzUq1vOXtDFYLn',
    '1BuYG7MZIXJ0KdaRJVEaMVS3RQt35-Xyy',
    '1C21xeLrvAbUEMxWSV0TyRo4YbLoZsfxh',
    '1CPe1Wn7HHaLsSAdokqyZiufguZZlctQm',
    '1FuyMT_pVfRxbarlgIQXPtoijSq2HxaHC',
    '1GrJQGFOqPipZVdmSpHLQX8a4CO33XmG7',
    '1IRpLkGo7Qr6fD5bP1HLMLNFQweFRTtwy',
    '1IcmaghdZlnX5ei1XiSzIjOR5-MaotZC-',
    '1J6WBbCvuOdTJaZRImrl-CVHf9ZWSglT-',
    '1J6rJymLanyLIxrBDSe5Vozhol1FUMhhZ',
    '1OJoWcVw53x-aOQOFwN_FkxN21rvezEpJ',
    '1Oz8diAyrlt4gJ1obFA9BNZ-UzC1BzseM',
    '1R3Aq4zlmsK6_Atw9fmf78It8NAdUiXWA',
    '1Rr1-HAv3asY8GOXf2fk0LGgJpTrOEaXq',
    '1SRoIXKtz9I1fN5Ial7UxPB7UhzINbFuZ',
    '1TAOQJTyn9G4O1loN2I06m5idWE3QjIJE',
    '1U6t9K4ANQrtEsUDYevxNIMkFLCJ_WKTK',
    '1VejgheMN68f8QhfSxA6ZQUh-WQ-U8gll',
    '1Vh2cAZNPKZWippiy4_5xDWh7QFq3ZTCa',
    '1Vvq4E0O-dS8zLJd1UIHzWbuqXoRVtgRN',
    '1Wu0i2twK6-kJuNyGY9s1KyJ4mjgRCe2S',
    '1XcGxAIMEx0kxttzFyTTRgLgkHnt6Ujqa',
    '1ZcTqev-f57AMc6Q3aLztmT2CXTCn9VxJ',
    '1ZtzJ829LDWlhHjRkosWcFjRKL-JapqRo',
    '1a6ZFzXx18hoKvnjN1J-tfP8s8LNKsgIU',
    '1cIQapW3LHbHx7XjLLBdbYg-D4TjkDZTu',
    '1d3hXKYSfILFMhoWi7PMOaEbIYLY29MzW',
    '1e1TcLas5B_Eb1QKBqX9YeH8xqjSLhXa4',
    '1gKoYvU22PMmzfXH94EB50pP34c45SrZ1',
    '1gurpxsNRMzBVj3UmWhexNwhnr9ZZFAQV',
    '1hDHPlVP8XLLj00zFaDOHt1r2PPYcG0mG',
    '1hV0Toc43SPKzHf03iP3iUdZP1xlRznR-',
    '1lPRdJ7IQUb-Ix_UFORwsaaniLaDADgpm',
    '1lWCZ6a87GI7sHCB5lE_R6Yrucg3kuFTs',
    '1rhnH1iPXDE8Y9BNldwhu_wxGmQ9vJiXi',
    '1tyUw_v2SMYOJRsLgpPq3bxj8wK9cFVGz',
    '1ugcYkxXoGIrYp_aBNOBkk9NEQ4C12Z_a',
    '1z7F1PIo6DYIJ9rOpoKoP6QMcKfb40iC3',
    '1zyq90tHu0iCsLsKURHLE7mgzT-upLeVE',
  ];

  async function fetchFileMetadata(fileId: string): Promise<GoogleDriveFileMetadata | null> {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error('Missing VITE_GOOGLE_API_KEY');
      }

      // Try to get file metadata using public API
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,modifiedTime,createdTime,webViewLink&key=${apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        // If API fails, create minimal metadata from file ID
        console.warn(`⚠️ Could not fetch metadata for ${fileId}, using fallback`);
        return {
          id: fileId,
          name: `Document ${fileId.substring(0, 8)}`,
          webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
        };
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Error fetching metadata for ${fileId}:`, error);
      // Return fallback metadata
      return {
        id: fileId,
        name: `Document ${fileId.substring(0, 8)}`,
        webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
      };
    }
  }

  function formatFileSize(bytes: string | undefined): string {
    if (!bytes) return 'N/A';
    const size = parseInt(bytes);
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${Math.round(size / (1024 * 1024))} MB`;
  }

  function extractDateFromFilename(filename: string): string {
    // Try to extract date from common filename patterns
    const patterns = [
      /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/, // YYYY-MM-DD or YYYY.MM.DD
      /(\d{1,2})[.-](\d{4})/, // MM-YYYY or MM.YYYY
      /(20\d{2})/, // Just year 20XX
      /(19\d{2})/, // Just year 19XX
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        if (match[3] && match[1] && match[2]) {
          // Full date YYYY-MM-DD
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else if (match[2] && match[1]) {
          // MM-YYYY format
          return `${match[2]}-${match[1].padStart(2, '0')}-01`;
        } else if (match[1]) {
          // Just year
          return `${match[1]}-01-01`;
        }
      }
    }

    // Default to current date if no pattern matches
    const defaultDate = new Date().toISOString().split('T')[0];
    return defaultDate || '2024-01-01';
  }

  async function loadIssues() {
    loading.value = true;
    error.value = '';
    issues.value = [];

    try {
      console.log(`🔄 Dynamically fetching metadata for ${fileIds.length} Google Drive files...`);

      // Fetch metadata for all files in parallel
      const metadataPromises = fileIds.map((fileId) => fetchFileMetadata(fileId));
      const metadataResults = await Promise.all(metadataPromises);

      // Convert metadata to issues format
      const loadedIssues: IssueWithGoogleDrive[] = metadataResults
        .filter((metadata): metadata is GoogleDriveFileMetadata => metadata !== null)
        .map((metadata, index) => {
          const thumbnailUrl = `https://drive.google.com/thumbnail?id=${metadata.id}&sz=w400`;
          console.log(`📸 Thumbnail URL for ${metadata.name}: ${thumbnailUrl}`);

          return {
            id: index + 1,
            title: metadata.name?.replace(/\.pdf$/i, '') || `Issue ${index + 1}`,
            filename: metadata.name || `document_${metadata.id}.pdf`,
            date: extractDateFromFilename(metadata.name || ''),
            pages: 1, // We don't know page count without downloading
            url: metadata.webViewLink || `https://drive.google.com/file/d/${metadata.id}/view`,
            googleDriveUrl:
              metadata.webViewLink || `https://drive.google.com/file/d/${metadata.id}/view`,
            googleDriveFileId: metadata.id,
            thumbnailUrl: thumbnailUrl,
            fileSize: formatFileSize(metadata.size),
            modifiedTime: metadata.modifiedTime || metadata.createdTime || new Date().toISOString(),
            description: `Google Drive document: ${metadata.name}`,
            status: 'google-drive' as const,
            syncStatus: 'synced' as const,
          };
        });

      // Sort by date (newest first)
      loadedIssues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      issues.value = loadedIssues;
      console.log(`✅ Successfully loaded ${loadedIssues.length} dynamic Google Drive issues`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = `Failed to load Google Drive issues: ${errorMessage}`;
      console.error('❌ Error loading dynamic Google Drive issues:', err);
    } finally {
      loading.value = false;
    }
  }

  return {
    issues,
    loading,
    error,
    loadIssues,
  };
}
