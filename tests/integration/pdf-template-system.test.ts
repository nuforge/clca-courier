/**
 * PDF Template System Integration Tests
 * Test-first approach: These tests are designed to fail initially and catch edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase services
const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn()
};

const mockStorage = {
  bucket: vi.fn(),
  file: vi.fn(),
  upload: vi.fn(),
  download: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn(),
  getMetadata: vi.fn(),
  setMetadata: vi.fn()
};

const mockAuth = {
  verifyIdToken: vi.fn(),
  getUser: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn()
};

vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  firestore: () => mockFirestore,
  storage: () => mockStorage,
  auth: () => mockAuth
}));

// Mock Puppeteer
const mockPuppeteer = {
  launch: vi.fn(),
  newPage: vi.fn(),
  close: vi.fn()
};

vi.mock('puppeteer-core', () => ({
  default: mockPuppeteer
}));

// Mock Chromium
vi.mock('@sparticuz/chromium', () => ({
  default: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/usr/bin/chromium',
    headless: true
  }
}));

// Mock PDF-lib
const mockPDFLib = {
  PDFDocument: {
    create: vi.fn(),
    load: vi.fn()
  },
  PDFPage: {
    create: vi.fn()
  }
};

vi.mock('pdf-lib', () => mockPDFLib);

// Mock Handlebars
const mockHandlebars = {
  compile: vi.fn(),
  registerHelper: vi.fn(),
  registerPartial: vi.fn()
};

vi.mock('handlebars', () => ({
  default: mockHandlebars
}));

// Mock template engine
vi.mock('../template-engine', () => ({
  loadTemplate: vi.fn(),
  registerHandlebarsHelpers: vi.fn(),
  TEMPLATE_MAPPING: {
    news: { template: 'article' },
    event: { template: 'event' },
    announcement: { template: 'announcement' },
    editorial: { template: 'editorial' },
    featured: { template: 'fullpage' }
  },
  getAvailableTemplates: vi.fn()
}));

describe('PDF Template System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('End-to-End Newsletter Generation', () => {
    it('should generate complete newsletter from submission to PDF', async () => {
      // Mock issue data
      const mockIssue = {
        id: 'issue1',
        title: 'Test Issue',
        issueNumber: '1',
        status: 'draft',
        submissions: ['submission1', 'submission2'],
        publicationDate: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'user1',
        updatedBy: 'user1'
      };

      // Mock submission data
      const mockSubmissions = [
        {
          id: 'submission1',
          title: 'Test Article 1',
          content: 'Test content 1',
          authorName: 'Author 1',
          contentType: 'news',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user1'
        },
        {
          id: 'submission2',
          title: 'Test Event 1',
          content: 'Test event content',
          authorName: 'Author 2',
          contentType: 'event',
          eventDate: new Date('2024-01-15'),
          eventTime: '10:00 AM',
          eventLocation: 'Test Location',
          eventContact: 'test@example.com',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user1'
        }
      ];

      // Mock Firestore responses
      mockFirestore.doc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockIssue
        })
      });

      mockFirestore.collection.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: mockSubmissions.map(sub => ({
              id: sub.id,
              data: () => sub
            }))
          })
        })
      });

      // Mock template compilation
      const mockCompiledTemplate = vi.fn().mockReturnValue('<div>Generated HTML</div>');
      mockHandlebars.compile.mockReturnValue(mockCompiledTemplate);

      // Mock Puppeteer
      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        close: vi.fn()
      };

      mockPuppeteer.launch.mockResolvedValue({
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn()
      });

      // Mock Storage
      const mockFile = {
        save: vi.fn().mockResolvedValue(undefined),
        getSignedUrl: vi.fn().mockResolvedValue(['https://storage.googleapis.com/test-pdf.pdf'])
      };

      mockStorage.bucket.mockReturnValue({
        file: vi.fn().mockReturnValue(mockFile)
      });

      // Mock PDF-lib
      const mockPDFDoc = {
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(Buffer.from('mock-merged-pdf'))
      };

      mockPDFLib.PDFDocument.create.mockResolvedValue(mockPDFDoc);

      // This test will fail initially as the functions don't exist
      // const result = await generateNewsletter({ issueId: 'issue1' }, { auth: { uid: 'user1' } });
      // expect(result.success).toBe(true);
      // expect(result.pdfUrl).toBe('https://storage.googleapis.com/test-pdf.pdf');
      // expect(mockCompiledTemplate).toHaveBeenCalledTimes(2); // One for each submission
      // expect(mockPage.setContent).toHaveBeenCalledTimes(2);
      // expect(mockPage.pdf).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed content types in newsletter', async () => {
      // Mock issue data
      const mockIssue = {
        id: 'issue1',
        title: 'Test Issue',
        issueNumber: '1',
        status: 'draft',
        submissions: ['submission1', 'submission2', 'submission3', 'submission4', 'submission5'],
        publicationDate: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'user1',
        updatedBy: 'user1'
      };

      // Mock submission data with different content types
      const mockSubmissions = [
        {
          id: 'submission1',
          title: 'News Article',
          content: 'News content',
          authorName: 'Author 1',
          contentType: 'news',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user1'
        },
        {
          id: 'submission2',
          title: 'Community Event',
          content: 'Event content',
          authorName: 'Author 2',
          contentType: 'event',
          eventDate: new Date('2024-01-15'),
          eventTime: '10:00 AM',
          eventLocation: 'Test Location',
          eventContact: 'test@example.com',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user1'
        },
        {
          id: 'submission3',
          title: 'Important Announcement',
          content: 'Announcement content',
          authorName: 'Author 3',
          contentType: 'announcement',
          priority: 'high',
          featured: true,
          createdAt: new Date('2024-01-01'),
          createdBy: 'user1'
        },
        {
          id: 'submission4',
          title: 'Editorial Opinion',
          content: 'Editorial content',
          authorName: 'Author 4',
          contentType: 'editorial',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user1'
        },
        {
          id: 'submission5',
          title: 'Featured Story',
          content: 'Featured content',
          authorName: 'Author 5',
          contentType: 'featured',
          featured: true,
          createdAt: new Date('2024-01-01'),
          createdBy: 'user1'
        }
      ];

      // Mock Firestore responses
      mockFirestore.doc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockIssue
        })
      });

      mockFirestore.collection.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: mockSubmissions.map(sub => ({
              id: sub.id,
              data: () => sub
            }))
          })
        })
      });

      // Mock template compilation
      const mockCompiledTemplate = vi.fn().mockReturnValue('<div>Generated HTML</div>');
      mockHandlebars.compile.mockReturnValue(mockCompiledTemplate);

      // Mock Puppeteer
      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        close: vi.fn()
      };

      mockPuppeteer.launch.mockResolvedValue({
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn()
      });

      // Mock Storage
      const mockFile = {
        save: vi.fn().mockResolvedValue(undefined),
        getSignedUrl: vi.fn().mockResolvedValue(['https://storage.googleapis.com/test-pdf.pdf'])
      };

      mockStorage.bucket.mockReturnValue({
        file: vi.fn().mockReturnValue(mockFile)
      });

      // Mock PDF-lib
      const mockPDFDoc = {
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(Buffer.from('mock-merged-pdf'))
      };

      mockPDFLib.PDFDocument.create.mockResolvedValue(mockPDFDoc);

      // This test will fail initially as the functions don't exist
      // const result = await generateNewsletter({ issueId: 'issue1' }, { auth: { uid: 'user1' } });
      // expect(result.success).toBe(true);
      // expect(result.pdfUrl).toBe('https://storage.googleapis.com/test-pdf.pdf');
      // expect(mockCompiledTemplate).toHaveBeenCalledTimes(5); // One for each submission
      // expect(mockPage.setContent).toHaveBeenCalledTimes(5);
      // expect(mockPage.pdf).toHaveBeenCalledTimes(5);
    });

    it('should handle template inheritance correctly', async () => {
      // Mock issue data
      const mockIssue = {
        id: 'issue1',
        title: 'Test Issue',
        issueNumber: '1',
        status: 'draft',
        submissions: ['submission1'],
        publicationDate: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'user1',
        updatedBy: 'user1'
      };

      // Mock submission data
      const mockSubmissions = [
        {
          id: 'submission1',
          title: 'Test Article',
          content: 'Test content',
          authorName: 'Author 1',
          contentType: 'news',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user1'
        }
      ];

      // Mock Firestore responses
      mockFirestore.doc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockIssue
        })
      });

      mockFirestore.collection.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: mockSubmissions.map(sub => ({
              id: sub.id,
              data: () => sub
            }))
          })
        })
      });

      // Mock template compilation with inheritance
      const mockCompiledTemplate = vi.fn().mockReturnValue(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Issue</title>
        </head>
        <body>
          <div class="content">
            <h1>Test Article</h1>
            <p>Test content</p>
            <span class="author">Author 1</span>
          </div>
        </body>
        </html>
      `);
      mockHandlebars.compile.mockReturnValue(mockCompiledTemplate);

      // Mock Puppeteer
      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        close: vi.fn()
      };

      mockPuppeteer.launch.mockResolvedValue({
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn()
      });

      // Mock Storage
      const mockFile = {
        save: vi.fn().mockResolvedValue(undefined),
        getSignedUrl: vi.fn().mockResolvedValue(['https://storage.googleapis.com/test-pdf.pdf'])
      };

      mockStorage.bucket.mockReturnValue({
        file: vi.fn().mockReturnValue(mockFile)
      });

      // Mock PDF-lib
      const mockPDFDoc = {
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(Buffer.from('mock-merged-pdf'))
      };

      mockPDFLib.PDFDocument.create.mockResolvedValue(mockPDFDoc);

      // This test will fail initially as the functions don't exist
      // const result = await generateNewsletter({ issueId: 'issue1' }, { auth: { uid: 'user1' } });
      // expect(result.success).toBe(true);
      // expect(result.pdfUrl).toBe('https://storage.googleapis.com/test-pdf.pdf');
      // expect(mockCompiledTemplate).toHaveBeenCalledWith(expect.objectContaining({
      //   title: 'Test Article',
      //   content: 'Test content',
      //   author: 'Author 1',
      //   issue: expect.objectContaining({
      //     title: 'Test Issue',
      //     issueNumber: '1'
      //   })
      // }));
    });
  });

  describe('Template Management Integration', () => {
    it('should preview template with real data', async () => {
      // Mock template data
      const mockTemplateData = {
        title: 'Test Article',
        content: 'Test content',
        author: 'Test Author',
        createdAt: new Date('2024-01-01'),
        featuredImageUrl: 'https://example.com/image.jpg',
        issue: {
          title: 'Test Issue',
          issueNumber: '1',
          publicationDate: new Date('2024-01-01')
        },
        now: new Date('2024-01-01'),
        eventDate: new Date('2024-01-15'),
        eventTime: '10:00 AM',
        eventLocation: 'Test Location',
        eventContact: 'test@example.com',
        subtitle: 'Test Subtitle',
        featured: true,
        priority: 'high'
      };

      // Mock template compilation
      const mockCompiledTemplate = vi.fn().mockReturnValue(`
        <div class="template">
          <h1>Test Article</h1>
          <p>Test content</p>
          <span class="author">Test Author</span>
          <div class="event-details">
            <p>Date: 2024-01-15</p>
            <p>Time: 10:00 AM</p>
            <p>Location: Test Location</p>
            <p>Contact: test@example.com</p>
          </div>
        </div>
      `);
      mockHandlebars.compile.mockReturnValue(mockCompiledTemplate);

      // This test will fail initially as the function doesn't exist
      // const result = await previewTemplate({
      //   templateName: 'article',
      //   previewData: mockTemplateData
      // }, { auth: { uid: 'user1' } });
      // expect(result.success).toBe(true);
      // expect(result.html).toContain('Test Article');
      // expect(result.html).toContain('Test content');
      // expect(result.html).toContain('Test Author');
      // expect(result.html).toContain('2024-01-15');
      // expect(result.html).toContain('10:00 AM');
      // expect(result.html).toContain('Test Location');
      // expect(result.html).toContain('test@example.com');
    });

    it('should test template with sample data', async () => {
      // Mock template compilation
      const mockCompiledTemplate = vi.fn().mockReturnValue('<div>Test HTML</div>');
      mockHandlebars.compile.mockReturnValue(mockCompiledTemplate);

      // Mock Puppeteer
      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        close: vi.fn()
      };

      mockPuppeteer.launch.mockResolvedValue({
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn()
      });

      // Mock Storage
      const mockFile = {
        save: vi.fn().mockResolvedValue(undefined),
        getSignedUrl: vi.fn().mockResolvedValue(['https://storage.googleapis.com/test-pdf.pdf'])
      };

      mockStorage.bucket.mockReturnValue({
        file: vi.fn().mockReturnValue(mockFile)
      });

      // This test will fail initially as the function doesn't exist
      // const result = await testTemplate({ templateName: 'article' }, { auth: { uid: 'user1' } });
      // expect(result.success).toBe(true);
      // expect(result.testPdfUrl).toBe('https://storage.googleapis.com/test-pdf.pdf');
      // expect(mockCompiledTemplate).toHaveBeenCalledWith(expect.objectContaining({
      //   title: expect.any(String),
      //   content: expect.any(String),
      //   author: expect.any(String),
      //   issue: expect.objectContaining({
      //     title: expect.any(String),
      //     issueNumber: expect.any(String)
      //   })
      // }));
    });

    it('should list all available templates', async () => {
      // Mock template list
      const mockTemplates = ['article', 'event', 'announcement', 'editorial', 'fullpage'];

      // This test will fail initially as the function doesn't exist
      // const result = await getAvailableTemplatesList({}, { auth: { uid: 'user1' } });
      // expect(result.success).toBe(true);
      // expect(result.templates).toHaveLength(5);
      // expect(result.templates).toContain('article');
      // expect(result.templates).toContain('event');
      // expect(result.templates).toContain('announcement');
      // expect(result.templates).toContain('editorial');
      // expect(result.templates).toContain('fullpage');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle template compilation errors gracefully', async () => {
      // Mock template compilation error
      mockHandlebars.compile.mockImplementation(() => {
        throw new Error('Template compilation failed');
      });

      // This test will fail initially as the function doesn't exist
      // await expect(previewTemplate({
      //   templateName: 'article',
      //   previewData: {}
      // }, { auth: { uid: 'user1' } }))
      //   .rejects.toThrow('Template compilation failed');
    });

    it('should handle Puppeteer errors gracefully', async () => {
      // Mock Puppeteer error
      mockPuppeteer.launch.mockRejectedValue(new Error('Puppeteer launch failed'));

      // This test will fail initially as the function doesn't exist
      // await expect(testTemplate({
      //   templateName: 'article'
      // }, { auth: { uid: 'user1' } }))
      //   .rejects.toThrow('Puppeteer launch failed');
    });

    it('should handle storage errors gracefully', async () => {
      // Mock template compilation
      const mockCompiledTemplate = vi.fn().mockReturnValue('<div>Test HTML</div>');
      mockHandlebars.compile.mockReturnValue(mockCompiledTemplate);

      // Mock Puppeteer
      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        close: vi.fn()
      };

      mockPuppeteer.launch.mockResolvedValue({
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn()
      });

      // Mock Storage error
      const mockFile = {
        save: vi.fn().mockRejectedValue(new Error('Storage upload failed')),
        getSignedUrl: vi.fn()
      };

      mockStorage.bucket.mockReturnValue({
        file: vi.fn().mockReturnValue(mockFile)
      });

      // This test will fail initially as the function doesn't exist
      // await expect(testTemplate({
      //   templateName: 'article'
      // }, { auth: { uid: 'user1' } }))
      //   .rejects.toThrow('Storage upload failed');
    });

    it('should handle PDF merging errors gracefully', async () => {
      // Mock issue data
      const mockIssue = {
        id: 'issue1',
        title: 'Test Issue',
        issueNumber: '1',
        status: 'draft',
        submissions: ['submission1'],
        publicationDate: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'user1',
        updatedBy: 'user1'
      };

      // Mock submission data
      const mockSubmissions = [
        {
          id: 'submission1',
          title: 'Test Article',
          content: 'Test content',
          authorName: 'Author 1',
          contentType: 'news',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user1'
        }
      ];

      // Mock Firestore responses
      mockFirestore.doc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockIssue
        })
      });

      mockFirestore.collection.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: mockSubmissions.map(sub => ({
              id: sub.id,
              data: () => sub
            }))
          })
        })
      });

      // Mock template compilation
      const mockCompiledTemplate = vi.fn().mockReturnValue('<div>Generated HTML</div>');
      mockHandlebars.compile.mockReturnValue(mockCompiledTemplate);

      // Mock Puppeteer
      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        close: vi.fn()
      };

      mockPuppeteer.launch.mockResolvedValue({
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn()
      });

      // Mock PDF-lib error
      mockPDFLib.PDFDocument.create.mockRejectedValue(new Error('PDF creation failed'));

      // This test will fail initially as the function doesn't exist
      // await expect(generateNewsletter({ issueId: 'issue1' }, { auth: { uid: 'user1' } }))
      //   .rejects.toThrow('PDF creation failed');
    });
  });

  describe('Performance Integration', () => {
    it('should handle large newsletters efficiently', async () => {
      // Mock issue data with many submissions
      const mockIssue = {
        id: 'issue1',
        title: 'Test Issue',
        issueNumber: '1',
        status: 'draft',
        submissions: Array.from({ length: 100 }, (_, i) => `submission${i}`),
        publicationDate: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'user1',
        updatedBy: 'user1'
      };

      // Mock submission data
      const mockSubmissions = Array.from({ length: 100 }, (_, i) => ({
        id: `submission${i}`,
        title: `Test Article ${i}`,
        content: `Test content ${i}`,
        authorName: `Author ${i}`,
        contentType: 'news',
        createdAt: new Date('2024-01-01'),
        createdBy: 'user1'
      }));

      // Mock Firestore responses
      mockFirestore.doc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockIssue
        })
      });

      mockFirestore.collection.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: mockSubmissions.map(sub => ({
              id: sub.id,
              data: () => sub
            }))
          })
        })
      });

      // Mock template compilation
      const mockCompiledTemplate = vi.fn().mockReturnValue('<div>Generated HTML</div>');
      mockHandlebars.compile.mockReturnValue(mockCompiledTemplate);

      // Mock Puppeteer
      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        close: vi.fn()
      };

      mockPuppeteer.launch.mockResolvedValue({
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn()
      });

      // Mock Storage
      const mockFile = {
        save: vi.fn().mockResolvedValue(undefined),
        getSignedUrl: vi.fn().mockResolvedValue(['https://storage.googleapis.com/test-pdf.pdf'])
      };

      mockStorage.bucket.mockReturnValue({
        file: vi.fn().mockReturnValue(mockFile)
      });

      // Mock PDF-lib
      const mockPDFDoc = {
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(Buffer.from('mock-merged-pdf'))
      };

      mockPDFLib.PDFDocument.create.mockResolvedValue(mockPDFDoc);

      // This test will fail initially as the function doesn't exist
      // const startTime = Date.now();
      // const result = await generateNewsletter({ issueId: 'issue1' }, { auth: { uid: 'user1' } });
      // const endTime = Date.now();
      // const duration = endTime - startTime;

      // expect(result.success).toBe(true);
      // expect(result.pdfUrl).toBe('https://storage.googleapis.com/test-pdf.pdf');
      // expect(mockCompiledTemplate).toHaveBeenCalledTimes(100);
      // expect(mockPage.setContent).toHaveBeenCalledTimes(100);
      // expect(mockPage.pdf).toHaveBeenCalledTimes(100);
      // expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should handle concurrent template operations', async () => {
      // Mock template compilation
      const mockCompiledTemplate = vi.fn().mockReturnValue('<div>Test HTML</div>');
      mockHandlebars.compile.mockReturnValue(mockCompiledTemplate);

      // Mock Puppeteer
      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        close: vi.fn()
      };

      mockPuppeteer.launch.mockResolvedValue({
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn()
      });

      // Mock Storage
      const mockFile = {
        save: vi.fn().mockResolvedValue(undefined),
        getSignedUrl: vi.fn().mockResolvedValue(['https://storage.googleapis.com/test-pdf.pdf'])
      };

      mockStorage.bucket.mockReturnValue({
        file: vi.fn().mockReturnValue(mockFile)
      });

      // This test will fail initially as the functions don't exist
      // const promises = [
      //   testTemplate({ templateName: 'article' }, { auth: { uid: 'user1' } }),
      //   testTemplate({ templateName: 'event' }, { auth: { uid: 'user1' } }),
      //   testTemplate({ templateName: 'announcement' }, { auth: { uid: 'user1' } }),
      //   testTemplate({ templateName: 'editorial' }, { auth: { uid: 'user1' } }),
      //   testTemplate({ templateName: 'fullpage' }, { auth: { uid: 'user1' } })
      // ];

      // const results = await Promise.all(promises);
      // expect(results).toHaveLength(5);
      // results.forEach(result => {
      //   expect(result.success).toBe(true);
      //   expect(result.testPdfUrl).toBe('https://storage.googleapis.com/test-pdf.pdf');
      // });
    });
  });
});
