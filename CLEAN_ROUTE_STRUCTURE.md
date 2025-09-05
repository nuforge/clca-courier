# CLCA Courier - Clean Route Structure

## 🎯 Route Organization (September 5, 2025)

### 📄 **Main Public Routes**
- `/` - Home page (IndexPage.vue)
- `/news` - News & Updates (NewsUpdatesPage.vue)
- `/classifieds` - Classifieds & Ads (ClassifiedsPage.vue)
- `/contact` - Contact information (ContactPage.vue)
- `/about` - About CLCA (AboutPage.vue)
- `/map` - Interactive Lake Map (MapRefactoredPage.vue)

### 📚 **Newsletter Archive System (Firebase-Powered)**
- `/archive` - Main archive with search/filters (FirebaseNewsletterArchivePage.vue)
- `/archive/:id` - Individual newsletter viewer (FirebaseNewsletterDetailsPage.vue)

### ✍️ **Contribution System**
- `/contribute` - Main contribution hub (ContributePage.vue)
- `/contribute/submit` - General submission (SubmitContentPage.vue)
- `/contribute/article` - Article submission (ArticleSubmissionPage.vue)
- `/contribute/photo` - Photo submission (PhotoSubmissionPage.vue)
- `/contribute/event` - Event announcement (EventAnnouncementPage.vue)
- `/contribute/ideas` - Share ideas (ShareIdeasPage.vue)

### 👤 **User Account**
- `/account` - User account management (AccountPage.vue)

### ⚖️ **Legal Pages**
- `/privacy` - Privacy Policy (PrivacyPolicyPage.vue)
- `/terms` - Terms of Service (TermsOfServicePage.vue)
- `/accessibility` - Accessibility Statement (AccessibilityPage.vue)

### 🛠️ **Admin Routes** (Authenticated Users Only)
- `/admin` - **Admin Dashboard** (AdminDashboardPage.vue) ⭐ **NEW**
- `/admin/firebase-demo` - Firebase testing tools (FirebaseDemoPage.vue)
- `/admin/pdf-extraction` - PDF text extraction tools (PdfTextExtractionToolPage.vue)
- `/admin/test` - Lightweight testing page (LightweightTestPage.vue)

### 🔄 **Legacy Routes** (Backwards Compatibility)
- `/archive/legacy` - Old archive system (AdvancedIssueArchivePage.vue)
- `/archive/:id(\\d+)` - Legacy issue details (IssueDetailsPageEnhanced.vue)

---

## 🏗️ **Admin Dashboard Features**

### 📊 **Organized Admin Sections:**
1. **Newsletter Management**
   - Firebase Demo (create/test newsletter documents)
   - Newsletter Archive (view live archive)
   - PDF Text Extraction (process PDFs)

2. **Content Management**
   - All Submissions (review contributions)
   - News Updates (manage news)
   - Classifieds (moderate ads)

3. **System Tools**
   - Lightweight Test (development testing)
   - Interactive Map (map management)
   - Legacy Archive (old system access)

4. **User Management**
   - Account Settings
   - Contact Management
   - About Page editing

### ⚡ **Quick Actions:**
- View Site (return to public view)
- Refresh Cache (clear application cache)
- Backup Data (trigger data backup)

### 📈 **System Status:**
- Storage usage monitoring
- Memory usage tracking
- System uptime display

---

## 🧹 **Files Cleaned Up**

### ✅ **Removed Unused Files:**
- `IssueDetailsPage.vue` (superseded by Enhanced version)
- `IssueDetailsPageEnhanced-new.vue` (duplicate)
- `PublicationHubPage.vue` (replaced by Firebase archive)
- `PublicationHub.vue` (component no longer needed)

### ✅ **Routes Organized:**
- Grouped by functionality
- Clear admin separation
- Legacy routes preserved for compatibility
- Removed duplicate/test routes

---

## 🎯 **Navigation Access**

### 🔓 **Public Navigation:**
All main public routes accessible via AppNavigation component in sidebar.

### 🔐 **Admin Navigation:**
Admin Dashboard appears in navigation only when user is authenticated.

### 🎯 **Direct URLs:**
- **Admin Dashboard**: `http://localhost:9000/admin`
- **Firebase Demo**: `http://localhost:9000/admin/firebase-demo`
- **Newsletter Archive**: `http://localhost:9000/archive`

---

## 📋 **Next Steps for Newsletter Management**

1. **Access Admin Dashboard**: Visit `/admin` 
2. **Use Firebase Demo**: Create newsletter documents via `/admin/firebase-demo`
3. **Test Archive**: View results at `/archive`
4. **Process PDFs**: Use `/admin/pdf-extraction` for text extraction

The structure is now clean, organized, and provides clear navigation paths for both public users and administrators!
