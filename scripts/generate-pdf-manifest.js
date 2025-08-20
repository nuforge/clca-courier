/**
 * Build-time PDF manifest generator
 * Scans actual PDF files and creates a manifest for runtime discovery
 */

import fs from 'fs';
import path from 'path';

function generatePDFManifest() {
  const issuesDir = path.join(process.cwd(), 'public', 'issues');
  const outputPath = path.join(process.cwd(), 'public', 'data', 'pdf-manifest.json');

  console.log('🔍 Scanning for actual PDF files in:', issuesDir);

  try {
    const files = fs.readdirSync(issuesDir);
    const pdfFiles = files.filter((file) => file.toLowerCase().endsWith('.pdf'));

    const manifest = pdfFiles.map((filename) => {
      const filePath = path.join(issuesDir, filename);
      const stats = fs.statSync(filePath);

      return {
        filename,
        path: `/issues/${filename}`,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
      };
    });

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Write manifest
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          generated: new Date().toISOString(),
          count: manifest.length,
          files: manifest,
        },
        null,
        2,
      ),
    );

    console.log(`✅ Generated PDF manifest: ${manifest.length} files found`);
    console.log(`📄 Manifest saved to: ${outputPath}`);

    return manifest;
  } catch (error) {
    console.error('❌ Failed to generate PDF manifest:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePDFManifest();
}

export { generatePDFManifest };
