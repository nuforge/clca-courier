"use strict";
/**
 * Firebase Cloud Functions for CLCA Courier Newsletter Generation
 *
 * This function generates PDF newsletters from approved content submissions
 * using Puppeteer for HTML to PDF conversion.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableTemplatesList = exports.testTemplate = exports.previewTemplate = exports.generateNewsletter = exports.generateNewsletterHttp = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const auth_1 = require("firebase-admin/auth");
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const pdf_lib_1 = require("pdf-lib");
const template_engine_1 = require("./template-engine");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const storage = (0, storage_1.getStorage)();
const auth = (0, auth_1.getAuth)();
// Register Handlebars helpers
(0, template_engine_1.registerHandlebarsHelpers)();
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
// HTTP version with CORS support using proper Firebase pattern
exports.generateNewsletterHttp = (0, https_1.onRequest)({
    memory: '1GiB' // Increase memory limit for PDF generation
}, async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        // Authentication check - verify Firebase token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const token = authHeader.split('Bearer ')[1];
        try {
            await auth.verifyIdToken(token);
        }
        catch (error) {
            res.status(401).json({ success: false, error: 'Invalid token' });
            return;
        }
        const { issueId } = req.body;
        if (!issueId) {
            res.status(400).json({ success: false, error: 'Issue ID is required' });
            return;
        }
        // Call the existing logic
        const result = await generateNewsletterLogic(issueId);
        res.status(200).json(Object.assign({ success: true }, result));
    }
    catch (error) {
        console.error('Newsletter generation failed:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Return detailed error in development
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json(Object.assign({ success: false, error: error instanceof Error ? error.message : 'Newsletter generation failed' }, (isDev && {
            stack: error instanceof Error ? error.stack : undefined,
            details: error
        })));
    }
});
// Shared logic function
async function generateNewsletterLogic(issueId) {
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
        const issueDoc = await db.collection('newsletters').doc(issueId).get();
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
        // Launch Puppeteer with optimized Chromium
        console.log('Launching Puppeteer with Chromium...');
        console.log('Chromium args:', chromium_1.default.args);
        console.log('Chromium executable path:', await chromium_1.default.executablePath());
        const browser = await puppeteer_core_1.default.launch({
            args: [
                ...chromium_1.default.args,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ],
            defaultViewport: chromium_1.default.defaultViewport,
            executablePath: await chromium_1.default.executablePath(),
            headless: true,
        });
        console.log('Puppeteer browser launched successfully');
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
            // Generate HTML for this submission using template system
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
                    generatedBy: 'system'
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
        await db.collection('newsletters').doc(issueId).update({
            status: 'ready',
            finalPdfUrl: publicUrl,
            finalPdfPath: fileName,
            generatedAt: firestore_1.FieldValue.serverTimestamp(),
            generatedBy: 'system' // Will be updated by caller
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
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Update progress with detailed error
        await progressRef.update({
            status: 'error',
            progress: 0,
            message: 'Newsletter generation failed',
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
        });
        // Update issue status back to draft
        await db.collection('newsletters').doc(issueId).update({
            status: 'draft'
        });
        // Re-throw with more details
        throw error instanceof Error ? error : new Error(String(error));
    }
}
// Original callable version (keeping for compatibility)
exports.generateNewsletter = (0, https_1.onCall)({
    memory: '1GiB' // Increase memory limit for PDF generation
}, async (request) => {
    // Authentication check
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { issueId } = request.data;
    if (!issueId) {
        throw new https_1.HttpsError('invalid-argument', 'Issue ID is required');
    }
    try {
        const result = await generateNewsletterLogic(issueId);
        // Update with user ID
        await db.collection('newsletters').doc(issueId).update({
            generatedBy: request.auth.uid
        });
        return result;
    }
    catch (error) {
        throw new https_1.HttpsError('internal', 'Newsletter generation failed', error);
    }
});
/**
 * Generate HTML content for a single submission using template system
 */
function generateSubmissionHTML(submission, issue) {
    // Determine template based on content type
    const contentType = submission.contentType || 'news';
    const templateConfig = template_engine_1.TEMPLATE_MAPPING[contentType] || template_engine_1.TEMPLATE_MAPPING['news'];
    // Load appropriate template
    const template = (0, template_engine_1.loadTemplate)(templateConfig.template);
    // Prepare template data
    const templateData = {
        title: submission.title,
        content: submission.description || submission.content || '',
        author: submission.authorName || submission.createdBy || 'Community Member',
        createdAt: submission.createdAt,
        featuredImageUrl: submission.featuredImageUrl,
        issue: {
            title: issue.title,
            issueNumber: issue.issueNumber,
            publicationDate: issue.publicationDate
        },
        now: new Date(),
        // Event-specific data
        eventDate: submission.eventDate,
        eventTime: submission.eventTime,
        eventLocation: submission.eventLocation,
        eventContact: submission.eventContact,
        // Editorial-specific data
        subtitle: submission.subtitle,
        // Feature flags
        featured: submission.featured || false,
        priority: submission.priority || 'normal'
    };
    return template(templateData);
}
/**
 * Preview Template Function
 * Returns HTML for template preview without generating PDF
 */
exports.previewTemplate = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { templateName, contentData } = request.data;
    if (!templateName) {
        throw new https_1.HttpsError('invalid-argument', 'Template name is required');
    }
    try {
        const template = (0, template_engine_1.loadTemplate)(templateName);
        const html = template(contentData || {});
        return {
            success: true,
            html,
            templateName
        };
    }
    catch (error) {
        throw new https_1.HttpsError('internal', `Template preview failed: ${error instanceof Error ? error.message : String(error)}`);
    }
});
/**
 * Test Template Function
 * Generates a test PDF for template validation
 */
exports.testTemplate = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { templateName, testData } = request.data;
    if (!templateName) {
        throw new https_1.HttpsError('invalid-argument', 'Template name is required');
    }
    try {
        const template = (0, template_engine_1.loadTemplate)(templateName);
        const html = template(testData || {});
        // Launch browser for test PDF generation
        const browser = await puppeteer_core_1.default.launch({
            args: chromium_1.default.args,
            defaultViewport: chromium_1.default.defaultViewport,
            executablePath: await chromium_1.default.executablePath(),
            headless: true,
        });
        const page = await browser.newPage();
        await page.setContent(html);
        const pdf = await page.pdf({ format: 'letter' });
        await browser.close();
        // Save test PDF to storage
        const bucket = storage.bucket();
        const fileName = `test-pdfs/test-${templateName}-${Date.now()}.pdf`;
        const file = bucket.file(fileName);
        await file.save(pdf);
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        return {
            success: true,
            downloadUrl: publicUrl,
            templateName
        };
    }
    catch (error) {
        throw new https_1.HttpsError('internal', `Template test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
});
/**
 * Get Available Templates Function
 * Returns list of available templates
 */
exports.getAvailableTemplatesList = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const templates = (0, template_engine_1.getAvailableTemplates)();
        return {
            success: true,
            templates,
            templateMapping: template_engine_1.TEMPLATE_MAPPING
        };
    }
    catch (error) {
        throw new https_1.HttpsError('internal', `Failed to get templates: ${error instanceof Error ? error.message : String(error)}`);
    }
});
//# sourceMappingURL=index.js.map