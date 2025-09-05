# Firebase Storage Manual Upload Guide

**Goal:** Upload 44 local PDFs to Firebase Storage for processing by the metadata extraction script.

---

## 🎯 Firebase Storage Structure

Upload your PDFs to this structure in Firebase Storage:

```
📁 newsletters/
├── 2014.summer-conashaugh-courier.pdf
├── 2014.winter-conashaugh-courier.pdf
├── 2015.summer-conashaugh-courier.pdf
├── 2015.winter-conashaugh-courier.pdf
└── ... (all 44 PDFs)
```

---

## 📋 Step-by-Step Upload Process

### Option A: Firebase Console (Recommended)

1. **Open Firebase Console**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Select your CLCA Courier project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click "Get started" if this is first time

3. **Create Folder Structure**
   - Click "Create folder" → Name it `newsletters`
   - Inside `newsletters`, create another folder called `pdfs`

4. **Upload PDFs**
   - Navigate to `newsletters/pdfs/` folder
   - Click "Upload file" or drag and drop
   - Select all 44 PDFs from your `public/issues/` directory
   - Wait for upload to complete (should take 5-15 minutes depending on connection)

### Option B: Firebase CLI (Alternative)

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy storage files (if you have a deployment script)
firebase deploy --only storage

# Or use gsutil if you have Google Cloud SDK
gsutil -m cp public/issues/*.pdf gs://your-project-id.appspot.com/newsletters/pdfs/
```

---

## ✅ **After Upload: Run Metadata Extraction**

Once your PDFs are uploaded to Firebase Storage, run the metadata extraction script:

```bash
# Extract metadata from uploaded PDFs and create Firestore documents
npm run extract-metadata

# Generate thumbnails (optional - can be done later)
npm run generate-thumbnails

# Or run both at once
npm run setup-newsletters
```

---

## 🔍 **What the Script Does**

The `extract-pdf-metadata.js` script will:

1. **Scan Firebase Storage** for PDFs in `newsletters/pdfs/`
2. **Extract metadata** from filenames:
   - Year and season from filename patterns
   - Generate title and issue numbers
   - Create appropriate tags
3. **Create Firestore documents** with:
   - Newsletter metadata
   - Firebase Storage download URLs
   - Placeholder fields for thumbnails and text content
4. **Log progress** and save results to `temp/metadata-extraction-results.json`

---

## 📊 **Expected Results**

After running the script, you should have:

- **44 Firestore documents** in the `newsletters` collection
- **Complete metadata** for each newsletter
- **Download URLs** pointing to Firebase Storage
- **Structured data** ready for the archive interface

Example Firestore document structure:

```json
{
  "id": "newsletter-2024-summer",
  "filename": "2024.summer-conashaugh-courier.pdf",
  "title": "Conashaugh Courier",
  "year": 2024,
  "season": "summer",
  "downloadUrl": "https://firebasestorage.googleapis.com/...",
  "storageRef": "newsletters/pdfs/2024.summer-conashaugh-courier.pdf",
  "fileSize": 5242880,
  "tags": ["newsletter", "conashaugh", "courier", "summer", "2024", "2020s"],
  "isPublished": true,
  "actions": {
    "canView": true,
    "canDownload": true,
    "canSearch": false,
    "hasThumbnail": false
  }
}
```

---

## 🚨 **Troubleshooting**

### Upload Issues

- **Large files**: Firebase Storage supports files up to 5TB
- **Network timeout**: Try uploading in smaller batches
- **Permission errors**: Ensure you're logged into the correct Firebase account

### Script Issues

- **Environment variables**: Ensure `.env` file has correct Firebase config
- **Firebase connection**: Check your Firebase project ID and credentials
- **File not found**: Verify PDFs are in the correct `newsletters/pdfs/` path

### Verification

```bash
# Check if uploads worked
# Look in Firebase Console → Storage → newsletters/pdfs/

# Check if metadata extraction worked
# Look in Firebase Console → Firestore → newsletters collection

# Check script output
cat temp/metadata-extraction-results.json
```

---

## 🔄 **Next Steps After Upload**

1. **Verify uploads** in Firebase Console
2. **Run metadata extraction** script
3. **Check Firestore documents** were created
4. **Test archive interface** at `/archive`
5. **Generate thumbnails** (next script)
6. **Extract PDF text** for search functionality

---

**Ready to upload?** Once you've uploaded the PDFs to Firebase Storage, let me know and we'll run the metadata extraction script!
