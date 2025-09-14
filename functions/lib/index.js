"use strict";
/**
 * Firebase Cloud Functions for CLCA Courier Newsletter Generation
 *
 * This function generates PDF newsletters from approved content submissions
 * using Puppeteer for HTML to PDF conversion.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNewsletter = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const puppeteer_1 = __importDefault(require("puppeteer"));
const pdf_lib_1 = require("pdf-lib");
const Handlebars = __importStar(require("handlebars"));
// Initialize Firebase Admin
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const storage = (0, storage_1.getStorage)();
/**
 * Generate Newsletter PDF
 *
 * This function:
 * 1. Fetches approved submissions for the issue
 * 2. Generates HTML pages for each submission
 * 3. Converts HTML to PDF using Puppeteer
 * 4. Merges all PDFs into a single newsletter
 * 5. Uploads to Firebase Storage
 * 6. Updates the issue document with download URL
 */
exports.generateNewsletter = (0, https_1.onCall)(async (request) => {
    // Authentication check
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { issueId } = request.data;
    if (!issueId) {
        throw new https_1.HttpsError('invalid-argument', 'Issue ID is required');
    }
    const progressRef = db.collection('generation_progress').doc(issueId);
    try {
        // Update progress: Starting
        await progressRef.set({
            issueId,
            status: 'starting',
            progress: 0,
            message: 'Initializing newsletter generation...',
            timestamp: firestore_1.FieldValue.serverTimestamp()
        });
        // Fetch issue data
        const issueDoc = await db.collection('newsletter_issues').doc(issueId).get();
        if (!issueDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Newsletter issue not found');
        }
        const issue = issueDoc.data();
        const submissionIds = issue.submissions || [];
        if (submissionIds.length === 0) {
            throw new https_1.HttpsError('failed-precondition', 'No submissions found for this issue');
        }
        // Update progress: Fetching content
        await progressRef.update({
            status: 'fetching_content',
            progress: 10,
            message: `Fetching ${submissionIds.length} content submissions...`
        });
        // Fetch all submissions
        const submissions = [];
        for (const submissionId of submissionIds) {
            const submissionDoc = await db.collection('content').doc(submissionId).get();
            if (submissionDoc.exists) {
                submissions.push(Object.assign({ id: submissionDoc.id }, submissionDoc.data()));
            }
        }
        if (submissions.length === 0) {
            throw new https_1.HttpsError('failed-precondition', 'No valid submissions found');
        }
        // Update progress: Generating pages
        await progressRef.update({
            status: 'generating_pages',
            progress: 20,
            message: 'Generating PDF pages from content...'
        });
        // Launch Puppeteer
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        // Generate PDF for each submission
        const pdfBuffers = [];
        const totalSubmissions = submissions.length;
        for (let i = 0; i < submissions.length; i++) {
            const submission = submissions[i];
            const progress = 20 + (i / totalSubmissions) * 50; // 20-70% for page generation
            await progressRef.update({
                progress: Math.round(progress),
                message: `Generating page ${i + 1} of ${totalSubmissions}: ${submission.title}`
            });
            // Generate HTML for this submission
            const htmlContent = generateSubmissionHTML(submission, issue);
            // Set content and generate PDF
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '1in',
                    right: '0.75in',
                    bottom: '1in',
                    left: '0.75in'
                }
            });
            pdfBuffers.push(pdfBuffer);
        }
        await browser.close();
        // Update progress: Merging PDFs
        await progressRef.update({
            status: 'merging_pdf',
            progress: 70,
            message: 'Merging PDF pages into final newsletter...'
        });
        // Merge all PDFs
        const mergedPdf = await pdf_lib_1.PDFDocument.create();
        for (const buffer of pdfBuffers) {
            const pdf = await pdf_lib_1.PDFDocument.load(buffer);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => mergedPdf.addPage(page));
        }
        const mergedPdfBytes = await mergedPdf.save();
        // Update progress: Uploading
        await progressRef.update({
            status: 'uploading',
            progress: 85,
            message: 'Uploading final PDF to storage...'
        });
        // Upload to Firebase Storage
        const bucket = storage.bucket();
        const fileName = `newsletters/${issueId}/final-${Date.now()}.pdf`;
        const file = bucket.file(fileName);
        await file.save(Buffer.from(mergedPdfBytes), {
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    issueId,
                    issueTitle: issue.title,
                    generatedAt: new Date().toISOString(),
                    generatedBy: request.auth.uid
                }
            }
        });
        // Make file publicly accessible
        await file.makePublic();
        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        // Update progress: Complete
        await progressRef.update({
            status: 'complete',
            progress: 100,
            message: 'Newsletter generation completed successfully!'
        });
        // Update issue document
        await db.collection('newsletter_issues').doc(issueId).update({
            status: 'ready',
            finalPdfUrl: publicUrl,
            finalPdfPath: fileName,
            generatedAt: firestore_1.FieldValue.serverTimestamp(),
            generatedBy: request.auth.uid
        });
        return {
            success: true,
            issueId,
            pdfUrl: publicUrl,
            message: 'Newsletter generated successfully!'
        };
    }
    catch (error) {
        console.error('Newsletter generation failed:', error);
        // Update progress with error
        await progressRef.update({
            status: 'error',
            progress: 0,
            message: 'Newsletter generation failed',
            error: error instanceof Error ? error.message : String(error)
        });
        // Update issue status back to draft
        await db.collection('newsletter_issues').doc(issueId).update({
            status: 'draft'
        });
        throw new https_1.HttpsError('internal', 'Newsletter generation failed', error);
    }
});
/**
 * Generate HTML content for a single submission
 */
