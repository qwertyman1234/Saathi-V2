# Insurance Vault System - Setup & Testing Guide

**Status**: ✅ Backend scaffold created | ⏳ MongoDB configuration needed | ⏳ Backend testing

---

## 🚀 IMMEDIATE NEXT STEPS

### Option 1: Use MongoDB Atlas (Cloud - Recommended for Quick Start)
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/insurance-vault`
5. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://youruser:yourpass@yourcluster.mongodb.net/insurance-vault
   ```

### Option 2: Use Docker (Local MongoDB)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
# Update backend/.env to: MONGODB_URI=mongodb://localhost:27017/insurance-vault
```

### Option 3: Install MongoDB Locally (Windows)
1. Download: [mongodb.com/try/download/community](https://mongodb.com/try/download/community)
2. Install with default settings
3. MongoDB Community Server runs automatically
4. Your `.env` already has: `MONGODB_URI=mongodb://localhost:27017/insurance-vault`

---

## 📋 CONFIGURATION CHECKLIST

Your `.env` file has been created at `backend/.env` with:

- [x] PORT=5000 (backend server port)
- [x] NODE_ENV=development
- [x] MONGODB_URI (configured for local MongoDB)
- [x] FIREBASE_SERVICE_ACCOUNT_KEY (placeholder - needs your actual credentials)
- [x] ENCRYPTION_KEY (development key)

### What You MUST Update:

**1. Firebase Credentials** (Required to run backend)
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Navigate to: `Project Settings > Service Accounts > Generate New Private Key`
   - Copy the entire JSON
   - Replace the placeholder in `backend/.env` under `FIREBASE_SERVICE_ACCOUNT_KEY`

**2. MongoDB Connection** (Choose one)
   - Option A: Use MongoDB Atlas (easiest)
   - Option B: Install/run MongoDB locally or via Docker
   - Option C: Use test/mock database (not recommended for production)

**3. OPTIONAL: Anthropic API Key** (Skip for now - mock extraction works)
   - For real Claude AI integration later
   - Get from: [console.anthropic.com](https://console.anthropic.com)

---

## ✅ CURRENT SETUP STATUS

| Item | Status | Notes |
|------|--------|-------|
| Backend files | ✅ Created | 9 files, ready to run |
| Frontend components | ✅ Created | 8 components, ready to import |
| TypeScript config | ✅ Ready | tsconfig.json configured |
| Dependencies installed | ✅ Done | 299 packages, 8 vulnerabilities (low) |
| .env file | ✅ Created | Needs your credentials |
| MongoDB | ⏳ Setup | Choose: Atlas, Docker, or Local |
| Firebase credentials | ⏳ Setup | Needed for backend to run |

---

## 🧪 TESTING WORKFLOW

### Step 1: Set Up Database
Pick one approach:

**MongoDB Atlas (Recommended - 2 minutes)**
```bash
# 1. Create free account + cluster at mongodb.com/cloud/atlas
# 2. Get connection string from "Connect" button
# 3. Update backend/.env:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/insurance-vault
```

**Docker (If you have Docker installed)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
# Connection string: mongodb://localhost:27017/insurance-vault
```

**Local MongoDB**
```bash
# Install from mongodb.com/try/download/community
# Runs automatically, uses: mongodb://localhost:27017/insurance-vault
```

### Step 2: Update Firebase Credentials
```bash
# backend/.env - Replace this entire line with your credentials:
FIREBASE_SERVICE_ACCOUNT_KEY={your actual firebase service account json}
```

### Step 3: Start Backend Server
```bash
cd backend
npm run dev
# Output should show: "✅ Server running on http://localhost:5000"
```

### Step 4: Test API Endpoint
In a new terminal:
```bash
# Test health check (no auth needed)
curl http://localhost:5000/api/vault/health

# Expected output: {"status":"ok"}
```

### Step 5: Add to Frontend
In your React app:
```typescript
import { VaultDashboard } from '@/components/vault/VaultDashboard';

export function InsurancePage() {
  return <VaultDashboard />;
}
```

### Step 6: Test Full Workflow
1. Start backend: `npm run dev` (in backend folder)
2. Start frontend: `npm run dev` (in root folder)
3. Go to page with `<VaultDashboard />`
4. Create family profile
5. Upload document
6. Click "Extract Data"
7. See extracted fields with AI (mock service)
8. Review autofill form

---

## 🆘 TROUBLESHOOTING

### "Error: connect ECONNREFUSED 127.0.0.1:27017"
**Cause**: MongoDB not running
**Fix**: 
- Use MongoDB Atlas (cloud), or
- Start local MongoDB: `mongod`, or
- Use Docker: `docker run -d -p 27017:27017 mongo`

### "Error: Firebase service account not found"
**Cause**: `FIREBASE_SERVICE_ACCOUNT_KEY` is placeholder
**Fix**: 
1. Go to Firebase Console > Your Project
2. Settings > Service Accounts
3. Click "Generate New Private Key"
4. Copy entire JSON to `.env` under `FIREBASE_SERVICE_ACCOUNT_KEY`

### "TypeError: Cannot read property 'project_id' of undefined"
**Cause**: Firebase credentials not properly set
**Fix**: Verify `.env` has valid JSON for `FIREBASE_SERVICE_ACCOUNT_KEY`

### "ENOENT: no such file or directory, open 'uploads/...'"
**Cause**: Missing uploads directory
**Fix**: Create it manually:
```bash
mkdir backend/uploads
```

### "Port 5000 already in use"
**Cause**: Another process using port 5000
**Fix**: Change port in `.env` or kill the process:
```bash
# Change in .env:
PORT=5001
```

---

## 📊 FEATURE TEST CHECKLIST

Once everything is running, test these features:

### Family Profiles
- [ ] Create new family profile (Self, Spouse, Child, Parent)
- [ ] Verify all fields save (name, DOB, email, phone, address)
- [ ] Edit profile
- [ ] Delete profile
- [ ] List shows all profiles

### Document Management
- [ ] Upload PDF (should accept)
- [ ] Upload image (should accept)
- [ ] Upload unsupported file (should reject)
- [ ] File larger than 10MB (should reject)
- [ ] List shows all uploaded documents
- [ ] Document shows correct type (Aadhaar, PAN, Policy, etc.)

### AI Extraction
- [ ] Click "Extract Data" on document
- [ ] See extracted fields appear
- [ ] Check confidence scores (0-100%)
- [ ] Verify sensitive data is masked in preview
- [ ] Toggle "Show Sensitive Data" in preview
- [ ] See standardized data format

### Autofill System
- [ ] Select form schema (Policy Purchase, Claim Form, Identity)
- [ ] Form fields populated with extracted data
- [ ] See confidence indicators (green/yellow/red)
- [ ] Edit a field value
- [ ] Confidence score updates on edit
- [ ] Submit form (should log data)

### Security
- [ ] Unauthorized request returns 401
- [ ] Invalid token returns 401
- [ ] CORS works from frontend
- [ ] File validation enforces size/type

---

## 🔧 COMMON TASKS

### Add More Document Types
File: `backend/src/services/aiExtractionService.ts`

Find `const documentTypeConfig` and add:
```typescript
MEDICAL_TEST_REPORT: {
  extractedFields: ['test_name', 'date', 'doctor_name', 'results']
}
```

### Customize Form Schema
File: `src/lib/vault/autofill.ts`

Add to `FORM_SCHEMAS`:
```typescript
CUSTOM_FORM: {
  name: 'My Custom Form',
  schema: {
    field_name: {
      documentType: 'INSURANCE_POLICY',
      extractField: 'policy_number',
      label: 'Policy Number'
    }
  }
}
```

### Replace Mock AI with Real Claude
File: `backend/src/services/aiExtractionService.ts`

Replace `mockExtraction()` function:
```typescript
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [{
      type: 'image',
      source: { type: 'base64', media_type: 'image/pdf', data: imageData }
    }, {
      type: 'text',
      text: 'Extract: name, DOB, address, policy number...'
    }]
  }]
});
```

### Move to Cloud Deployment
1. **Backend**: Deploy to Railway, Render, Heroku
2. **Database**: Use MongoDB Atlas (already set up)
3. **Frontend**: Deploy to Vercel, Netlify
4. **Files**: Move uploads to AWS S3 (update aiExtractionService)

---

## 📈 PRODUCTION CHECKLIST

Before deploying to production:

- [ ] Update Firebase credentials for production project
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Change encryption key to 32 random characters
- [ ] Add HTTPS certificate
- [ ] Set NODE_ENV=production
- [ ] Replace mock AI with real Claude API
- [ ] Set up file encryption
- [ ] Configure S3 for file storage
- [ ] Add audit logging
- [ ] Set up error monitoring (Sentry)
- [ ] Load test with expected user count
- [ ] Database backup strategy
- [ ] Rate limiting on API
- [ ] API key rotation policy

---

## 📞 NEXT STEPS IN ORDER

1. **Pick MongoDB setup** (Atlas is fastest)
   - Time: 2-5 minutes
   
2. **Get Firebase credentials**
   - Time: 2 minutes

3. **Update `.env` file**
   - Time: 1 minute

4. **Start backend** (`npm run dev`)
   - Time: 10 seconds

5. **Test API** (curl request)
   - Time: 1 minute

6. **Import component** to your page
   - Time: 2 minutes

7. **Test full workflow**
   - Time: 5 minutes

**Total time to full working system**: ~15 minutes ⏱️

---

## ✨ CURRENT SYSTEM STATE

**Backend**: Ready to run (waiting for MongoDB + Firebase)
**Frontend**: Ready to import (works standalone or with backend)
**Database**: Schema defined, needs connection
**AI**: Mock service active, ready for Claude upgrade
**Documentation**: Complete

You're about 80% done. Just need:
1. MongoDB + Firebase credentials (5 minutes)
2. Start backend (10 seconds)
3. Add component to page (2 minutes)

Let's get this running! 🚀