function generateSubmissionHTML(submission, issue) {
    const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{title}}</title>
      <style>
        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background: white;
        }

        .header {
          border-bottom: 3px solid #2c5aa0;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .newsletter-title {
          font-size: 24px;
          font-weight: bold;
          color: #2c5aa0;
          margin: 0 0 10px 0;
        }

        .issue-info {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .article-title {
          font-size: 20px;
          font-weight: bold;
          color: #2c5aa0;
          margin: 0 0 15px 0;
          border-left: 4px solid #2c5aa0;
          padding-left: 15px;
        }

        .article-meta {
          font-size: 12px;
          color: #888;
          margin-bottom: 20px;
          font-style: italic;
        }

        .article-content {
          font-size: 14px;
          line-height: 1.7;
          margin-bottom: 30px;
        }

        .article-content h1, .article-content h2, .article-content h3 {
          color: #2c5aa0;
          margin-top: 25px;
          margin-bottom: 15px;
        }

        .article-content h1 { font-size: 18px; }
        .article-content h2 { font-size: 16px; }
        .article-content h3 { font-size: 14px; }

        .article-content p {
          margin-bottom: 15px;
        }

        .article-content ul, .article-content ol {
          margin: 15px 0;
          padding-left: 30px;
        }

        .article-content blockquote {
          border-left: 3px solid #2c5aa0;
          padding-left: 20px;
          margin: 20px 0;
          font-style: italic;
          color: #555;
        }

        .featured-image {
          max-width: 100%;
          height: auto;
          margin: 20px 0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .footer {
          border-top: 1px solid #ddd;
          padding-top: 20px;
          margin-top: 40px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }

        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
          .article-content { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="newsletter-title">{{issue.title}}</h1>
        <p class="issue-info">Issue {{issue.issueNumber}} • {{formatDate issue.publicationDate}}</p>
      </div>

      <h2 class="article-title">{{title}}</h2>

      <div class="article-meta">
        By {{author}} • {{formatDate createdAt}}
      </div>

      {{#if featuredImageUrl}}
      <img src="{{featuredImageUrl}}" alt="{{title}}" class="featured-image" />
      {{/if}}

      <div class="article-content">
        {{{content}}}
      </div>

      <div class="footer">
        <p>CLCA Courier Newsletter • Generated on {{formatDate now}}</p>
      </div>
    </body>
    </html>
  `;
    // Register Handlebars helpers
    Handlebars.registerHelper('formatDate', (date) => {
        if (!date)
            return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    });
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate({
        title: submission.title,
        content: submission.description || submission.content || '',
        author: submission.createdBy || 'Community Member',
        createdAt: submission.createdAt,
        featuredImageUrl: submission.featuredImageUrl,
        issue: {
            title: issue.title,
            issueNumber: issue.issueNumber,
            publicationDate: issue.publicationDate
        },
        now: new Date()
    });
}
//# sourceMappingURL=index.js.map